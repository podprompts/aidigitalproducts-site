"use client";
 
import React, { useState, useRef } from "react";
import Image from "next/image";
 
export interface GalleryImage {
  url: string;
  alt?: string;
}
 
interface Props {
  images: GalleryImage[];
  alt: string;
}
 
export default function ProductGallery({ images, alt }: Props) {
  const [activeIdx, setActiveIdx]     = useState(0);
  const [fading, setFading]           = useState(false);
  const [mainHovered, setMainHovered] = useState(false);
 
  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
 
  function select(idx: number) {
    if (idx === activeIdx || fading) return;
    setFading(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setFading(false);
    }, 150);
  }
 
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
 
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left → next
        select((activeIdx + 1) % images.length);
      } else {
        // swipe right → prev
        select((activeIdx - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  }
 
  const current    = images[activeIdx] ?? null;
  const showThumbs = images.length > 1;
 
  const squareContainer: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    position: "relative",
    background: "var(--bg-alt)",
    overflow: "hidden",
    flexShrink: 0,
    alignSelf: "start",
  };
 
  // Empty — no images at all
  if (images.length === 0) {
    return (
      <div style={{ ...squareContainer, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--ink-mute)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Preview
        </span>
      </div>
    );
  }
 
  // Single image — no thumbnail strip
  if (!showThumbs) {
    return (
      <div
        style={squareContainer}
        onMouseEnter={() => setMainHovered(true)}
        onMouseLeave={() => setMainHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={current!.url}
          alt={current!.alt ?? alt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{
            objectFit: "contain",
            transform: mainHovered ? "scale(1.02)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />
      </div>
    );
  }
 
  // Full gallery — swipeable main image + scrollable thumbnail strip
  return (
    <div
      className="gallery"
      style={{
        width: "100%",
        flexShrink: 0,
        alignSelf: "start",
        minWidth: 0,        // prevent flex child from overflowing parent
        overflow: "hidden", // contain everything inside
      }}
    >
      {/* Thumbnail strip — horizontally scrollable, never expands parent */}
      <div
        className="gallery-thumbs"
        style={{
          // Mobile: horizontal scroll contained within parent width
          overscrollBehaviorX: "contain",
        }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            className={`gallery-thumb${i === activeIdx ? " gallery-thumb-active" : ""}`}
            onClick={() => select(i)}
            aria-label={`View image ${i + 1}`}
            style={{ flexShrink: 0 }} // prevent thumbnails from squishing
          >
            <Image
              src={img.url}
              alt={img.alt ?? alt}
              fill
              sizes="80px"
              style={{ objectFit: "cover" }}
            />
          </button>
        ))}
      </div>
 
      {/* Main image — swipeable on touch */}
      <div
        className="gallery-main"
        style={{
          opacity: fading ? 0 : 1,
          transition: "opacity 0.15s ease",
          minWidth: 0,
          touchAction: "pan-y", // allow vertical scroll, capture horizontal for swipe
        }}
        onMouseEnter={() => setMainHovered(true)}
        onMouseLeave={() => setMainHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt ?? alt}
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            style={{
              objectFit: "contain",
              transform: mainHovered ? "scale(1.02)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
          />
        )}
      </div>
 
      {/* Dot indicators — mobile only */}
      {images.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            paddingTop: "12px",
            width: "100%",
          }}
          className="gallery-dots"
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              aria-label={`Go to image ${i + 1}`}
              style={{
                width: i === activeIdx ? "20px" : "6px",
                height: "6px",
                borderRadius: "980px",
                background: i === activeIdx ? "var(--ink)" : "var(--ink-soft)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.25s ease",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}