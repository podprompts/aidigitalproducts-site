"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { mockProducts, type Product } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";
import ViewingBadge from "@/components/ViewingBadge";
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
        style={{
          cursor: "grab",
          userSelect: "none",
          scrollSnapType: "none",
        }}
      >
        {items.map((product, i) => (
          <Link
            key={i}
            href={`/products/${product.slug}`}
            style={{ textDecoration: "none", display: "block", flexShrink: 0 }}
            draggable={false}
          >
            <div className="carousel-cell">
              <ProductThumbnail
                url={product.thumbnailUrl}
                videoUrl={product.videoUrl}
                alt={product.title}
              />

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

              <ViewingBadge productId={product.id} />

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

      <div className="carousel-fade-right" />
    </div>
  );
}