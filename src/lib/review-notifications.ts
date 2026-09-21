import { supabaseAdmin } from "@/lib/supabase/server";
import { sendReviewModerationEmail, type ReviewModerationAction } from "@/lib/email";

// Emails the seller when admin hides/unhides a review or removes a reply.
// Never throws: the admin action has already succeeded by the time this runs,
// so a missing email address or a Resend failure is only logged.
export async function notifyVendorOfModeration(
  reviewId: string,
  action: ReviewModerationAction,
  reason?: string
): Promise<void> {
  try {
    const { data: review } = await supabaseAdmin
      .from("product_reviews")
      .select("product_id, rating, comment")
      .eq("id", reviewId)
      .single();
    if (!review) return;

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("name, vendor_id")
      .eq("id", review.product_id)
      .single();
    if (!product?.vendor_id) return;

    const { data: vendor } = await supabaseAdmin
      .from("vendor_profiles")
      .select("email, display_name")
      .eq("id", product.vendor_id)
      .single();
    if (!vendor?.email) {
      console.warn("[review-notify] vendor has no email on file, skipping", product.vendor_id);
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
    const comment = (review.comment as string | null)?.trim() ?? "";
    const excerpt = comment.length > 200 ? comment.slice(0, 200).trimEnd() + "..." : comment;

    await sendReviewModerationEmail({
      toEmail: vendor.email as string,
      toName: (vendor.display_name as string | null) ?? undefined,
      action,
      productName: product.name as string,
      rating: Number(review.rating),
      commentExcerpt: excerpt || null,
      reason: reason?.trim() || null,
      reviewsUrl: `${siteUrl}/vendor/reviews`,
    });
  } catch (err) {
    console.error("[review-notify] failed to send moderation email", err);
  }
}