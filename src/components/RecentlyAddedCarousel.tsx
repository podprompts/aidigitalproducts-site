"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { mockProducts } from "@/lib/mock-data";
import ProductThumbnail from "@/components/ProductThumbnail";

const PRODUCTS = mockProducts.slice(0, 6);

export default function RecentlyAddedCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isDragging = false;
    let startX = 0;
    let startScroll = 0;
    let velX = 0;
    let lastX = 0;
    let lastT = 0;
    let momentumId: number;

    /* ── Mouse ─────────────────────────────────────────────────────────── */
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      didDragRef.current = false;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      velX = 0;
      lastX = e.pageX;
      lastT = Date.now();
      cancelAnimationFrame(momentumId);
      track.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      if (Math.abs(e.pageX - startX) > 5) didDragRef.current = true;
      track.scrollLeft = startScroll - (e.pageX - startX);
      const now = Date.now();
      const dt = now - lastT;
      if (dt > 0) { velX = (lastX - e.pageX) / dt; lastX = e.pageX; lastT = now; }
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      track.style.cursor = "grab";
      momentum();
    };

    /* ── Touch ─────────────────────────────────────────────────────────── */
    const onTouchStart = (e: TouchEvent) => {
      didDragRef.current = false;
      startX = e.touches[0].pageX;
      startScroll = track.scrollLeft;
      velX = 0;
      lastX = e.touches[0].pageX;
      lastT = Date.now();
      cancelAnimationFrame(momentumId);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].pageX - startX) > 5) didDragRef.current = true;
      track.scrollLeft = startScroll - (e.touches[0].pageX - startX);
      const now = Date.now();
      const dt = now - lastT;
      if (dt > 0) { velX = (lastX - e.touches[0].pageX) / dt; lastX = e.touches[0].pageX; lastT = now; }
    };

    const onTouchEnd = () => momentum();

    /* ── Momentum ───────────────────────────────────────────────────────── */
    const momentum = () => {
      const FRAME = 1000 / 60;
      const DECAY = 0.93;
      const step = () => {
        if (Math.abs(velX) < 0.05) return;
        track.scrollLeft += velX * FRAME;
        velX *= DECAY;
        momentumId = requestAnimationFrame(step);
      };
      momentumId = requestAnimationFrame(step);
    };

    track.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    track.addEventListener("touchstart", onTouchStart, { passive: true });
    track.addEventListener("touchmove", onTouchMove, { passive: true });
    track.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      track.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      track.removeEventListener("touchstart", onTouchStart);
      track.removeEventListener("touchmove", onTouchMove);
      track.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(momentumId);
    };
  }, []);

  return (
    /* Outer wrapper clips the partial card at the right edge */
    <div
      style={{ position: "relative", overflow: "hidden", marginTop: "64px" }}
      /* Suppress navigation if the user dragged instead of clicked */
      onClickCapture={(e) => { if (didDragRef.current) e.stopPropagation(); }}
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
        {PRODUCTS.map((product, i) => (
          <Link
            key={product.id}
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
