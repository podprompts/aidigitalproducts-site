import { supabaseAdmin } from "@/lib/supabase/server";
import { mockProducts, mockCategories, type Product } from "@/lib/mock-data";

export const fetchCache = "force-no-store";
export const revalidate = 0;

/** Fetch all active products from Supabase and shape them as Product */
async function getSupabaseProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, sale_price_cents, regular_price_cents, sale_stripe_price_id, regular_stripe_price_id, plr_price_cents, plr_stripe_price_id, is_plr_available, description, thumbnail_url, video_url, is_active, is_favorite, is_featured, is_not_ai, created_at, updated_at, purchases, vendor_id")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) return [];

  // vendor_id points to auth.users, which isn't exposed via the public API,
  // so vendor display info is fetched separately from vendor_profiles
  // (keyed to the same id) and merged in code — same pattern used below
  // for thumbnails/video URLs.
  const vendorIds = [...new Set(data.map((p) => p.vendor_id).filter(Boolean))];
  const vendorMap: Record<string, string> = {};
  if (vendorIds.length > 0) {
    const { data: vendorData } = await supabaseAdmin
      .from("vendor_profiles")
      .select("id, display_name")
      .in("id", vendorIds);
    for (const v of vendorData ?? []) {
      vendorMap[v.id as string] = v.display_name as string;
    }
  }

  return data.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.name,
    category: p.category,
    price: p.sale_price_cents / 100,
    regularPrice: p.regular_price_cents ? p.regular_price_cents / 100 : undefined,
    description: p.description ?? "",
    seller: (p.vendor_id && vendorMap[p.vendor_id]) || "AI Digital Products",
    thumbnailUrl: p.thumbnail_url ?? undefined,
    videoUrl: p.video_url ?? undefined,
    priceId: p.sale_stripe_price_id ?? undefined,
    regularPriceId: p.regular_stripe_price_id ?? undefined,
    // PLR fields — see the Product type note below, these need to be added there too
    plrPrice: p.plr_price_cents ? p.plr_price_cents / 100 : undefined,
    plrPriceId: p.plr_stripe_price_id ?? undefined,
    isPlrAvailable: p.is_plr_available ?? false,
    createdAt: p.created_at ?? undefined,
    updatedAt: p.updated_at ?? undefined,
    isFavorite: p.is_favorite ?? false,
    isFeatured: p.is_featured ?? false,
    isNotAi: p.is_not_ai ?? false,
    purchases: p.purchases ?? 0,
    rating: undefined,    // populated once reviews exist
    reviewCount: undefined,
  }));
}

/** All products — Supabase first, then mock fill-ins, deduped by slug */
export async function getProducts(): Promise<Product[]> {
  const { data: thumbData } = await supabaseAdmin
    .from("products")
    .select("slug, thumbnail_url, video_url")
    .eq("is_active", true);
  const thumbMap = Object.fromEntries(
    (thumbData ?? []).map((p) => [p.slug, p.thumbnail_url as string | null])
  );

  const videoMap = Object.fromEntries(
    (thumbData ?? []).map((p) => [p.slug, p.video_url as string | null])
  );

  const supabaseProducts = await getSupabaseProducts();
  const supabaseSlugs = new Set(supabaseProducts.map((p) => p.slug));

  const mockFillIns = mockProducts
    .filter((p) => !supabaseSlugs.has(p.slug))
    .map((p) => ({
      ...p,
      // No Supabase row means no vendor_id to resolve — these have no real
      // vendor relationship, so they keep the default name.
      seller: p.seller ?? "AI Digital Products",
      thumbnailUrl: thumbMap[p.slug] ?? p.thumbnailUrl ?? undefined,
      videoUrl: videoMap[p.slug] ?? p.videoUrl ?? undefined,
    }));

  const mergedSupabase = supabaseProducts.map((p) => ({
    ...p,
    thumbnailUrl: p.thumbnailUrl ?? thumbMap[p.slug] ?? undefined,
    videoUrl: p.videoUrl ?? videoMap[p.slug] ?? undefined,
  }));

  return [...mergedSupabase, ...mockFillIns];
}

/** Products filtered to a single category (matched by category slug). */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const category = mockCategories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  const all = await getProducts();
  return all.filter((p) => p.category === category.name);
}

/** Category names list (derived from mock-data, no DB call needed). */
export function getCategoryNames(): string[] {
  return mockCategories.map((c) => c.name);
}