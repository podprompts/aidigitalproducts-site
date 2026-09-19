import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, video_url, download_url, attributes, creator_refund_terms, vendor_id, pending_changes, review_status, review_submitted_at"
    )
    .eq("review_status", "pending")
    .order("review_submitted_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vendorIds = [...new Set((products ?? []).map((p) => p.vendor_id).filter(Boolean))];
  let vendorMap: Record<string, string> = {};
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabaseAdmin
      .from("vendor_profiles")
      .select("id, display_name")
      .in("id", vendorIds);
    vendorMap = Object.fromEntries((vendors ?? []).map((v) => [v.id, v.display_name]));
  }

  // Current live images, for comparing against each submission's proposed set
  const productIds = (products ?? []).map((p) => p.id);
  let currentImagesByProduct: Record<string, { url: string; is_primary: boolean }[]> = {};
  if (productIds.length > 0) {
    const { data: images } = await supabaseAdmin
      .from("product_images")
      .select("product_id, url, is_primary, display_order")
      .in("product_id", productIds)
      .order("display_order", { ascending: true });
    currentImagesByProduct = (images ?? []).reduce((acc, img) => {
      (acc[img.product_id] ??= []).push({ url: img.url, is_primary: img.is_primary });
      return acc;
    }, {} as Record<string, { url: string; is_primary: boolean }[]>);
  }

  const enriched = (products ?? []).map((p) => ({
    ...p,
    vendor_name: p.vendor_id ? vendorMap[p.vendor_id] ?? "Unknown vendor" : "—",
    current_images: currentImagesByProduct[p.id] ?? [],
  }));

  return NextResponse.json({ products: enriched });
}