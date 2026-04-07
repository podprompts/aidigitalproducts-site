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
  await supabaseAdmin.from("webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    payload: event,
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productId = session.metadata?.productId ?? null;

    // Upsert order
    const { error } = await supabaseAdmin.from("orders").insert({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email ?? null,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      product_id: productId,
    });

    if (error) {
      console.error("[webhook] failed to insert order", error);
      // Return 500 so Stripe retries
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
