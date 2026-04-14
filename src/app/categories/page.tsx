import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockCategories, mockProducts } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Categories — AI Digital Products",
  description:
    "Browse AI digital products by category. Chatbots, voice agents, automations, content systems, lead generation, and custom AI apps.",
};

export default function CategoriesPage() {
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
              — Categories —
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
              Browse by category.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Find what fits.</span>
            </h1>
          </div>
        </section>

        {/* Categories grid */}
        <section style={{ padding: "0 24px clamp(80px, 12vw, 160px)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="catalog-grid category-grid">
              {mockCategories.map((cat, i) => {
                const count = mockProducts.filter((p) => p.category === cat.name).length;
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="card"
                      style={{
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
                            fontSize: "24px",
                            fontWeight: 800,
                            letterSpacing: "-0.025em",
                            color: "var(--ink)",
                            marginTop: "16px",
                            lineHeight: 1.1,
                          }}
                        >
                          {cat.name}
                        </div>
                        <div
                          style={{
                            marginTop: "10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--ink-mute)",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {count} product{count !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <span className="card-arrow">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}