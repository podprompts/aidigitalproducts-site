"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

export interface GalleryImage {
  url: string;
  alt?: string;
}

interface Props {
  images: GalleryImage[];
  alt: string;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIdx,
  alt,
  onClose,
}: {
  images: GalleryImage[];
  startIdx: number;
  alt: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  // Keyboard navigation + Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx > 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const current = images[idx];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(10, 10, 10, 0.96)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "lb-fade-in 0.2s ease",
      }}
    >
      <style>{`
        @keyframes lb-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lb-img-in { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
        .lb-thumb-strip::-webkit-scrollbar { display: none; }
        .lb-thumb-strip { scrollbar-width: none; }
        .lb-nav-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .lb-close-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .lb-thumb:hover { opacity: 1 !important; }
      `}</style>

      {/* Close button */}
      <button
        className="lb-close-btn"
        onClick={onClose}
        aria-label="Close lightbox"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "50%",
          width: "44px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontSize: "20px",
          lineHeight: 1,
          transition: "background 0.2s",
          zIndex: 10,
        }}
      >
        ×
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
          }}
        >
          {String(idx + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </div>
      )}

      {/* Main image area */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: "min(90vw, 900px)",
          height: "min(70vh, 700px)",
          flexShrink: 0,
        }}
      >
        <Image
          key={idx}
          src={current.url}
          alt={current.alt ?? alt}
          fill
          sizes="90vw"
          priority
          style={{
            objectFit: "contain",
            animation: "lb-img-in 0.2s ease",
          }}
        />
      </div>

      {/* Prev / Next arrows */}
      {images.length > 1 && (
        <>
          <button
            className="lb-nav-btn"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous image"
            style={{
              position: "absolute",
              left: "clamp(8px, 3vw, 32px)",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%",
              width: "52px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "22px",
              transition: "background 0.2s",
            }}
          >
            ←
          </button>
          <button
            className="lb-nav-btn"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next image"
            style={{
              position: "absolute",
              right: "clamp(8px, 3vw, 32px)",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%",
              width: "52px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "22px",
              transition: "background 0.2s",
            }}
          >
            →
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="lb-thumb-strip"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "24px",
            overflowX: "auto",
            maxWidth: "min(90vw, 900px)",
            padding: "4px 2px",
            flexShrink: 0,
          }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              className="lb-thumb"
              onClick={() => setIdx(i)}
              aria-label={`View image ${i + 1}`}
              style={{
                flexShrink: 0,
                width: "64px",
                height: "64px",
                position: "relative",
                borderRadius: "4px",
                overflow: "hidden",
                border: i === idx
                  ? "2px solid rgba(255,255,255,0.9)"
                  : "2px solid rgba(255,255,255,0.15)",
                opacity: i === idx ? 1 : 0.5,
                transition: "opacity 0.2s, border-color 0.2s",
                cursor: "pointer",
                background: "none",
                padding: 0,
              }}
            >
              <Image
                src={img.url}
                alt={img.alt ?? alt}
                fill
                sizes="64px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ProductGallery ───────────────────────────────────────────────────────────

export default function ProductGallery({ images, alt }: Props) {
  const [activeIdx, setActiveIdx]     = useState(0);
  const [fading, setFading]           = useState(false);
  const [mainHovered, setMainHovered] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const touchStartX = useRef<number | null>(null);

  function select(idx: number) {
    if (idx === activeIdx || fading) return;
    setFading(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setFading(false);
    }, 150);
  }

  function openLightbox(idx: number) {
    setLightboxIdx(idx);
  }

  function closeLightbox() {
    setLightboxIdx(null);
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
      <>
        <div
          style={{ ...squareContainer, cursor: "zoom-in" }}
          onMouseEnter={() => setMainHovered(true)}
          onMouseLeave={() => setMainHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => openLightbox(0)}
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

        {lightboxIdx !== null && (
          <Lightbox
            images={images}
            startIdx={lightboxIdx}
            alt={alt}
            onClose={closeLightbox}
          />
        )}
      </>
    );
  }

  return (
    <>
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
        {/* Thumbnails — left side on desktop, scrollable row on mobile */}
        <div
          className="gallery-thumbs"
          style={{ overscrollBehaviorX: "contain" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              className={`gallery-thumb${i === activeIdx ? " gallery-thumb-active" : ""}`}
              onClick={() => { select(i); }}
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

        {/* Main image — click to open lightbox */}
        <div
          className="gallery-main"
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 0.15s ease",
            minWidth: 0,
            touchAction: "pan-y",
            cursor: "zoom-in",
          }}
          onMouseEnter={() => setMainHovered(true)}
          onMouseLeave={() => setMainHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => openLightbox(activeIdx)}
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

      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          startIdx={lightboxIdx}
          alt={alt}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}