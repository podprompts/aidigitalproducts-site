"use client";

import { useEffect, useRef } from "react";

const ITEMS = ["Instant Download", "Commercial License Included", "New Products Daily", "AIDigitalProducts.com"];
const tripled = [...ITEMS, ...ITEMS, ...ITEMS];

export default function StatsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Snap to the middle copy so we can scroll in both directions infinitely
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

    /** Jump back into the middle copy when the user drifts into an outer copy */
    const loop = () => {
      const sw = singleW();
      if (track.scrollLeft < sw * 0.4) track.scrollLeft += sw;
      else if (track.scrollLeft > sw * 2.6) track.scrollLeft -= sw;
    };

    /* ── Mouse ─────────────────────────────────────────── */
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

    /* ── Touch ─────────────────────────────────────────── */
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

    /* ── Momentum ───────────────────────────────────────── */
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
  }, []);

  return (
    <div
      style={{
        height: "48px",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Hide scrollbar cross-browser */}
      <style>{`
        .stats-track { scrollbar-width: none; -ms-overflow-style: none; }
        .stats-track::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        ref={trackRef}
        className="stats-track"
        style={{
          height: "100%",
          overflowX: "scroll",
          overflowY: "hidden",
          display: "flex",
          alignItems: "center",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        {tripled.map((item, i) => (
          <span
            key={i}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--ink-faded)",
              whiteSpace: "nowrap",
              paddingLeft: i === 0 ? "24px" : 0,
            }}
          >
            {item}
            <span style={{ margin: "0 20px", color: "var(--ink-soft)" }}>—</span>
          </span>
        ))}
      </div>
    </div>
  );
}