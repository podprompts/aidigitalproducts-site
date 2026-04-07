"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Submission not yet wired — placeholder for a later phase.
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "64px clamp(24px, 5vw, 64px)",
        borderBottom: "1px solid var(--line)",
        textAlign: "center",
      }}
    >
      <h3
        className="display"
        style={{
          fontSize: "clamp(24px, 2.5vw, 32px)",
          lineHeight: 1,
          color: "var(--ink)",
          marginBottom: "28px",
        }}
      >
        Stay in the loop.{" "}
        <span style={{ color: "var(--ink-mute)" }}>Subscribe.</span>
      </h3>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          maxWidth: "420px",
          margin: "0 auto",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address"
          style={{
            flex: 1,
            background: "transparent",
            border: "1px solid var(--ink-soft)",
            borderRight: "none",
            borderRadius: 0,
            padding: "12px 16px",
            fontSize: "14px",
            color: "var(--ink)",
            fontFamily: "inherit",
            outline: "none",
            minWidth: 0,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--ink)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--ink-soft)";
          }}
        />
        <button
          type="submit"
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            border: "1px solid var(--ink)",
            borderRadius: 0,
            padding: "12px 24px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "all 0.25s",
            whiteSpace: "nowrap",
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
          Subscribe
        </button>
      </form>
    </div>
  );
}
