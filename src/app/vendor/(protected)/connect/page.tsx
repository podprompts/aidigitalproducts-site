"use client";

import { useState, useEffect } from "react";

type Status = {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
};

export default function VendorConnectPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/connect/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Couldn't check your payout status. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleConnect() {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start setup");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setStarting(false);
    }
  }

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "8px" }}>
        Payouts
      </h1>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px" }}>
        Connect a Stripe account to receive your share of each sale automatically. The platform
        keeps a commission on every order; the rest is transferred to you directly by Stripe.
      </p>

      {loading && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Checking your status…</p>}

      {!loading && status && (
        <div style={{ border: "1px solid var(--line)", padding: "24px", marginBottom: "24px" }}>
          {!status.connected && (
            <p style={{ fontSize: "14px", color: "var(--ink-faded)", margin: 0 }}>
              You haven&apos;t connected a Stripe account yet.
            </p>
          )}
          {status.connected && !status.onboardingComplete && (
            <p style={{ fontSize: "14px", color: "var(--ink-faded)", margin: 0 }}>
              Your Stripe account setup is incomplete — Stripe still needs some information from
              you before you can receive payouts.
            </p>
          )}
          {status.connected && status.onboardingComplete && (
            <p style={{ fontSize: "14px", color: "#166534", fontWeight: 600, margin: 0 }}>
              ✓ Connected and ready to receive payouts.
            </p>
          )}
        </div>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "#e53e3e", marginBottom: "16px" }}>{error}</p>
      )}

      {!loading && status && !status.onboardingComplete && (
        <button
          onClick={handleConnect}
          disabled={starting}
          className="btn btn-primary"
          style={{ opacity: starting ? 0.6 : 1 }}
        >
          {starting ? "Redirecting to Stripe…" : status.connected ? "Finish Setup" : "Connect Stripe Account"}
        </button>
      )}
    </div>
  );
}