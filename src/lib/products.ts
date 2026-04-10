import { supabaseAdmin } from "@/lib/supabase/server";
import { mockProducts, mockCategories, type Product } from "@/lib/mock-data";

/** Fetch all active products from Supabase and shape them as Product */
async function getSupabaseProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, sale_price_cents, description, thumbnail_url, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.name,
    category: p.category,
    price: p.sale_price_cents / 100,
    description: p.description ?? "",
    seller: "AI Digital Products",
    thumbnailUrl: p.thumbnail_url ?? undefined,
    priceId: undefined,
  }));
}

/** All products — Supabase first, then mock fill-ins, deduped by slug */
export async function getProducts(): Promise<Product[]> {
  const { data: thumbData } = await supabaseAdmin
    .from("products")
    .select("slug, thumbnail_url");

  const thumbMap = Object.fromEntries(
    (thumbData ?? []).map((p) => [p.slug, p.thumbnail_url as string | null])
  );

  const supabaseProducts = await getSupabaseProducts();
  const supabaseSlugs = new Set(supabaseProducts.map((p) => p.slug));

  const mockFillIns = mockProducts
    .filter((p) => !supabaseSlugs.has(p.slug))
    .map((p) => ({
      ...p,
      thumbnailUrl: thumbMap[p.slug] ?? p.thumbnailUrl ?? undefined,
    }));

  const mergedSupabase = supabaseProducts.map((p) => ({
    ...p,
    thumbnailUrl: p.thumbnailUrl ?? thumbMap[p.slug] ?? undefined,
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