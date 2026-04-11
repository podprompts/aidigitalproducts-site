import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";
import SaleNotification from "@/emails/SaleNotification";

const resend = new Resend(process.env.RESEND_API_KEY);

const SALE_MINUTES  = 30;
const REGULAR_HOURS = 4;

// Vercel Cron secret — add CRON_SECRET to your Vercel env vars
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();

    // ── 1. Find all products that have active subscribers waiting ─────────────
    const { data: signups, error: signupError } = await supabaseAdmin
      .from("email_signups")
      .select("id, email, product_id")
      .is("notified_at", null);

    if (signupError) throw signupError;
    if (!signups || signups.length === 0) {
      return NextResponse.json({ success: true, message: "No pending signups" });
    }

    // Get unique product IDs that have pending signups
    const productIds = [...new Set(signups.map((s) => s.product_id))];

    // ── 2. For each product, check if a sale is currently active ──────────────
    const activeProductIds: string[] = [];

    for (const productId of productIds) {
      // Get the most recent timer for this product across all IPs
      // A sale is active if ANY visitor_timer for this product has:
      // - expires_at in the future (Phase 1 — sale window active)
      const { data: activeTimers } = await supabaseAdmin
        .from("visitor_timers")
        .select("expires_at")
        .eq("product_id", productId)
        .gt("expires_at", new Date(now).toISOString())
        .limit(1);

      if (activeTimers && activeTimers.length > 0) {
        activeProductIds.push(productId);
      }
    }

    if (activeProductIds.length === 0) {
      return NextResponse.json({ success: true, message: "No active sales found" });
    }

    // ── 3. Fetch product details for active products ───────────────────────────
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, sale_price_cents, regular_price_cents")
      .in("id", activeProductIds);

    const productMap = new Map(
      (products ?? []).map((p) => [p.id, p])
    );

    // ── 4. Send emails for each active product ────────────────────────────────
    let totalSent = 0;
    const notifiedIds: string[] = [];

    for (const productId of activeProductIds) {
      const productSignups = signups.filter((s) => s.product_id === productId);
      if (productSignups.length === 0) continue;

      const product = productMap.get(productId);
      const productName = product?.name ?? "AI Digital Product";
      const salePrice   = product?.sale_price_cents
        ? `$${(product.sale_price_cents / 100).toFixed(2)}`
        : "";
      const wasPrice    = product?.regular_price_cents
        ? `$${(product.regular_price_cents / 100).toFixed(2)}`
        : "";

      // Calculate expiresAt — sale window is 30 min from now
      const expiresAt = new Date(now + SALE_MINUTES * 60 * 1000).toISOString();

      // Send in batches of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < productSignups.length; i += BATCH_SIZE) {
        const batch = productSignups.slice(i, i + BATCH_SIZE);

        await Promise.allSettled(
          batch.map((signup) =>
            resend.emails.send({
              from: "AI Digital Products <deals@aidigitalproducts.com>",
              to: signup.email,
              subject: "🔥 Your deal is LIVE — 30 minutes only",
              react: SaleNotification({
                productName,
                productUrl: "https://aidigitalproducts.com/products",
                expiresAt,
                salePrice,
                wasPrice,
              }),
            })
          )
        );

        totalSent += batch.length;
        notifiedIds.push(...batch.map((s) => s.id));
      }
    }

    // ── 5. Stamp notified_at so we never double-send ───────────────────────────
    if (notifiedIds.length > 0) {
      await supabaseAdmin
        .from("email_signups")
        .update({ notified_at: new Date().toISOString() })
        .in("id", notifiedIds);
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      activeProducts: activeProductIds.length,
    });

  } catch (err) {
    console.error("[cron/send-notifications]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}