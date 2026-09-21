"use client";

import { useState } from "react";
import { signOutAction } from "@/app/vendor/actions";

export default function VendorHeader({ vendorName }: { vendorName: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/" style={{ whiteSpace: "nowrap", fontSize: "13px", fontWeight: 600, color: "var(--ink-mute)", textDecoration: "none" }}>
            ← Home
          </a>
          <div style={{ whiteSpace: "nowrap", fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
            Vendor Portal<span className="vendor-name-full"> &mdash; {vendorName}</span>
          </div>
        </div>

        {/* Desktop links — hidden on mobile via the existing .nav-mobile-hide breakpoint */}
        <div className="nav-mobile-hide" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="/vendor/products" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Products
          </a>
          <a href="/vendor/connect" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Payouts
          </a>
          <a href="/vendor/reviews" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Reviews
          </a>
          <a href="/vendor/history" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            History
          </a>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign Out
            </button>
          </form>
        </div>

        {/* Hamburger — reuses the same CSS class as the main site nav,
            which already only displays it at the mobile breakpoint. */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <div className="nav-hamburger-bar" />
          <div className="nav-hamburger-bar" />
          <div className="nav-hamburger-bar" />
        </button>
      </div>

      {/* Mobile overlay — reuses the same .nav-overlay CSS as the main site nav */}
      <div className={`nav-overlay${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <button className="nav-overlay-close" onClick={close} aria-label="Close menu">
          ×
        </button>
        <a href="/vendor/products" className="nav-overlay-link" onClick={close}>
          Products
        </a>
        <a href="/vendor/connect" className="nav-overlay-link" onClick={close}>
          Payouts
        </a>
        <a href="/vendor/reviews" className="nav-overlay-link" onClick={close}>
          Reviews
        </a>
        <a href="/vendor/history" className="nav-overlay-link" onClick={close}>
          History
        </a>
        <form action={signOutAction} style={{ marginTop: "8px" }}>
          <button type="submit" className="btn btn-ghost" style={{ width: "100%" }} onClick={close}>
            Sign Out
          </button>
        </form>
      </div>
    </>
  );
}
