"use client";

import { useState } from "react";
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

  function select(idx: number) {
    if (idx === activeIdx || fading) return;
    setFading(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setFading(false);
    }, 150);
  }

  const current   = images[activeIdx] ?? null;
  const showThumbs = images.length > 1;

  // Empty — no images at all
  if (images.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-alt)",
          aspectRatio: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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

  // Single image — no thumbnail strip needed
  if (!showThumbs) {
    return (
      <div
        style={{
          background: "var(--bg-alt)",
          aspectRatio: "1",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={() => setMainHovered(true)}
        onMouseLeave={() => setMainHovered(false)}
      >
        <Image
          src={current!.url}
          alt={current!.alt ?? alt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{
            objectFit: "cover",
            transform: mainHovered ? "scale(1.02)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />
      </div>
    );
  }

  // Full gallery — thumbnail strip + main image
  return (
    <div className="gallery">
      {/* Thumbnail strip */}
      <div className="gallery-thumbs">
        {images.map((img, i) => (
          <button
            key={i}
            className={`gallery-thumb${i === activeIdx ? " gallery-thumb-active" : ""}`}
            onClick={() => select(i)}
            aria-label={`View image ${i + 1}`}
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

      {/* Main image */}
      <div
        className="gallery-main"
        style={{
          opacity: fading ? 0 : 1,
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={() => setMainHovered(true)}
        onMouseLeave={() => setMainHovered(false)}
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt ?? alt}
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            style={{
              objectFit: "cover",
              transform: mainHovered ? "scale(1.02)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
          />
        )}
      </div>
    </div>
  );
}
