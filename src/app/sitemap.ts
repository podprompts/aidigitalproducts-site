import { MetadataRoute } from "next";
import { mockProducts, mockCategories, mockBlogPosts } from "@/lib/mock-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://aidigitalproducts.com";

  const staticRoutes = [
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
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = mockProducts.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: new Date(),
  }));

  const categoryRoutes = mockCategories.map((c) => ({
    url: `${base}/categories/${c.slug}`,
    lastModified: new Date(),
  }));

  const blogRoutes = mockBlogPosts.map((b) => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
}
