"use client";


import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { mockProducts, type Product } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";
import { useInfiniteCarousel } from "@/hooks/useInfiniteCarousel";

export default function RecentlyAddedCarousel({ products }: { products?: Product[] }) {
  const [PRODUCTS, setProducts] = useState(() =>
  (products ?? mockProducts).slice(0, 6)
);

useEffect(() => {
  const list = [...(products ?? mockProducts)];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  setProducts(list.slice(0, 6));
}, [products]);
  // Tripled so the infinite-loop jump is always seamless in both directions.
  const tripled = [...PRODUCTS, ...PRODUCTS, ...PRODUCTS];

  const trackRef = useRef<HTMLDivElement>(null);
  const { didDragRef } = useInfiniteCarousel(trackRef, PRODUCTS.length);

  return (
    <div
      style={{ position: "relative", overflow: "hidden", marginTop: "64px" }}
      onClickCapture={(e) => {
        // Dragged >10px → swipe gesture, never navigate
        if (didDragRef.current) { e.stopPropagation(); return; }
        // Single click → do nothing (double-click navigates)
        if (e.detail === 1) e.stopPropagation();
        // Double-click (detail >= 2) falls through → Link navigates
      }}
    >
      <div
        ref={trackRef}
        className="carousel-track"
        style={{
          cursor: "grab",
          userSelect: "none",
          scrollSnapType: "none", // snap handled in JS for infinite-loop compatibility
        }}
      >
        {tripled.map((product, i) => (
          <Link
            key={i}
            href={`/products/${product.slug}`}
            style={{ textDecoration: "none", display: "block", flexShrink: 0 }}
            draggable={false}
          >
            <div className="carousel-cell">
              <ProductThumbnail url={product.thumbnailUrl} alt={product.title} />

              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--ink-mute)",
                  letterSpacing: "0.15em",
                }}
              >
                {String((i % PRODUCTS.length) + 1).padStart(2, "0")}
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

              <span
                className="carousel-arrow"
                style={{
                  marginTop: "auto",
                  paddingTop: "24px",
                  fontSize: "20px",
                  color: "var(--ink)",
                  display: "block",
                  opacity: 0,
                  transform: "translateX(-6px)",
                  transition: "all 0.3s",
                }}
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Right-edge fade hints at more content */}
      <div className="carousel-fade-right" />
    </div>
  );
}
