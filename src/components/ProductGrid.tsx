"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { mockProducts } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";

const featured = mockProducts.slice(0, 6);
// Triple for infinite loop
const tripled = [...featured, ...featured, ...featured];

export default function ProductGrid() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Start scroll at the middle copy
    const singleWidth = track.scrollWidth / 3;
    track.scrollLeft = singleWidth;

    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const sw = track.scrollWidth / 3;
        if (track.scrollLeft < sw * 0.3) {
          track.scrollLeft += sw;
        } else if (track.scrollLeft > sw * 2.1) {
          track.scrollLeft -= sw;
        }
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

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
        <div ref={trackRef} className="carousel-track">
          {tripled.map((product, i) => (
            <Link
              key={i}
              href={`/products/${product.slug}`}
              style={{ textDecoration: "none", display: "block", flexShrink: 0 }}
            >
              <div className="carousel-cell">
                {/* Thumbnail */}
                <ProductThumbnail url={product.thumbnailUrl} alt={product.title} />

                {/* Meta */}
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
