"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source_page: window.location.pathname,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setEmail("");
      setMessage("You're in! Check your inbox for updates.");
      setStatus("success");
    } catch {
      setMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    }
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

      {status === "success" ? (
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--ink-faded)",
            maxWidth: "420px",
            margin: "0 auto",
          }}
        >
          {message}
        </p>
      ) : (
        <>
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
              disabled={status === "loading"}
              required
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
                opacity: status === "loading" ? 0.6 : 1,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ink-soft)"; }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                background: "var(--ink)",
                color: "var(--bg)",
                border: "1px solid var(--ink)",
                borderRadius: 0,
                padding: "12px 24px",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                transition: "all 0.25s",
                whiteSpace: "nowrap",
                opacity: status === "loading" ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (status === "loading") return;
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
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>

          {status === "error" && (
            <p
              style={{
                marginTop: "12px",
                fontSize: "13px",
                fontWeight: 600,
                color: message === "You're already subscribed!" ? "var(--ink-faded)" : "#e53e3e",
              }}
            >
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
