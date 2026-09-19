import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import VendorProductEditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditVendorProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url, review_status, review_rejected_reason, last_approved_changes, last_approved_at, creator_refund_terms")
    .eq("id", id)
    .single();

  // Ownership check — a vendor can only ever land here for their own product
  if (!product || product.vendor_id !== user.id) notFound();

  // The rejection/approval banners are shown exactly once — capture their
  // current values for THIS render, then clear them immediately so a
  // refresh or a later visit doesn't keep showing a decision the vendor
  // has already seen. The permanent record still lives in
  // product_review_log regardless of this clearing.
  const bannerData = {
    review_status: product.review_status,
    review_rejected_reason: product.review_rejected_reason,
    last_approved_changes: product.last_approved_changes,
    last_approved_at: product.last_approved_at,
  };

  const hasApprovedBanner = Array.isArray(product.last_approved_changes) && product.last_approved_changes.length > 0;
  if (product.review_status === "rejected" || hasApprovedBanner) {
    await supabaseAdmin
      .from("products")
      .update({
        // "pending" is an ongoing state, not a past decision — only ever
        // clear review_status if it was specifically "rejected".
        review_status: product.review_status === "rejected" ? "none" : product.review_status,
        review_rejected_reason: null,
        last_approved_changes: null,
        last_approved_at: null,
      })
      .eq("id", id);
  }

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("id, url, is_primary, display_order")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  return (
    <VendorProductEditForm
      product={{ ...product, ...bannerData }}
      initialImages={images ?? []}
    />
  );
}