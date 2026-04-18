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

    const { data: order, error } = await supabaseAdmin.from("orders").insert({
      stripe_checkout_session_id: session.id,
      email: session.customer_details?.email ?? null,
      amount_cents: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      metadata: { product_id: productId },
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

          sendOrderConfirmation({
            toEmail:      customerEmail,
            toName:       customerName,
            productName:  product?.name ?? "Your product",
            amountCents:  session.amount_total ?? 0,
            currency:     session.currency ?? "usd",
            downloadFiles,
            orderId:      order.id,
          }).catch((err) => {
            console.error("[webhook] failed to send confirmation email", err);
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}