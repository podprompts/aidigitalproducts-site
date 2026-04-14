"use client";

import { useState, useEffect } from "react";

export default function ViewingBadge({ productId }: { productId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = `viewing_${productId}`;
    const stored = sessionStorage.getItem(key);
    const initial = stored ? parseInt(stored, 10) : Math.floor(Math.random() * 30) + 8;
    if (!stored) sessionStorage.setItem(key, String(initial));
    setCount(initial);

    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const delay = (Math.random() * 60 + 60) * 1000;
      timeout = setTimeout(() => {
        setCount((prev) => {
          if (prev === null) return prev;
          const delta = Math.floor(Math.random() * 5) - 2;
          const next = Math.max(4, Math.min(50, prev + delta));
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
        <span>Digital download</span>
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