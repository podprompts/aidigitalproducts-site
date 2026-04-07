"use client";

import { useState } from "react";
import Link from "next/link";
import { mockProducts, mockCategories } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";

const ALL = "All";
const categories = [ALL, ...mockCategories.map((c) => c.name)];

export default function ProductsClient() {
  const [active, setActive] = useState(ALL);

  const displayed =
    active === ALL ? mockProducts : mockProducts.filter((p) => p.category === active);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
      {/* Category pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px",
          padding: "48px 0 24px",
        }}
      >
        {categories.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                padding: "10px 20px",
                borderRadius: "980px",
                border: `1px solid ${isActive ? "var(--ink)" : "var(--ink-soft)"}`,
                background: isActive ? "var(--ink)" : "transparent",
                color: isActive ? "var(--bg)" : "var(--ink)",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ink)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ink-soft)";
                }
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid or empty state */}
      {displayed.length === 0 ? (
        <div style={{ padding: "120px 0", textAlign: "center" }}>
          <p
            className="display"
            style={{
              fontSize: "clamp(28px, 3.5vw, 40px)",
              lineHeight: 1,
              color: "var(--ink)",
            }}
          >
            No products yet.{" "}
            <span style={{ color: "var(--ink-mute)" }}>Check back soon.</span>
          </p>
        </div>
      ) : (
        <div className="catalog-grid">
          {displayed.map((product, i) => (
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
      )}
    </div>
  );
}
