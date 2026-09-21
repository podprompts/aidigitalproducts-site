import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendOrderConfirmation, sendAdminDisputeAlert } from "@/lib/email";
import { notifyVendorOfRefund } from "@/lib/refund-notifications";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Record the raw event for idempotency / audit
  const { error: webhookInsertError } = await supabaseAdmin
    .from("webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
    });

  if (webhookInsertError) {
    // Duplicate event_id means we already processed this — acknowledge and stop
    if (webhookInsertError.code === "23505") {
      return NextResponse.json({ received: true });
    }
    console.error("[webhook] failed to record event", webhookInsertError);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productId = session.metadata?.productId ?? null;
    const licenseType: "personal" | "plr" =
      session.metadata?.licenseType === "plr" ? "plr" : "personal";

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    // Vendor payout split — only present when checkout actually applied one.
    // Absent for the platform's own products or a vendor with no connected
    // Stripe account, in which case these all stay null, matching today's
    // behavior exactly.
    const vendorId = session.metadata?.vendorId || null;
    const platformFeeCentsRaw = session.metadata?.platformFeeCents;
    const platformFeeCents =
      platformFeeCentsRaw && platformFeeCentsRaw !== "" ? parseInt(platformFeeCentsRaw, 10) : null;
    const vendorPayoutCents =
      platformFeeCents !== null && session.amount_total !== null
        ? session.amount_total - platformFeeCents
        : null;

    const { data: order, error } = await supabaseAdmin.from("orders").insert({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      email: session.customer_details?.email ?? null,
      amount_cents: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      license_type: licenseType,
      vendor_id: vendorId,
      platform_fee_cents: platformFeeCents,
      vendor_payout_cents: vendorPayoutCents,
      metadata: { product_id: productId, license_type: licenseType },
    }).select("id, order_number").single();

    if (error) {
      console.error("[webhook] failed to insert order", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    // Increment purchase counter — non-fatal if it fails
    if (productId) {
      const { error: rpcError } = await supabaseAdmin.rpc("increment_purchases", {
        product_id: productId,
      });
      if (rpcError) {
        console.error("[webhook] increment_purchases failed", rpcError);
      }
    }

    // Generate a review token — matches the review_tokens table's real,
    // pre-existing schema (customer_email/customer_name denormalized onto
    // the token row, a plain "used" boolean, an expires_at window) rather
    // than the schema I originally designed from scratch, which didn't
    // match what was actually already in the database.
    if (productId && order?.id) {
      const reviewCustomerEmail = session.customer_details?.email;
      if (reviewCustomerEmail) {
        const reviewToken = crypto.randomUUID();
        const reviewExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        const { error: reviewTokenError } = await supabaseAdmin.from("review_tokens").insert({
          token: reviewToken,
          order_id: order.id,
          product_id: productId,
          customer_email: reviewCustomerEmail,
          customer_name: session.customer_details?.name ?? null,
          expires_at: reviewExpiresAt,
          used: false,
        });
        if (reviewTokenError) {
          console.error("[webhook] failed to create review token", reviewTokenError);
        }
      }
    }

    // Generate download token and send confirmation email — non-fatal if either fails
    if (productId && order?.id) {
      const token     = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: tokenError } = await supabaseAdmin.from("download_tokens").insert({
        order_id:       order.id,
        product_id:     productId,
        token,
        expires_at:     expiresAt,
        download_count: 0,
        max_downloads:  15,
      });

      if (tokenError) {
        console.error("[webhook] failed to create download token", tokenError);
      } else {
        const customerEmail = session.customer_details?.email;
        const customerName  = session.customer_details?.name ?? undefined;

        if (customerEmail) {
          const { data: product } = await supabaseAdmin
            .from("products")
            .select("name")
            .eq("id", productId)
            .single();

          const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
          const downloadUrl = `${siteUrl}/checkout/success?token=${token}`;

          // Check for multi-file product_files rows
          const { data: productFiles } = await supabaseAdmin
            .from("product_files")
            .select("file_name, sort_order")
            .eq("product_id", productId)
            .order("sort_order", { ascending: true });

          // Build downloadFiles array if multi-file product, otherwise fall back to single URL
          const downloadFiles =
            productFiles && productFiles.length > 0
              ? productFiles.map((f, i) => ({
                  file_name: f.file_name,
                  url: `${siteUrl}/api/download/${token}?file=${i}`,
                }))
              : [{ file_name: product?.name ?? "Your product", url: downloadUrl }];

          // NOTE: sendOrderConfirmation needs to accept and render these two new
          // fields — see the follow-up note about src/lib/email.ts below.
          sendOrderConfirmation({
            toEmail:      customerEmail,
            toName:       customerName,
            productName:  product?.name ?? "Your product",
            amountCents:  session.amount_total ?? 0,
            currency:     session.currency ?? "usd",
            downloadFiles,
            orderId:      order.id,
            orderNumber:  order.order_number ?? undefined,
            licenseType,
            licenseUrl: licenseType === "plr" ? `${siteUrl}/plr-license` : undefined,
          }).catch((err) => {
            console.error("[webhook] failed to send confirmation email", err);
          });
        }
      }
    }
  }

  // Refunds issued outside the admin Orders page (for example directly in
// Stripe). Full refunds only. The status flip is conditional so the admin
// refund route and this handler never both email the vendor.
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

    if (paymentIntentId && charge.refunded) {
      const { data: flipped, error: refundUpdateError } = await supabaseAdmin
        .from("orders")
        .update({ status: "refunded" })
        .eq("stripe_payment_intent_id", paymentIntentId)
        .or("status.is.null,status.neq.refunded")
        .select("id, vendor_id, platform_fee_cents, vendor_payout_cents, amount_cents, currency, metadata");

      if (refundUpdateError) {
        console.error("[webhook] failed to record refund", refundUpdateError);
      } else {
        for (const o of flipped ?? []) {
          await notifyVendorOfRefund(o);
        }
      }
    }
  }

  // Track disputes on orders - matched by payment intent, since a Dispute
  // object references the charge, not the checkout session directly.
  // A lost dispute marks the order as a chargeback (excluded from vendor
  // totals). There is deliberately NO automatic vendor clawback.
  if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId =
      typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;

    if (paymentIntentId) {
      const patch: { dispute_status: string; disputed_at?: string } = { dispute_status: dispute.status };
      if (event.type === "charge.dispute.created") patch.disputed_at = new Date().toISOString();

      const { error: disputeUpdateError } = await supabaseAdmin
        .from("orders")
        .update(patch)
        .eq("stripe_payment_intent_id", paymentIntentId);
      if (disputeUpdateError) {
        console.error("[webhook] failed to record dispute", disputeUpdateError);
      }

      if (event.type === "charge.dispute.closed" && dispute.status === "lost") {
        const { error: chargebackError } = await supabaseAdmin
          .from("orders")
          .update({ status: "chargeback" })
          .eq("stripe_payment_intent_id", paymentIntentId)
          .or("status.is.null,status.neq.refunded");
        if (chargebackError) {
          console.error("[webhook] failed to mark chargeback", chargebackError);
        }
      }

      const kind =
        event.type === "charge.dispute.created"
          ? "opened"
          : dispute.status === "won"
          ? "won"
          : dispute.status === "lost"
          ? "lost"
          : null;

      if (kind) {
        try {
          const { data: disputedOrder } = await supabaseAdmin
            .from("orders")
            .select("order_number")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .limit(1)
            .maybeSingle();
          await sendAdminDisputeAlert({
            kind,
            orderNumber: disputedOrder?.order_number ?? null,
            amountCents: dispute.amount,
            currency: dispute.currency,
            reason: dispute.reason ?? null,
            evidenceDueBy: dispute.evidence_details?.due_by ?? null,
            disputeId: dispute.id,
          });
        } catch (alertErr) {
          console.error("[webhook] failed to send dispute alert (non-fatal)", alertErr);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
