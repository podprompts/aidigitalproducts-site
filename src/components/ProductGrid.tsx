"use client";

import { products } from "@/lib/content";

export default function ProductGrid() {
  return (
    <section className="block" id="products">
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <Eyebrow>— Marketplace —</Eyebrow>

        <h2
          className="display"
          style={{
            fontSize: "clamp(40px, 6.5vw, 88px)",
            lineHeight: 0.96,
            maxWidth: "880px",
            margin: "0 auto",
            color: "var(--ink)",
          }}
        >
          The best AI tools.
          <br />
          <span style={{ color: "var(--ink-mute)" }}>All in one place.</span>
        </h2>

        <p
          style={{
            marginTop: "28px",
            fontSize: "clamp(15px, 1.4vw, 17px)",
            fontWeight: 500,
            color: "var(--ink-faded)",
            maxWidth: "480px",
            margin: "28px auto 0",
            lineHeight: 1.6,
          }}
        >
          Curated digital products across automation, content, and intelligence — vetted for quality,
          ready for deployment.
        </p>

        <div className="product-grid">
          {products.map((p) => (
            <ProductCell key={p.num} num={p.num} title={p.title} desc={p.desc} />
          ))}
        </div>

        <div className="link-row" style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "36px", flexWrap: "wrap" }}>
          <UnderlineLink href="#">Explore the marketplace</UnderlineLink>
          <UnderlineLink href="#">See what&apos;s new</UnderlineLink>
        </div>
      </div>
    </section>
  );
}

function ProductCell({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div
      style={{
        background: "var(--bg)",
        padding: "56px 36px",
        textAlign: "left",
        minHeight: "280px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "background 0.3s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-soft)";
        const arrow = e.currentTarget.querySelector<HTMLSpanElement>(".cell-arrow");
        if (arrow) {
          arrow.style.opacity = "1";
          arrow.style.transform = "translateX(0)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg)";
        const arrow = e.currentTarget.querySelector<HTMLSpanElement>(".cell-arrow");
        if (arrow) {
          arrow.style.opacity = "0";
          arrow.style.transform = "translateX(-6px)";
        }
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--ink-mute)",
            letterSpacing: "0.15em",
          }}
        >
          {num}
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            marginTop: "8px",
          }}
        >
          {title}
        </div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--ink-faded)",
            lineHeight: 1.55,
            marginTop: "12px",
          }}
        >
          {desc}
        </p>
      </div>
      <span
        className="cell-arrow"
        style={{
          marginTop: "32px",
          fontSize: "20px",
          color: "var(--ink)",
          opacity: 0,
          transform: "translateX(-6px)",
          transition: "all 0.3s",
          display: "block",
        }}
      >
        →
      </span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--ink-faded)",
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        marginBottom: "24px",
      }}
    >
      {children}
    </div>
  );
}

function UnderlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: "var(--ink)",
        textDecoration: "none",
        borderBottom: "1px solid var(--ink-soft)",
        paddingBottom: "3px",
        transition: "border-color 0.25s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "var(--ink-soft)";
      }}
    >
      {children}
    </a>
  );
}
