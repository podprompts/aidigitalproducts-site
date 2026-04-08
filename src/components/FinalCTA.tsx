"use client";

import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="final-cta">
      <h2
        className="display"
        style={{
          fontSize: "clamp(48px, 8vw, 120px)",
          lineHeight: 0.94,
          color: "var(--ink)",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        Built with AI.
        <br />
        <span style={{ color: "var(--ink-mute)" }}>Delivered instantly.</span>
      </h2>

      <p
        style={{
          marginTop: "28px",
          fontSize: "16px",
          fontWeight: 500,
          color: "var(--ink-faded)",
        }}
      >
        The marketplace for people who want results, not experiments.
      </p>

      <Link
        href="/products"
        style={{
          marginTop: "44px",
          display: "inline-block",
          padding: "14px 30px",
          borderRadius: "980px",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "0.01em",
          background: "var(--ink)",
          color: "var(--bg)",
          border: "1px solid var(--ink)",
          transition: "all 0.25s",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = "transparent";
          el.style.color = "var(--ink)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "var(--ink)";
          el.style.color = "var(--bg)";
        }}
      >
        Browse Products
      </Link>
    </section>
  );
}
