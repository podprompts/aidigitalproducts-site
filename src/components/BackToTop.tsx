"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = document.documentElement.scrollHeight * 0.33;
      setVisible(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Back to top"
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: hovered ? "transparent" : "var(--ink)",
        color: hovered ? "var(--ink)" : "var(--bg)",
        border: "1px solid var(--ink)",
        fontSize: "18px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms, background 0.25s, color 0.25s",
        pointerEvents: visible ? "auto" : "none",
        fontFamily: "inherit",
      }}
    >
      ↑
    </button>
  );
}
