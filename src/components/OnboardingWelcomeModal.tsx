"use client";

import { useState } from "react";
import AvatarUploader from "./AvatarUploader";

interface Props {
  stripeConnected: boolean;
  vendorName: string;
  avatarUrl: string | null;
}

export default function OnboardingWelcomeModal({ stripeConnected, vendorName, avatarUrl: initialAvatarUrl }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const needsStripe = !stripeConnected;
  const needsAvatar = !avatarUrl;
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!needsStripe && !needsAvatar)) return null;

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
          onClick={() => setDismissed(true)}
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
          {needsStripe && needsAvatar
            ? "Two steps left to finish setting up."
            : needsStripe
            ? "One step left before you can get paid."
            : "One step left — add your photo."}
        </h2>

        {needsAvatar && (
          <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: needsStripe ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "12px" }}>
              1. Add a profile picture
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, marginBottom: "16px" }}>
              Buyers see this next to your products — every seller needs one.
            </p>
            <AvatarUploader currentAvatarUrl={avatarUrl} role="vendor" onUploaded={setAvatarUrl} />
          </div>
        )}

        {needsStripe && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "12px" }}>
              {needsAvatar ? "2. " : ""}Connect Stripe to get paid
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.65, marginBottom: "20px" }}>
              You&apos;re fully set up to list and manage products. But to actually receive your share
              of each sale, you need to connect a Stripe account. Until this is done, sales are still
              recorded normally — your payouts just can&apos;t be sent to you yet.
            </p>
            <p style={{ fontSize: "12px", color: "var(--ink-mute)", lineHeight: 1.6, marginBottom: "20px" }}>
              The platform keeps a 20% commission on each sale; the rest is transferred directly to
              your connected account by Stripe.
            </p>
            <a href="/vendor/connect" className="btn btn-primary">
              Connect Stripe Account
            </a>
          </div>
        )}

        <div style={{ marginTop: "24px" }}>
          <button onClick={() => setDismissed(true)} className="btn btn-ghost">
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}
