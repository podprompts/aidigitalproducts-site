"use client";

import { useState } from "react";

interface Props {
  showByDefault: boolean;
  vendorName: string;
}

export default function OnboardingWelcomeModal({ showByDefault, vendorName }: Props) {
  const [open, setOpen] = useState(showByDefault);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 20, 20, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--line)",
          maxWidth: "480px",
          width: "100%",
          padding: "36px",
          position: "relative",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Remind me later"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: "var(--ink-faded)",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ×
        </button>

        <div
          style={{
            fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)",
            textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: "16px",
          }}
        >
          Welcome, {vendorName}
        </div>

        <h2 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px", lineHeight: 1.2 }}>
          One step left before you can get paid.
        </h2>

        <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.65, marginBottom: "20px" }}>
          You&apos;re fully set up to list and manage products. But to actually receive your share
          of each sale, you need to connect a Stripe account. Until this is done, sales are still
          recorded normally — your payouts just can&apos;t be sent to you yet.
        </p>

        <div style={{ border: "1px solid var(--line)", padding: "18px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            How it works
          </div>
          <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
              Click <strong style={{ color: "var(--ink)" }}>Connect Stripe Account</strong> below
            </li>
            <li style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
              Complete Stripe&apos;s short setup form — your business details and bank account
            </li>
            <li style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
              Once approved, payouts happen automatically on every future sale — no further action needed
            </li>
          </ol>
        </div>

        <p style={{ fontSize: "12px", color: "var(--ink-mute)", lineHeight: 1.6, marginBottom: "28px" }}>
          The platform keeps a 20% commission on each sale; the rest is transferred directly to
          your connected account by Stripe.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href="/vendor/connect" className="btn btn-primary">
            Connect Stripe Account
          </a>
          <button onClick={() => setOpen(false)} className="btn btn-ghost">
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}