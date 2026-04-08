"use client";

import Link from "next/link";
import { pricingTiers } from "@/lib/content";

export default function Pricing() {
  return (
    <section className="block" id="pricing">
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <Eyebrow>— Done For You AI —</Eyebrow>

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
          Find your solution.
          <br />
          <span style={{ color: "var(--ink-mute)" }}>At your price.</span>
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
          One-time purchases. No subscriptions. No surprises.
        </p>

        <div className="pricing-grid">
          {pricingTiers.map((t) => (
            <PriceCard key={t.tier} tier={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PriceCard({ tier }: { tier: (typeof pricingTiers)[number] }) {
  return (
    <div
      style={{
        background: "var(--bg)",
        padding: "56px 40px",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "var(--ink-faded)",
          whiteSpace: "nowrap",
        }}
      >
        {tier.tier}
      </div>

      <div
        style={{
          marginTop: "24px",
          fontSize: tier.amountSize ?? "56px",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "var(--ink)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {tier.amount}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--ink-mute)",
            marginLeft: "4px",
          }}
        >
          {tier.period}
        </span>
      </div>

      <p
        style={{
          marginTop: "20px",
          fontSize: "14px",
          color: "var(--ink-faded)",
          lineHeight: 1.55,
        }}
      >
        {tier.desc}
      </p>

      <div
        style={{
          height: "1px",
          background: "var(--line)",
          margin: "32px 0",
        }}
      />

      <ul style={{ listStyle: "none", flex: 1 }}>
        {tier.features.map((f) => (
          <li
            key={f}
            style={{
              fontSize: "13px",
              color: "var(--ink-faded)",
              padding: "7px 0",
              fontWeight: 500,
            }}
          >
            <span style={{ color: "var(--ink-mute)", marginRight: "10px" }}>—</span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={tier.btnHref}
        style={{
          marginTop: "28px",
          display: "inline-block",
          padding: "13px 24px",
          borderRadius: "980px",
          fontSize: "13px",
          fontWeight: 700,
          background: "transparent",
          color: "var(--ink)",
          border: "1px solid var(--ink)",
          textDecoration: "none",
          transition: "all 0.25s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = "var(--ink)";
          el.style.color = "var(--bg)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "transparent";
          el.style.color = "var(--ink)";
        }}
      >
        {tier.btnLabel}
      </Link>
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
