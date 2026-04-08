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
// Drag (mouse + touch) + velocity-projected snap + infinite loop.
// Items must be tripled so the loop jump is visually seamless.
//
// Desktop click behaviour (handled by caller via onClickCapture):
//   - Dragged >10px → didDragRef.current is true → suppress click
//   - Single click, no drag → suppress (require double-click to navigate)
//   - Double click, no drag → allow Link to navigate
//
// Example consumer pattern:
//   onClickCapture={(e) => {
//     if (didDragRef.current || e.detail === 1) e.stopPropagation();
//     // double-click (e.detail >= 2) falls through → Link navigates
//   }}
// ─────────────────────────────────────────────────────────────────────────────
export function useInfiniteCarousel(
  trackRef: RefObject<HTMLDivElement | null>,
  itemsPerSet: number
) {
  // true after the pointer has moved >10px — caller uses this to suppress clicks
  const didDragRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // ── Helpers ────────────────────────────────────────────────────────────
    const singleWidth = () => track.scrollWidth / 3;

    const cardStride = () => {
      const a = track.children[0] as HTMLElement | null;
      const b = track.children[1] as HTMLElement | null;
      return a && b ? b.offsetLeft - a.offsetLeft : singleWidth() / itemsPerSet;
    };

    // ── Initialise to the middle copy ─────────────────────────────────────
    requestAnimationFrame(() => {
      track.scrollLeft = singleWidth();
    });

    // ── Infinite-loop correction ──────────────────────────────────────────
    const loopCorrect = () => {
      const sw = singleWidth();
      if (track.scrollLeft < sw)        track.scrollLeft += sw;
      else if (track.scrollLeft >= 2 * sw) track.scrollLeft -= sw;
    };

    let cancelAnim: (() => void) | undefined;

    // ── Snap with velocity projection ─────────────────────────────────────
    // velX: pixels per millisecond (positive = scrolling right).
    // Projects the scroll position forward by PROJECTION_MS worth of velocity
    // so a fast flick carries over to the next card rather than staying put.
    const snapWithVelocity = (velX: number) => {
      const st = cardStride();
      if (st <= 0) return;

      const PROJECTION_MS = 150; // how far ahead to project velocity
      const projected = track.scrollLeft + velX * PROJECTION_MS;
      const target = Math.round(projected / st) * st;

      // Faster swipe → shorter snap animation (feels responsive to the flick)
      const speed = Math.abs(velX); // px/ms
      const duration = Math.max(180, 300 - speed * 60);

      cancelAnim = animateTo(track, target, duration, loopCorrect);
    };

    // ── Mouse drag ────────────────────────────────────────────────────────
    // Threshold of 10px before the gesture is treated as a drag (not a click).
    const MOUSE_DRAG_THRESHOLD = 10;
    let dragging = false;
    let mouseStartX = 0;
    let mouseStartScroll = 0;
    let mouseVelX = 0;
    let mouseLastX = 0;
    let mouseLastT = 0;

    const onMouseDown = (e: MouseEvent) => {
      cancelAnim?.();
      dragging = true;
      didDragRef.current = false;
      mouseStartX = e.pageX;
      mouseStartScroll = track.scrollLeft;
      mouseVelX = 0;
      mouseLastX = e.pageX;
      mouseLastT = Date.now();
      track.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      if (Math.abs(e.pageX - mouseStartX) > MOUSE_DRAG_THRESHOLD) {
        didDragRef.current = true;
      }
      let next = mouseStartScroll - (e.pageX - mouseStartX);
      const sw = singleWidth();
      if (next < sw * 0.25)      { next += sw; mouseStartScroll += sw; }
      else if (next > sw * 2.75) { next -= sw; mouseStartScroll -= sw; }
      track.scrollLeft = next;

      const now = Date.now();
      const dt = now - mouseLastT;
      if (dt > 0) { mouseVelX = (mouseLastX - e.pageX) / dt; }
      mouseLastX = e.pageX;
      mouseLastT = now;
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      track.style.cursor = "grab";
      snapWithVelocity(mouseVelX);
    };

    // ── Touch drag ────────────────────────────────────────────────────────
    // Velocity is tracked the same way as mouse so a finger flick carries
    // the carousel smoothly to the next card.
    let touchStartX = 0;
    let touchStartScroll = 0;
    let touchVelX = 0;
    let touchLastX = 0;
    let touchLastT = 0;

    const onTouchStart = (e: TouchEvent) => {
      cancelAnim?.();
      didDragRef.current = false;
      touchStartX = e.touches[0].pageX;
      touchStartScroll = track.scrollLeft;
      touchVelX = 0;
      touchLastX = e.touches[0].pageX;
      touchLastT = Date.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].pageX;
      if (Math.abs(x - touchStartX) > 10) didDragRef.current = true;

      let next = touchStartScroll - (x - touchStartX);
      const sw = singleWidth();
      if (next < sw * 0.25)      { next += sw; touchStartScroll += sw; }
      else if (next > sw * 2.75) { next -= sw; touchStartScroll -= sw; }
      track.scrollLeft = next;

      const now = Date.now();
      const dt = now - touchLastT;
      if (dt > 0) { touchVelX = (touchLastX - x) / dt; }
      touchLastX = x;
      touchLastT = now;
    };

    const onTouchEnd = () => snapWithVelocity(touchVelX);

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
