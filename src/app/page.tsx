import Link from "next/link";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Stats from "@/components/Stats";
import SellerBlock from "@/components/SellerBlock";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { mockProducts } from "@/lib/mock-data";

const recentProducts = mockProducts.slice(0, 3);

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />

      {/* Trust bar */}
      <div
        style={{
          height: "48px",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0",
          overflow: "hidden",
        }}
      >
        {["1,247 products", "6 categories", "Updated daily", "Trusted worldwide"].map(
          (item, i, arr) => (
            <span
              key={item}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--ink-faded)",
                display: "flex",
                alignItems: "center",
                gap: "0",
              }}
            >
              {item}
              {i < arr.length - 1 && (
                <span
                  style={{
                    margin: "0 20px",
                    color: "var(--ink-soft)",
                  }}
                >
                  —
                </span>
              )}
            </span>
          )
        )}
      </div>

      {/* Recently Added */}
      <section className="block" id="recently-added">
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
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
            — Recently Added —
          </div>
          <h2
            className="display"
            style={{
              fontSize: "clamp(36px, 5.5vw, 72px)",
              lineHeight: 0.96,
              maxWidth: "800px",
              margin: "0 auto",
              color: "var(--ink)",
            }}
          >
            Fresh off the press.{" "}
            <span style={{ color: "var(--ink-mute)" }}>New products daily.</span>
          </h2>

          <div className="product-grid" style={{ marginTop: "64px" }}>
            {recentProducts.map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="card"
                  style={{
                    padding: "36px 36px 48px",
                    minHeight: "240px",
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "left",
                  }}
                >
                  {/* Thumbnail */}
                  <div className="card-thumbnail" />

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
                        marginTop: "10px",
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
                  <span className="card-arrow" style={{ marginTop: "auto" }}>→</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: "36px" }}>
            <Link href="/products" className="underline-link">
              Browse all products
            </Link>
          </div>
        </div>
      </section>

      <ProductGrid />
      <Stats />
      <SellerBlock />
      <Pricing />
      <FinalCTA />
      <Footer />
    </>
  );
}
