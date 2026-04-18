"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { mockProducts, type Product } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";
import ViewingBadge from "@/components/ViewingBadge";
import ProductMeta from "@/components/ProductMeta";
import { useInfiniteCarousel } from "@/hooks/useInfiniteCarousel";

export default function RecentlyAddedCarousel({ products }: { products?: Product[] }) {
  const PRODUCTS = [...(products ?? mockProducts)]
    .sort((a, b) => {
      const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bDate - aDate;
    })
    .slice(0, 6);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const items = isMobile ? PRODUCTS : [...PRODUCTS, ...PRODUCTS, ...PRODUCTS];

  const trackRef = useRef<HTMLDivElement>(null);
  const { didDragRef } = useInfiniteCarousel(trackRef, PRODUCTS.length);

  return (
    <div
      style={{ position: "relative", overflow: "hidden", marginTop: "64px" }}
      onClickCapture={(e) => {
        if (didDragRef.current) { e.stopPropagation(); return; }
        if (e.detail === 1) e.stopPropagation();
      }}
    >
      <div
        ref={trackRef}
        className="carousel-track"
        style={{ cursor: "grab", userSelect: "none", scrollSnapType: "none" }}
      >
        {items.map((product, i) => (
          <Link
            key={i}
            href={`/products/${product.slug}`}
            style={{ textDecoration: "none", display: "block", flexShrink: 0, color: "inherit" }}
            draggable={false}
          >
            <div
              className="carousel-cell"
              style={
                product.isFeatured
                  ? {
                      boxShadow: "0 0 0 1px rgba(160,160,160,0.13), 0 6px 32px rgba(0,0,0,0.16)",
                      borderRadius: "inherit",
                    }
                  : undefined
              }
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

              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", letterSpacing: "0.15em" }}>
                {String((i % PRODUCTS.length) + 1).padStart(2, "0")}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-faded)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "10px" }}>
                {product.category}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: "8px", lineHeight: 1.2 }}>
                {product.title}
              </div>
              <div className="card-seller">Seller · {product.seller}</div>

              {/* ── Review / price / purchases meta row ── */}
              <ProductMeta
                rating={product.rating}
                reviewCount={product.reviewCount}
                price={product.price}
                purchases={product.purchases}
              />

              <ViewingBadge productId={product.id} />

              <span
                className="carousel-arrow"
                style={{ marginTop: "auto", paddingTop: "24px", fontSize: "20px", color: "var(--ink)", display: "block", opacity: 0, transform: "translateX(-6px)", transition: "all 0.3s" }}
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="carousel-fade-right" />
    </div>
  );
}