import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockProducts } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Browse Products — AI Digital Products",
  description:
    "Browse the full catalog of AI digital products. Chatbots, voice agents, automations, content systems, and more. New listings daily.",
};

export default function ProductsPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "64px" }}>
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
              — Marketplace —
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
              Every product.{" "}
              <span style={{ color: "var(--ink-mute)" }}>One marketplace.</span>
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
              Browse the full catalog of AI digital products. New listings daily.
            </p>
          </div>
        </section>

        {/* Product grid */}
        <section style={{ padding: "0 0 clamp(80px, 12vw, 160px)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <div className="catalog-grid" style={{ marginTop: "0" }}>
              {mockProducts.map((product, i) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card"
                    style={{
                      padding: "48px 36px",
                      minHeight: "260px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
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
                      <div
                        style={{
                          marginTop: "12px",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "var(--ink)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        ${product.price}
                      </div>
                    </div>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
