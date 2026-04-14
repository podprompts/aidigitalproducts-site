"use client";
 
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { type Product } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";
import ViewingBadge from "@/components/ViewingBadge";
import { useInfiniteCarousel } from "@/hooks/useInfiniteCarousel";
 
export default function ProductGrid({ products }: { products: Product[] }) {
  const [featured, setFeatured] = useState(() => (products ?? []).slice(0, 6));
 
  useEffect(() => {
    const list = [...(products ?? [])];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setFeatured(list.slice(0, 6));
  }, [products]);
 
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
 
  const items = isMobile ? featured : [...featured, ...featured, ...featured];
 
  const trackRef = useRef<HTMLDivElement>(null);
  const { didDragRef } = useInfiniteCarousel(trackRef, featured.length);
 
  return (
    <section className="block" id="products">
      {/* Heading — constrained */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center", paddingBottom: "0" }}>
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
 
        <h2
          className="display"
          style={{
            fontSize: "clamp(40px, 6.5vw, 88px)",
            lineHeight: 0.96,
            maxWidth: "880px",
            margin: "0 auto",
            color: "var(--ink)",
          }}
        >
          The best AI tools.
          <br />
          <span style={{ color: "var(--ink-mute)" }}>All in one place.</span>
        </h2>
 
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
          Curated digital products across automation, content, and intelligence — vetted for
          quality, ready for deployment.
        </p>
      </div>
 
      {/* Carousel — full width, extends past viewport edge */}
      <div className="carousel-wrap">
        <div className="carousel-fade-left" />
        <div
          ref={trackRef}
          className="carousel-track"
          style={{
            cursor: "grab",
            userSelect: "none",
            scrollSnapType: "none",
          }}
          onClickCapture={(e) => {
            if (didDragRef.current) { e.stopPropagation(); return; }
            if (e.detail === 1) e.stopPropagation();
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
                  {String((i % featured.length) + 1).padStart(2, "0")}
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
                  className="carousel-arrow"
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="carousel-fade-right" />
      </div>
 
      <div
        className="link-row"
        style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "36px", flexWrap: "wrap" }}
      >
        <Link href="/products" className="underline-link">Explore the marketplace</Link>
        <Link href="/products" className="underline-link">See what&apos;s new</Link>
      </div>
    </section>
  );
}