# Refund/dispute UI: refund button with Connect-aware transfer reversal,
# dispute tracking, and payment-intent capture fix in the webhook.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\api\admin\orders\[id]\refund" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

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

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      // When this order had a Connect split, unwind BOTH sides in the same
      // call — the vendor's transferred payout gets reversed and the
      // platform's application fee gets refunded too, so nobody keeps
      // money on a transaction that's being fully refunded.
      ...(hasVendorSplit ? { reverse_transfer: true, refund_application_fee: true } : {}),
    });

    await supabaseAdmin.from("orders").update({ status: "refunded" }).eq("id", id);

    // Vendor notification is intentionally non-fatal — a failed email
    // should never make the refund itself look like it failed.
    if (hasVendorSplit && order.vendor_id) {
      try {
        const { data: vendorProfile } = await supabaseAdmin
          .from("vendor_profiles")
          .select("email, display_name")
          .eq("id", order.vendor_id)
          .single();

        if (vendorProfile?.email) {
          // TODO: wire in the actual email send once src/lib/email.ts's
          // pattern is confirmed — see sendOrderConfirmation for reference.
          console.log(
            `[refund] Vendor notification pending: ${vendorProfile.email} — order ${id} refunded, ` +
            `$${((order.vendor_payout_cents ?? 0) / 100).toFixed(2)} payout reversed.`
          );
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
'@
Set-Content -LiteralPath "src\app\api\admin\orders\[id]\refund\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\orders\[id]\refund\route.ts" -ForegroundColor Green

$content = @'
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
'@
Set-Content -LiteralPath "src\app\api\webhooks\stripe\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\webhooks\stripe\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Order {
  id: string;
  email: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
  metadata: { product_id?: string } | null;
  vendor_id: string | null;
  platform_fee_cents: number | null;
  vendor_payout_cents: number | null;
  dispute_status: string | null;
  disputed_at: string | null;
}

function OrdersContent() {
  const { token } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/orders", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleRefund(order: Order) {
    const confirmed = window.confirm(
      `Refund this $${((order.amount_cents ?? 0) / 100).toFixed(2)} order for ${order.email ?? "this customer"}? ` +
      `This cannot be undone.` +
      (order.vendor_id ? ` The vendor's payout for this order will also be reversed.` : "")
    );
    if (!confirmed) return;

    setRefundingId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
      </div>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ border: "1px solid var(--line)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
              {["Email", "Amount", "Status", "Date", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>No orders yet.</td></tr>
            ) : orders.map((o, i) => {
              const isRefunded = o.status === "refunded";
              const isDisputed = !!o.dispute_status;
              const hasSplit = !!o.vendor_id && o.platform_fee_cents != null;

              return (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--line-soft)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)" }}>
                  <td style={{ padding: "10px 14px", color: "var(--ink)" }}>{o.email ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--ink)" }}>
                    {o.amount_cents != null ? `$${(o.amount_cents / 100).toFixed(2)}` : "—"}
                    {hasSplit && (
                      <div style={{ fontSize: "11px", fontWeight: 400, color: "var(--ink-mute)", marginTop: "2px" }}>
                        Fee: ${((o.platform_fee_cents ?? 0) / 100).toFixed(2)} · Vendor: ${((o.vendor_payout_cents ?? 0) / 100).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: isRefunded ? "#8a6d1a" : o.status === "paid" ? "#16a34a" : "var(--ink-mute)", textTransform: "uppercase" }}>
                      {o.status ?? "—"}
                    </span>
                    {isDisputed && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#c0392b", textTransform: "uppercase", marginTop: "2px" }}>
                        Disputed: {o.dispute_status}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {!isRefunded && (
                      <button
                        onClick={() => handleRefund(o)}
                        disabled={refundingId === o.id}
                        className="btn btn-ghost btn-sm"
                        style={{ color: "#c0392b", opacity: refundingId === o.id ? 0.6 : 1 }}
                      >
                        {refundingId === o.id ? "Refunding…" : "Refund"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AdminShell title="Orders">
      <OrdersContent />
    </AdminShell>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\orders\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\orders\page.tsx" -ForegroundColor Green

Write-Host "`nAll 3 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan