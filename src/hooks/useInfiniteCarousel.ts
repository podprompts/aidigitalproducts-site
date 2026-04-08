"use client";

import { type RefObject, useRef, useEffect } from "react";

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ─── Animate scrollLeft to a target, returns a cancel fn ─────────────────────
function animateTo(
  track: HTMLElement,
  target: number,
  duration: number,
  onDone?: () => void
): () => void {
  const start = track.scrollLeft;
  const diff = target - start;
  if (Math.abs(diff) < 1) {
    track.scrollLeft = target;
    onDone?.();
    return () => {};
  }
  const t0 = performance.now();
  let raf: number;
  const step = (now: number) => {
    const p = Math.min((now - t0) / duration, 1);
    track.scrollLeft = start + diff * easeOutCubic(p);
    if (p < 1) {
      raf = requestAnimationFrame(step);
    } else {
      track.scrollLeft = target;
      onDone?.();
    }
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

// ─────────────────────────────────────────────────────────────────────────────
// useInfiniteCarousel
//
// Attaches drag (mouse + touch) + snap-to-card + infinite-loop to a carousel
// track element. The track must have its items tripled (first copy, middle
// copy, third copy) so the loop jump is visually seamless.
//
// Usage:
//   const trackRef = useRef<HTMLDivElement>(null);
//   const { didDragRef } = useInfiniteCarousel(trackRef, itemsPerSet);
//   // In JSX: <div ref={trackRef} ... onClickCapture={e => { if (didDragRef.current) e.stopPropagation(); }}>
// ─────────────────────────────────────────────────────────────────────────────
export function useInfiniteCarousel(
  trackRef: RefObject<HTMLDivElement | null>,
  itemsPerSet: number
) {
  // Set to true when the user actually drags; used by the caller to suppress
  // click navigation after a drag gesture.
  const didDragRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // ── Helpers ────────────────────────────────────────────────────────────
    const singleWidth = () => track.scrollWidth / 3;

    // Measure the distance between two adjacent card left edges (card + gap).
    // Falls back to calculated value if DOM isn't ready.
    const cardStride = () => {
      const a = track.children[0] as HTMLElement | null;
      const b = track.children[1] as HTMLElement | null;
      return a && b ? b.offsetLeft - a.offsetLeft : singleWidth() / itemsPerSet;
    };

    // ── Initialise to the middle copy so the user can scroll in both directions
    requestAnimationFrame(() => {
      track.scrollLeft = singleWidth();
    });

    // ── Infinite-loop correction ───────────────────────────────────────────
    // After a snap (or during a drag) silently jump back to the middle copy.
    // The jump is instant and visually seamless because the cards are tripled.
    const loopCorrect = () => {
      const sw = singleWidth();
      if (track.scrollLeft < sw) {
        track.scrollLeft += sw;
      } else if (track.scrollLeft >= 2 * sw) {
        track.scrollLeft -= sw;
      }
    };

    // ── Snap to the nearest card after a gesture ends ─────────────────────
    let cancelAnim: (() => void) | undefined;
    const snapToNearest = () => {
      const st = cardStride();
      if (st <= 0) return;
      const target = Math.round(track.scrollLeft / st) * st;
      cancelAnim = animateTo(track, target, 280, loopCorrect);
    };

    // ── Mouse drag ────────────────────────────────────────────────────────
    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    const onMouseDown = (e: MouseEvent) => {
      cancelAnim?.();
      dragging = true;
      didDragRef.current = false;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      track.style.cursor = "grabbing";
      e.preventDefault(); // prevents text selection during drag
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      if (Math.abs(e.pageX - startX) > 5) didDragRef.current = true;
      let next = startScroll - (e.pageX - startX);
      // Keep the reference scroll position in sync when we loop so the drag
      // calculation stays correct across the infinite boundary.
      const sw = singleWidth();
      if (next < sw * 0.25)       { next += sw; startScroll += sw; }
      else if (next > sw * 2.75)  { next -= sw; startScroll -= sw; }
      track.scrollLeft = next;
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      track.style.cursor = "grab";
      snapToNearest();
    };

    // ── Touch drag ────────────────────────────────────────────────────────
    let touchStartX = 0;
    let touchStartScroll = 0;

    const onTouchStart = (e: TouchEvent) => {
      cancelAnim?.();
      didDragRef.current = false;
      touchStartX = e.touches[0].pageX;
      touchStartScroll = track.scrollLeft;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].pageX - touchStartX) > 5) didDragRef.current = true;
      let next = touchStartScroll - (e.touches[0].pageX - touchStartX);
      const sw = singleWidth();
      if (next < sw * 0.25)       { next += sw; touchStartScroll += sw; }
      else if (next > sw * 2.75)  { next -= sw; touchStartScroll -= sw; }
      track.scrollLeft = next;
    };

    const onTouchEnd = () => snapToNearest();

    // ── Wire up ───────────────────────────────────────────────────────────
    track.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    track.addEventListener("touchstart", onTouchStart, { passive: true });
    track.addEventListener("touchmove", onTouchMove, { passive: true });
    track.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      cancelAnim?.();
      track.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      track.removeEventListener("touchstart", onTouchStart);
      track.removeEventListener("touchmove", onTouchMove);
      track.removeEventListener("touchend", onTouchEnd);
    };
  }, [trackRef, itemsPerSet]);

  return { didDragRef };
}
