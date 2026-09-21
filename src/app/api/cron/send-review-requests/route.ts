import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendReviewRequestEmail } from "@/lib/email";

// How long after purchase to wait before inviting a review — long enough
// that the buyer has likely actually used the product, matching the
// deliberate design decision to not ask immediately at checkout.
const DELAY_DAYS = 3;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - DELAY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Qualifying tokens: not yet invited, not yet used, old enough to have
    // likely been actually used by the buyer, and not already expired
    // (no point inviting for a dead link).
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("review_tokens")
      .select("id, token, product_id, customer_email, customer_name, created_at, expires_at")
      .is("invited_at", null)
      .eq("used", false)
      .lte("created_at", cutoff)
      .gt("expires_at", now);

    if (tokensError) {
      console.error("[cron/send-review-requests] failed to fetch tokens", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ success: true, message: "No pending review invites" });
    }

    console.log(`[cron/send-review-requests] Found ${tokens.length} pending review invites`);

    const productIds = [...new Set(tokens.map((t) => t.product_id))];
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name")
      .in("id", productIds);
    const productMap = new Map((products ?? []).map((p) => [p.id, p.name]));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
    let totalSent = 0;
    const successfulIds: string[] = [];

    for (const t of tokens) {
      const productName = productMap.get(t.product_id) ?? "your purchase";
      try {
        await sendReviewRequestEmail({
          toEmail: t.customer_email,
          toName: t.customer_name ?? undefined,
          productName,
          reviewUrl: `${siteUrl}/review/${t.token}`,
        });
        totalSent++;
        successfulIds.push(t.id);
      } catch (emailErr) {
        console.error(`[cron/send-review-requests] Failed to send to ${t.customer_email}`, emailErr);
      }
    }

    // Only stamp invited_at for successfully sent emails — a transient
    // failure should let this token be retried on the next cron run,
    // not silently marked as invited when it wasn't.
    if (successfulIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("review_tokens")
        .update({ invited_at: new Date().toISOString() })
        .in("id", successfulIds);

      if (updateError) {
        console.error("[cron/send-review-requests] Failed to stamp invited_at", updateError);
      }
    }

    return NextResponse.json({ success: true, sent: totalSent, found: tokens.length });
  } catch (err) {
    console.error("[cron/send-review-requests] Fatal error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
