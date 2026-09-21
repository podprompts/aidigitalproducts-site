import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/email";
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
    }).select("id").single();

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
            licenseType,
            licenseUrl: licenseType === "plr" ? `${siteUrl}/plr-license` : undefined,
          }).catch((err) => {
            console.error("[webhook] failed to send confirmation email", err);
          });
        }
      }
    }
  }

  // Track disputes on orders — matched by payment intent, since a Dispute
  // object references the charge, not the checkout session directly.
  if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId =
      typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;

    if (paymentIntentId) {
      const { error: disputeUpdateError } = await supabaseAdmin
        .from("orders")
        .update({
          dispute_status: dispute.status,
          disputed_at: event.type === "charge.dispute.created" ? new Date().toISOString() : undefined,
        })
        .eq("stripe_payment_intent_id", paymentIntentId);

      if (disputeUpdateError) {
        console.error("[webhook] failed to record dispute", disputeUpdateError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
