"use client";

import { useState } from "react";
import Link from "next/link";
import { type Product } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";
import ViewingBadge from "@/components/ViewingBadge";

const ALL = "All";

export default function ProductsClient({
  products,
  categoryNames,
}: {
  products: Product[];
  categoryNames: string[];
}) {
  const categories = [ALL, ...categoryNames];
  const [active, setActive] = useState(ALL);

  const displayed =
    active === ALL ? products : products.filter((p) => p.category === active);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
      {/* Category pills */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", padding: "48px 0 24px" }}>
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
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ink-soft)";
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
          <p className="display" style={{ fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1, color: "var(--ink)" }}>
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
                    ? {
                        boxShadow: "0 0 0 1px rgba(160,160,160,0.13), 0 6px 32px rgba(0,0,0,0.16)",
                      }
                    : {}),
                }}
              >
                {/* Thumbnail + badges */}
                <div style={{ position: "relative" }}>
                  <ProductThumbnail
                    url={product.thumbnailUrl}
                    videoUrl={product.videoUrl}
                    alt={product.title}
                  />

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
      )}
    </div>
  );
}