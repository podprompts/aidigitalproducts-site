import { supabaseAdmin } from "@/lib/supabase/server";
import { mockProducts, mockCategories, type Product } from "@/lib/mock-data";

/**
 * Fetches thumbnail_url values from Supabase and merges them into the given
 * products array. Supabase always wins; mock thumbnailUrl is the fallback.
 */
async function withThumbnails(products: Product[]): Promise<Product[]> {
  const { data } = await supabaseAdmin
    .from("products")
    .select("id, thumbnail_url");

  const thumbMap = Object.fromEntries(
    (data ?? []).map((p) => [p.id, p.thumbnail_url as string | null])
  );

  return products.map((p) => ({
    ...p,
    thumbnailUrl: thumbMap[p.id] ?? p.thumbnailUrl,
  }));
}

/** All products with thumbnails, preserving mock-data order. */
export async function getProducts(): Promise<Product[]> {
  return withThumbnails(mockProducts);
}

/** Products filtered to a single category (matched by category slug). */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const category = mockCategories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  const filtered = mockProducts.filter((p) => p.category === category.name);
  return withThumbnails(filtered);
}

/** Category names list (derived from mock-data, no DB call needed). */
export function getCategoryNames(): string[] {
  return mockCategories.map((c) => c.name);
}
