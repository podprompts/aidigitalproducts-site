"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REPLY = 1000;

// Confirms the caller is an active vendor AND that the review belongs to
// one of their own products. Never trust the client-supplied review id.
async function authorize(reviewId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID_RE.test(reviewId)) return { ok: false, error: "Invalid review." };

  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You are signed out. Please log in again." };

  const { data: vendor } = await supabaseAdmin
    .from("vendor_profiles")
    .select("is_active")
    .eq("id", user.id)
    .single();
  if (!vendor?.is_active) return { ok: false, error: "Not authorized." };

  const { data: review } = await supabaseAdmin
    .from("product_reviews")
    .select("product_id, is_hidden")
    .eq("id", reviewId)
    .single();
  if (!review || review.is_hidden) return { ok: false, error: "Review not found." };

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("vendor_id")
    .eq("id", review.product_id)
    .single();
  if (!product || product.vendor_id !== user.id) {
    return { ok: false, error: "You can only reply to reviews on your own products." };
  }

  return { ok: true };
}

export async function saveReplyAction(reviewId: string, text: string) {
  const reply = (text ?? "").trim();
  if (!reply) return { ok: false as const, error: "Reply cannot be empty." };
  if (reply.length > MAX_REPLY) {
    return { ok: false as const, error: `Reply must be ${MAX_REPLY} characters or fewer.` };
  }

  const auth = await authorize(reviewId);
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("product_reviews")
    .update({ vendor_response: reply, vendor_response_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) {
    console.error("[vendor/reviews] save reply failed", error);
    return { ok: false as const, error: "Could not save reply. Please try again." };
  }

  revalidatePath("/vendor/reviews");
  return { ok: true as const };
}

export async function deleteReplyAction(reviewId: string) {
  const auth = await authorize(reviewId);
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("product_reviews")
    .update({ vendor_response: null, vendor_response_at: null })
    .eq("id", reviewId);
  if (error) {
    console.error("[vendor/reviews] delete reply failed", error);
    return { ok: false as const, error: "Could not delete reply. Please try again." };
  }

  revalidatePath("/vendor/reviews");
  return { ok: true as const };
}