import { MetadataRoute } from "next";
import { mockProducts, mockCategories, mockBlogPosts } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase/server";

// Rebuilt at most once an hour so new products and sellers appear without a redeploy.
export const revalidate = 3600;

// The apex domain redirects to www, so www is the canonical address.
const BASE = "https://www.aidigitalproducts.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: rows } = await supabaseAdmin
    .from("products")
    .select("slug, updated_at, vendor_id")
    .eq("is_active", true);
  const dbProducts = rows ?? [];

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/products",
    "/sell",
    "/pricing",
    "/about",
    "/contact",
    "/blog",
    "/categories",
    "/terms",
    "/privacy",
    "/refund-buyer-protection",
    "/plr-license",
  ].map((path) => ({ url: `${BASE}${path}` }));

  // Real (Supabase) products first, with their true last-modified date.
  const seen = new Set<string>();
  const productRoutes: MetadataRoute.Sitemap = [];
  for (const p of dbProducts) {
    if (!p.slug || seen.has(p.slug)) continue;
    seen.add(p.slug);
    productRoutes.push({
      url: `${BASE}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    });
  }
  // Mock-only products that the site still serves.
  for (const p of mockProducts) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    productRoutes.push({ url: `${BASE}/products/${p.slug}` });
  }

  // Seller storefronts: only active sellers who have at least one active product.
  const vendorIds = [...new Set(dbProducts.map((p) => p.vendor_id).filter(Boolean))] as string[];
  let sellerRoutes: MetadataRoute.Sitemap = [];
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabaseAdmin
      .from("vendor_profiles")
      .select("id, updated_at")
      .in("id", vendorIds)
      .eq("is_active", true);
    sellerRoutes = (vendors ?? []).map((v) => ({
      url: `${BASE}/sellers/${v.id}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : undefined,
    }));
  }

  const categoryRoutes: MetadataRoute.Sitemap = mockCategories.map((c) => ({
    url: `${BASE}/categories/${c.slug}`,
  }));

  const blogRoutes: MetadataRoute.Sitemap = mockBlogPosts.map((b) => ({
    url: `${BASE}/blog/${b.slug}`,
  }));

  return [...staticRoutes, ...productRoutes, ...sellerRoutes, ...categoryRoutes, ...blogRoutes];
}