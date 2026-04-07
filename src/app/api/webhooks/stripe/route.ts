import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
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
    const { error } = await supabaseAdmin.from("orders").insert({
      stripe_checkout_session_id: session.id,
      email: session.customer_details?.email ?? null,
      amount_cents: session.amount_total,        // Stripe amount_total is already in cents
      currency: session.currency,
      status: session.payment_status,            // "paid" | "unpaid" | "no_payment_required"
      metadata: { product_id: productId },
    });

    if (error) {
      console.error("[webhook] failed to insert order", error);
      // Return 500 so Stripe retries
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
