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
        select((activeIdx + 1) % images.length);
      } else {
        select((activeIdx - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  }

  const squareContainer: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    position: "relative",
    background: "var(--bg-alt)",
    overflow: "hidden",
    flexShrink: 0,
    alignSelf: "start",
  };

  if (images.length === 0) {
    return (
      <div style={{ ...squareContainer, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Preview
        </span>
      </div>
    );
  }

  const current    = images[activeIdx] ?? null;
  const showThumbs = images.length > 1;

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

  return (
    <div
      className="gallery"
      style={{
        width: "100%",
        flexShrink: 0,
        alignSelf: "start",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Thumbnails FIRST — left side on desktop, scrollable row on mobile */}
      <div
        className="gallery-thumbs"
        style={{ overscrollBehaviorX: "contain" }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            className={`gallery-thumb${i === activeIdx ? " gallery-thumb-active" : ""}`}
            onClick={() => select(i)}
            aria-label={`View image ${i + 1}`}
            style={{ flexShrink: 0 }}
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

      {/* Main image SECOND — right side on desktop, below thumbs on mobile */}
      <div
        className="gallery-main"
        style={{
          opacity: fading ? 0 : 1,
          transition: "opacity 0.15s ease",
          minWidth: 0,
          touchAction: "pan-y",
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
    </div>
  );
}