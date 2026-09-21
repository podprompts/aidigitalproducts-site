import { supabaseAdmin } from "@/lib/supabase/server";

// Recalculates a product's aggregate rating and review count.
// Only non-hidden reviews count. Used by review submission and by admin
// hide/unhide so both always produce the same result.
export async function recalculateProductRating(productId: string): Promise<void> {
  const { data: reviews } = await supabaseAdmin
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_hidden", false);

  const count = reviews?.length ?? 0;
  const avg = count > 0 ? reviews!.reduce((sum, r) => sum + r.rating, 0) / count : null;

  await supabaseAdmin
    .from("products")
    .update({ rating: avg, review_count: count })
    .eq("id", productId);
}