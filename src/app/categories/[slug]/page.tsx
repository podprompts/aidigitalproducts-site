import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockCategories, mockProducts } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";
import { supabaseAdmin } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return mockCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = mockCategories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: `${category.name} — AI Digital Products`,
    description: `Browse all ${category.name} products on AI Digital Products.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = mockCategories.find((c) => c.slug === slug);
  if (!category) notFound();

  const { data: dbProducts } = await supabaseAdmin
    .from("products")
    .select("id, thumbnail_url");

  const thumbMap = Object.fromEntries(
    (dbProducts ?? []).map((p) => [p.id, p.thumbnail_url as string | null])
  );

  const products = mockProducts
    .filter((p) => p.category === category.name)
    .map((p) => ({ ...p, thumbnailUrl: thumbMap[p.id] ?? p.thumbnailUrl }));

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        {/* Hero */}
        <section className="page-hero">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
              }}
            >
              — Category —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 8vw, 112px)",
                lineHeight: 0.94,
                color: "var(--ink)",
                maxWidth: "900px",
                margin: "0 auto",
              }}
            >
              {category.name}.{" "}
              <span style={{ color: "var(--ink-mute)" }}>All products.</span>
            </h1>
            <p
              style={{
                marginTop: "28px",
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                maxWidth: "480px",
                margin: "28px auto 0",
                lineHeight: 1.6,
              }}
            >
              {products.length} product{products.length !== 1 ? "s" : ""} in this category.
            </p>
          </div>
        </section>

        {/* Category grid */}
        <section style={{ padding: "0 0 clamp(80px, 12vw, 160px)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            {products.length > 0 ? (
              <div className="catalog-grid">
                {products.map((product, i) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="card"
                      style={{
                        padding: "32px 36px 48px",
                        minHeight: "260px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Thumbnail */}
                      <ProductThumbnail url={product.thumbnailUrl} alt={product.title} />

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "var(--ink-mute)",
                              letterSpacing: "0.15em",
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "var(--ink-faded)",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              marginTop: "12px",
                            }}
                          >
                            {product.category}
                          </div>
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: 800,
                              letterSpacing: "-0.02em",
                              color: "var(--ink)",
                              marginTop: "8px",
                              lineHeight: 1.2,
                            }}
                          >
                            {product.title}
                          </div>
                          <div className="card-seller">Seller · {product.seller}</div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            ${product.price}
                          </div>
                        </div>
                        <span className="card-arrow">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "80px 0",
                  textAlign: "center",
                  fontSize: "14px",
                  color: "var(--ink-mute)",
                  fontWeight: 500,
                }}
              >
                No products listed yet.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
