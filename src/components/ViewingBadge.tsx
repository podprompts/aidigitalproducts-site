"use client";

import { useState, useEffect } from "react";

function getViewingRange(productId: string): { min: number; max: number } {
  const hour = new Date().getHours();
  const isPeak = hour >= 9 && hour < 23;

  // Seed per-product variation using the productId
  const seed = productId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const popularityBoost = seed % 3 === 0 ? 3 : seed % 3 === 1 ? 1 : 0;

  if (isPeak) {
    return { min: 6 + popularityBoost, max: 16 + popularityBoost };
  } else {
    return { min: 1, max: 4 + popularityBoost };
  }
}

export default function ViewingBadge({ productId }: { productId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = `viewing_${productId}`;
    const { min, max } = getViewingRange(productId);

    const stored = sessionStorage.getItem(key);
    const storedVal = stored ? parseInt(stored, 10) : null;

    // If stored value is outside today's plausible range, reset it
    const initial =
      storedVal !== null && storedVal >= min && storedVal <= max
        ? storedVal
        : Math.floor(Math.random() * (max - min + 1)) + min;

    if (!stored || storedVal !== initial) {
      sessionStorage.setItem(key, String(initial));
    }

    setCount(initial);

    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      // Drift every 45–90 seconds
      const delay = (Math.random() * 45 + 45) * 1000;
      timeout = setTimeout(() => {
        setCount((prev) => {
          if (prev === null) return prev;
          const { min: currentMin, max: currentMax } = getViewingRange(productId);
          const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          const next = Math.max(currentMin, Math.min(currentMax, prev + delta));
          sessionStorage.setItem(`viewing_${productId}`, String(next));
          return next;
        });
        tick();
      }, delay);
    }

    tick();
    return () => clearTimeout(timeout);
  }, [productId]);

  if (count === null) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#9ca3af",
        }}
      >
        <span style={{ filter: "grayscale(1)", color: "#9ca3af" }}>⬇</span>
        <span>Instant Download</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        <span style={{ filter: "grayscale(1)", color: "#9ca3af" }}>👁</span>
        <span style={{ color: "#16a34a" }}>{count} viewing</span>
      </div>
    </div>
  );
}