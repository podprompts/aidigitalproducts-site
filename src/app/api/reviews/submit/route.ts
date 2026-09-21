import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { recalculateProductRating } from "@/lib/reviews";


export async function POST(req: NextRequest) {
  let body: { token?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { token, rating, comment } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating must be a whole number between 1 and 5" }, { status: 400 });
  }

  // Re-validate the token server-side — never trust the client's own
  // rendered state, since it could be stale or tampered with.
  const { data: reviewToken } = await supabaseAdmin
    .from("review_tokens")
    .select("product_id, order_id, customer_name, used, expires_at")
    .eq("token", token)
    .single();

  if (!reviewToken) {
    return NextResponse.json({ error: "Invalid review link" }, { status: 404 });
  }
  if (reviewToken.used) {
    return NextResponse.json({ error: "This link has already been used" }, { status: 400 });
  }
  if (new Date(reviewToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 400 });
  }

  const { error: insertError } = await supabaseAdmin.from("product_reviews").insert({
    product_id: reviewToken.product_id,
    order_id: reviewToken.order_id,
    reviewer_name: reviewToken.customer_name ?? null,
    rating,
    comment: comment?.trim() || null,
  });

  if (insertError) {
    console.error("[reviews/submit] failed to insert review", insertError);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  // Mark the token used so this exact link can't submit a second review —
  // non-fatal if it fails, though it would allow a resubmission via the
  // same link, which is a much smaller problem than losing the review itself.
  const { error: tokenUpdateError } = await supabaseAdmin
    .from("review_tokens")
    .update({ used: true })
    .eq("token", token);
  if (tokenUpdateError) {
    console.error("[reviews/submit] failed to mark token used", tokenUpdateError);
  }

  await recalculateProductRating(reviewToken.product_id);

  return NextResponse.json({ ok: true });
}
