import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";
import SaleNotification from "@/emails/SaleNotification";
import { render } from "@react-email/components";

const resend = new Resend(process.env.RESEND_API_KEY);

const SALE_MINUTES = 30;

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

    // ── 1. Find all pending signups ───────────────────────────────────────────
    const { data: signups, error: signupError } = await supabaseAdmin
      .from("email_signups")
      .select("id, email, product_id")
      .is("notified_at", null);

    if (signupError) {
      console.error("[cron] Supabase signups error:", signupError);
      throw signupError;
    }

    if (!signups || signups.length === 0) {
      return NextResponse.json({ success: true, message: "No pending signups" });
    }

    console.log(`[cron] Found ${signups.length} pending signups`);

    const productIds = [...new Set(signups.map((s) => s.product_id))];

    // ── 2. Check which products have an active sale ───────────────────────────
    const activeProductIds: string[] = [];

    for (const productId of productIds) {
      const { data: activeTimers, error: timerError } = await supabaseAdmin
        .from("visitor_timers")
        .select("expires_at")
        .eq("product_id", productId)
        .gt("expires_at", new Date(now).toISOString())
        .limit(1);

      if (timerError) {
        console.error(`[cron] Timer query error for ${productId}:`, timerError);
        continue;
      }

      console.log(`[cron] Product ${productId} active timers:`, activeTimers?.length ?? 0);

      if (activeTimers && activeTimers.length > 0) {
        activeProductIds.push(productId);
      }
    }

    if (activeProductIds.length === 0) {
      console.log("[cron] No active sales found");
      return NextResponse.json({ success: true, message: "No active sales found" });
    }

    console.log(`[cron] Active products: ${activeProductIds.join(", ")}`);

    // ── 3. Fetch product details ──────────────────────────────────────────────
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, sale_price_cents, regular_price_cents")
      .in("id", activeProductIds);

    if (productsError) {
      console.error("[cron] Products fetch error:", productsError);
    }

    console.log(`[cron] Products fetched:`, products?.map(p => p.name));

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));

    // ── 4. Send emails one by one with full error logging ─────────────────────
    let totalSent = 0;
    const successfulIds: string[] = [];

    for (const productId of activeProductIds) {
      const productSignups = signups.filter((s) => s.product_id === productId);
      if (productSignups.length === 0) continue;

      const product = productMap.get(productId);
      const productName = product?.name ?? "AI Digital Product";
      const salePrice = product?.sale_price_cents
        ? `$${(product.sale_price_cents / 100).toFixed(2)}`
        : "";
      const wasPrice = product?.regular_price_cents
        ? `$${(product.regular_price_cents / 100).toFixed(2)}`
        : "";
      const expiresAt = new Date(now + SALE_MINUTES * 60 * 1000).toISOString();

      console.log(`[cron] Sending to ${productSignups.length} subscribers for "${productName}"`);

      for (const signup of productSignups) {
        try {
          const result = await resend.emails.send({
            from: "AI Digital Products <deals@aidigitalproducts.com>",
            to: signup.email,
            subject: "🔥 Your deal is LIVE — 30 minutes only",
            html: await render(SaleNotification({
            productName,
            productUrl: "https://aidigitalproducts.com/products",
            expiresAt,
            salePrice,
            wasPrice,
             })),
          });

          console.log(`[cron] Resend result for ${signup.email}:`, JSON.stringify(result));

          if (result.error) {
            console.error(`[cron] Resend error for ${signup.email}:`, result.error);
          } else {
            totalSent++;
            successfulIds.push(signup.id);
            console.log(`[cron] Successfully sent to ${signup.email}`);
          }
        } catch (emailErr) {
          console.error(`[cron] Exception sending to ${signup.email}:`, emailErr);
        }
      }
    }

    // ── 5. Only stamp notified_at for successfully sent emails ────────────────
    if (successfulIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("email_signups")
        .update({ notified_at: new Date().toISOString() })
        .in("id", successfulIds);

      if (updateError) {
        console.error("[cron] Failed to stamp notified_at:", updateError);
      } else {
        console.log(`[cron] Stamped notified_at for ${successfulIds.length} signups`);
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      activeProducts: activeProductIds.length,
    });

  } catch (err) {
    console.error("[cron/send-notifications] Fatal error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}