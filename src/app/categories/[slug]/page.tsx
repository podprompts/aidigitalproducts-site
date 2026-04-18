import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockCategories } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";
import ViewingBadge from "@/components/ViewingBadge";
import { getProductsByCategory } from "@/lib/products";

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

  const products = await getProductsByCategory(slug);

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
                    style={{ textDecoration: "none", display: "flex", height: "100%", color: "inherit" }}
                  >
                    <div
                      className="card"
                      style={{
                        padding: "32px 36px 48px",
                        minHeight: "260px",
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        ...(product.isFeatured
                          ? { boxShadow: "0 0 0 1px rgba(160,160,160,0.13), 0 6px 32px rgba(0,0,0,0.16)" }
                          : {}),
                      }}
                    >
                      {/* Thumbnail + badges */}
                      <div style={{ position: "relative" }}>
                        <ProductThumbnail url={product.thumbnailUrl} videoUrl={product.videoUrl} alt={product.title} />

                        {product.isFavorite && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "10px",
                              right: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(245, 243, 238, 0.93)",
                              backdropFilter: "blur(6px)",
                              WebkitBackdropFilter: "blur(6px)",
                              border: "1px solid rgba(0,0,0,0.10)",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              zIndex: 10,
                            }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                              <circle cx="4" cy="4" r="3" style={{ fill: "#e8c97a" }} />
                            </svg>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                color: "#2a2a2a",
                              }}
                            >
                              Favorite
                            </span>
                          </div>
                        )}

                        {product.isNotAi && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "10px",
                              left: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(245, 243, 238, 0.93)",
                              backdropFilter: "blur(6px)",
                              WebkitBackdropFilter: "blur(6px)",
                              border: "1px solid rgba(0,0,0,0.10)",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              zIndex: 10,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                              <path d="M2 8 Q5 1 8 8" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                              <path d="M3.5 9 Q5 3.5 6.5 9" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                              <circle cx="5" cy="9.2" r="0.6" style={{ fill: "#3a3a3a" }} />
                            </svg>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "#2a2a2a",
                              }}
                            >
                              Human-Made
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", letterSpacing: "0.15em" }}>
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-faded)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "12px" }}>
                            {product.category}
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: "8px", lineHeight: 1.2 }}>
                            {product.title}
                          </div>
                          <div className="card-seller">Seller · {product.seller}</div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>
                            ${product.price}
                          </div>
                          <ViewingBadge productId={product.id} />
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