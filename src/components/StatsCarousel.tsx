"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

const ALL_PILL: Category = { id: "__all__", name: "All", slug: "", display_order: -1 };

export default function StatsCarousel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(({ categories }) => {
        setCategories(categories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Pills = "All" first, then active categories ordered by display_order
  const pills = [ALL_PILL, ...categories];
  // Triple so user can scroll freely in both directions (same as original)
  const tripled = [...pills, ...pills, ...pills];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || pills.length === 0) return;

    // Snap to the middle copy on mount
    const initScroll = () => {
      track.scrollLeft = track.scrollWidth / 3;
    };
    requestAnimationFrame(initScroll);

    let isDragging = false;
    let startX = 0;
    let startScroll = 0;
    let velX = 0;
    let lastX = 0;
    let lastT = 0;
    let momentumId: number;

    const singleW = () => track.scrollWidth / 3;

    /** Jump back into the middle copy when drifting into an outer copy */
    const loop = () => {
      const sw = singleW();
      if (track.scrollLeft < sw * 0.4) track.scrollLeft += sw;
      else if (track.scrollLeft > sw * 2.6) track.scrollLeft -= sw;
    };

    /* ── Mouse ───────────────────────────────────────────── */
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
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
      track.scrollLeft = startScroll - (e.pageX - startX);
      const now = Date.now();
      const dt = now - lastT;
      if (dt > 0) { velX = (lastX - e.pageX) / dt; lastX = e.pageX; lastT = now; }
      loop();
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      track.style.cursor = "grab";
      momentum();
    };

    /* ── Touch ───────────────────────────────────────────── */
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].pageX;
      startScroll = track.scrollLeft;
      velX = 0;
      lastX = e.touches[0].pageX;
      lastT = Date.now();
      cancelAnimationFrame(momentumId);
    };

    const onTouchMove = (e: TouchEvent) => {
      track.scrollLeft = startScroll - (e.touches[0].pageX - startX);
      const now = Date.now();
      const dt = now - lastT;
      if (dt > 0) { velX = (lastX - e.touches[0].pageX) / dt; lastX = e.touches[0].pageX; lastT = now; }
      loop();
    };

    const onTouchEnd = () => momentum();

    /* ── Momentum ─────────────────────────────────────────── */
    const momentum = () => {
      const FRAME = 1000 / 60;
      const DECAY = 0.93;
      const step = () => {
        if (Math.abs(velX) < 0.05) return;
        track.scrollLeft += velX * FRAME;
        velX *= DECAY;
        loop();
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
  // Re-run when categories load so scrollWidth is calculated against real content
  }, [pills.length]);

  if (loading) {
    return (
      <div
       style={{
  height: 56,
}}
      />
    );
  }

  return (
    <div
      style={{
  height: 56,
  overflow: "hidden",
        position: "relative",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <style>{`
        .cat-track { scrollbar-width: none; -ms-overflow-style: none; }
        .cat-track::-webkit-scrollbar { display: none; }
        .cat-pill { transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .cat-pill:hover { color: var(--ink) !important; background: var(--line) !important; }
      `}</style>

      <div
        ref={trackRef}
        className="cat-track"
        style={{
          height: "100%",
          overflowX: "scroll",
          overflowY: "hidden",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "grab",
          userSelect: "none",
          padding: "0 24px",
        }}
      >
        {tripled.map((pill, i) => (
          <Link
            key={`${pill.id}-${i}`}
            href={pill.slug ? `/categories/${pill.slug}` : "/products"}
            draggable={false}
            className="cat-pill"
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              padding: "5px 14px",
              borderRadius: 9999,
              border: "none",
background: "var(--bg-alt)",
color: "var(--ink-faded)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              letterSpacing: "0.01em",
              textDecoration: "none",
            }}
          >
            {pill.name}
          </Link>
        ))}
      </div>
    </div>
  );
}