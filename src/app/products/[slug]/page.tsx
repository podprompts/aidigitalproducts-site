import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StickyBuyBar from "@/components/StickyBuyBar";
import ProductThumbnail from "@/components/ProductThumbnail";
import PriceAndBuySection from "@/components/PriceAndBuySection";
import { mockProducts, mockCategories } from "@/lib/mock-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return mockProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: `${product.title} — AI Digital Products`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug);
  if (!product) notFound();

  const categoryObj = mockCategories.find((c) => c.name === product.category);
  const categorySlug = categoryObj?.slug ?? product.category.toLowerCase().replace(/\s+/g, "-");

  const related = mockProducts.filter((p) => p.slug !== product.slug).slice(0, 4);

  const included = product.features ?? [
    "Full product files and documentation",
    "Setup walkthrough and configuration guide",
    "Email support from the seller",
    "Instant download after purchase",
  ];

  const isComingSoon = !product.priceId;
  const hasSale = !!(product.regularPrice && product.regularPriceId);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        {/* Breadcrumb */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "24px 24px 0",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--ink-faded)",
          }}
        >
          <Link href="/products" className="nav-link">
            Products
          </Link>
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <Link href={`/categories/${categorySlug}`} className="nav-link">
            {product.category}
          </Link>
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <span style={{ color: "var(--ink)" }}>{product.title}</span>
        </div>

        {/* Two-column detail */}
        <section
          style={{
            borderBottom: "1px solid var(--line-soft)",
            padding: "clamp(32px, 5vw, 56px) 24px clamp(48px, 8vw, 80px)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="detail-grid">
              {/* Left — preview */}
              <ProductThumbnail
                url={product.thumbnailUrl}
                alt={product.title}
                variant="detail"
              />

              {/* Right — info */}
              <div
                style={{
                  padding: "48px 40px",
                  background: "var(--bg)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--ink-faded)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                  }}
                >
                  {product.category}
                </div>

                <h1
                  className="display"
                  style={{
                    fontSize: "clamp(32px, 4vw, 56px)",
                    lineHeight: 1,
                    color: "var(--ink)",
                  }}
                >
                  {product.title}
                </h1>

                {isComingSoon ? (
                  <>
                    <div
                      style={{
                        marginTop: "24px",
                        fontSize: "48px",
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        color: "var(--ink)",
                        lineHeight: 1,
                      }}
                    >
                      ${product.price.toFixed(2)}
                    </div>
                    <p
                      style={{
                        marginTop: "20px",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "var(--ink-faded)",
                        lineHeight: 1.65,
                      }}
                    >
                      {product.description}
                    </p>
                    <div style={{ marginTop: "36px" }}>
                      <span
                        className="btn btn-primary"
                        style={{ opacity: 0.45, cursor: "not-allowed" }}
                      >
                        Coming Soon
                      </span>
                    </div>
                  </>
                ) : (
                  <PriceAndBuySection
                    productId={product.id}
                    productName={product.title}
                    salePrice={product.price}
                    salePriceId={product.priceId}
                    regularPrice={hasSale ? product.regularPrice : undefined}
                    regularPriceId={hasSale ? product.regularPriceId : undefined}
                    description={product.description}
                  />
                )}

                <div
                  style={{
                    marginTop: "32px",
                    paddingTop: "24px",
                    borderTop: "1px solid var(--line)",
                    fontSize: "12px",
                    color: "var(--ink-mute)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  Sold by {product.seller}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About this product */}
        <section className="block">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — About this product —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.05,
                color: "var(--ink)",
                marginBottom: "28px",
              }}
            >
              What it does.{" "}
              <span style={{ color: "var(--ink-mute)" }}>How it works.</span>
            </h2>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.7,
                marginBottom: "20px",
              }}
            >
              {product.description} This product is built to be deployed, not studied. Everything
              you need to get it running is included.
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.7,
              }}
            >
              The documentation covers the full setup process from start to finish. If you run into
              anything, seller support is included.
            </p>
          </div>
        </section>

        {/* What's included */}
        <section className="block alt">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — What&apos;s included —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.05,
                color: "var(--ink)",
                marginBottom: "36px",
              }}
            >
              Everything you need.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Nothing extra.</span>
            </h2>
            <ul style={{ listStyle: "none" }}>
              {included.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--ink-faded)",
                    padding: "14px 0",
                    borderBottom: "1px solid var(--line)",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "var(--ink-mute)", flexShrink: 0 }}>—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Seller */}
        <section className="block">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — Seller —
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                marginBottom: "16px",
              }}
            >
              {product.seller}
            </div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.65,
                maxWidth: "480px",
              }}
            >
              An independent builder specialising in AI digital products. All products are tested,
              documented, and supported directly by the seller.
            </p>
          </div>
        </section>

        {/* You might also like */}
        <section
          style={{
            padding: "clamp(80px, 12vw, 160px) 24px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              — Related —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(32px, 4.5vw, 60px)",
                lineHeight: 0.96,
                color: "var(--ink)",
                textAlign: "center",
                marginBottom: "64px",
              }}
            >
              You might also like.{" "}
              <span style={{ color: "var(--ink-mute)" }}>More from the marketplace.</span>
            </h2>
            <div className="related-grid">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card"
                    style={{
                      padding: "28px 28px 40px",
                      minHeight: "220px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Thumbnail */}
                    <ProductThumbnail url={p.thumbnailUrl} alt={p.title} />

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "var(--ink-faded)",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                          }}
                        >
                          {p.category}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: "var(--ink)",
                            marginTop: "8px",
                            lineHeight: 1.25,
                          }}
                        >
                          {p.title}
                        </div>
                        <div className="card-seller">Seller · {p.seller}</div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--ink)",
                          }}
                        >
                          ${p.price}
                          {!p.priceId && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "var(--ink-faded)",
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                              }}
                            >
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="card-arrow" style={{ marginTop: "20px" }}>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Mobile sticky buy bar */}
      <StickyBuyBar
        price={product.price}
        priceId={product.priceId}
        productId={product.id}
        productName={product.title}
      />
    </>
  );
}
