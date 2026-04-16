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
  // Columns: stripe_event_id, event_type, payload (processed_at has a DB default)
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

    // Columns: stripe_checkout_session_id, email, amount_cents, currency, status, metadata
    // product_id lives in the metadata jsonb since there is no top-level product_id column
    const { data: order, error } = await supabaseAdmin.from("orders").insert({
      stripe_checkout_session_id: session.id,
      email: session.customer_details?.email ?? null,
      amount_cents: session.amount_total,        // Stripe amount_total is already in cents
      currency: session.currency,
      status: session.payment_status,            // "paid" | "unpaid" | "no_payment_required"
      metadata: { product_id: productId },
    }).select("id").single();

    if (error) {
      console.error("[webhook] failed to insert order", error);
      // Return 500 so Stripe retries
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
        max_downloads:  5,
      });

      if (tokenError) {
        console.error("[webhook] failed to create download token", tokenError);
      } else {
        // Send order confirmation email
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

          sendOrderConfirmation({
            toEmail:     customerEmail,
            toName:      customerName,
            productName: product?.name ?? "Your product",
            amountCents: session.amount_total ?? 0,
            currency:    session.currency ?? "usd",
            downloadUrl,
            orderId:     order.id,
          }).catch((err) => {
            console.error("[webhook] failed to send confirmation email", err);
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
