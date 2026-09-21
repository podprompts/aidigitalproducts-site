import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendVendorRefundNotification } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "refunded") {
    return NextResponse.json({ error: "This order has already been refunded" }, { status: 400 });
  }

  // Prefer the stored payment intent ID; fall back to looking it up from
  // the checkout session for older orders where the webhook hadn't yet
  // been fixed to capture it directly.
  let paymentIntentId: string | null = order.stripe_payment_intent_id;
  if (!paymentIntentId && order.stripe_checkout_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    } catch (err) {
      console.error("[refund] Failed to look up payment intent from checkout session", err);
    }
  }

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "Could not find a Stripe payment to refund for this order" },
      { status: 400 }
    );
  }

  // Full refunds only — see product policy discussion. A partial refund
  // tool for digital goods isn't the industry norm and isn't built here.
  const hasVendorSplit = !!order.vendor_id && order.platform_fee_cents != null;

  // Where did this refund come from? The support queue sends source: "support_request".
  let refundSource = "admin_orders";
  try {
    const b = await req.json();
    if (b?.source === "support_request") refundSource = "admin_support";
  } catch {
    // no body - refunded from the Orders page
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      // When this order had a Connect split, unwind BOTH sides in the same
      // call — the vendor's transferred payout gets reversed and the
      // platform's application fee gets refunded too, so nobody keeps
      // money on a transaction that's being fully refunded.
      ...(hasVendorSplit ? { reverse_transfer: true, refund_application_fee: true } : {}),
    });

    const { data: flipped } = await supabaseAdmin
      .from("orders")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
        refund_source: refundSource,
        refund_stripe_id: refund.id,
        refunded_amount_cents: refund.amount,
      })
      .eq("id", id)
      .or("status.is.null,status.neq.refunded")
      .select("id");

    // Vendor notification is intentionally non-fatal — a failed email
    // should never make the refund itself look like it failed.
    if (flipped && flipped.length > 0 && hasVendorSplit && order.vendor_id) {
      try {
        const { data: vendorProfile } = await supabaseAdmin
          .from("vendor_profiles")
          .select("email, display_name")
          .eq("id", order.vendor_id)
          .single();

        const productId = (order.metadata as { product_id?: string } | null)?.product_id;
        const { data: product } = productId
          ? await supabaseAdmin.from("products").select("name").eq("id", productId).single()
          : { data: null };

        if (vendorProfile?.email) {
          await sendVendorRefundNotification({
            toEmail: vendorProfile.email,
            toName: vendorProfile.display_name ?? undefined,
            productName: product?.name ?? "Your product",
            amountCents: order.amount_cents ?? 0,
            currency: order.currency ?? "usd",
            vendorPayoutCents: order.vendor_payout_cents ?? 0,
            orderId: order.id,
          });
        }
      } catch (err) {
        console.error("[refund] Failed to notify vendor (non-fatal)", err);
      }
    }

    return NextResponse.json({ ok: true, refundId: refund.id, amount: refund.amount });
  } catch (err) {
    console.error("[refund] Stripe refund failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed" },
      { status: 502 }
    );
  }
}