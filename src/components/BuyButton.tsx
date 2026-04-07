"use client";

import { useState } from "react";

interface BuyButtonProps {
  /** Pre-created Stripe Price ID — takes precedence over inline price data */
  priceId?: string;
  /** Internal product ID stored in metadata */
  productId?: string;
  productName?: string;
  /** Price in dollars, e.g. 29.99 */
  productPrice?: number;
  label?: string;
  className?: string;
}

export default function BuyButton({
  priceId,
  productId,
  productName,
  productPrice,
  label = "Buy Now",
  className = "btn btn-primary",
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, productId, productName, productPrice }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "wait" : "pointer" }}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && (
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#e53e3e" }}>{error}</span>
      )}
    </span>
  );
}
