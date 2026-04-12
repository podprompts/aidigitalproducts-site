"use client";

import { useEffect, useRef, useState } from "react";

export default function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Show popup after 10 seconds on every visit
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Focus input when popup opens
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      setErrorMsg("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setVisible(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20, 20, 20, 0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 900,
          animation: "fadeIn 300ms ease both",
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Get early access to deals"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 901,
          width: "min(480px, calc(100vw - 48px))",
          background: "var(--bg)",
          border: "1px solid var(--ink)",
          padding: "48px 40px 40px",
          animation: "slideUpIn 350ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-mute)",
            fontSize: "20px",
            lineHeight: 1,
            padding: "4px",
            transition: "color 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-mute)")}
        >
          ×
        </button>

        {status === "success" ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>✓</div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
                marginBottom: "12px",
              }}
            >
              You&apos;re in
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(24px, 5vw, 32px)", marginBottom: "16px" }}
            >
              Watch your inbox.
            </h2>
            <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
              You&apos;ll be the first to know when a deal drops — before anyone else sees it.
              Check your <strong>Promotions tab</strong> and drag us to Primary so you never miss out.
            </p>
          </div>
        ) : (
          /* ── Default state ── */
          <>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
                marginBottom: "16px",
              }}
            >
              🔥 Early access
            </p>

            <h2
              className="display"
              style={{
                fontSize: "clamp(28px, 5vw, 38px)",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              Get deals before anyone else.
            </h2>

            <p
              style={{
                fontSize: "14px",
                color: "var(--ink-faded)",
                lineHeight: 1.65,
                marginBottom: "32px",
              }}
            >
              Drop your email and we&apos;ll notify you the moment a flash sale goes live —
              30-minute windows, real discounts, no spam.
            </p>

            {/* Email input */}
            <div className="field" style={{ marginBottom: "12px" }}>
              <label htmlFor="popup-email">Email address</label>
              <input
                ref={inputRef}
                id="popup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                disabled={status === "loading"}
              />
            </div>

            {/* Error message */}
            {errorMsg && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#c0392b",
                  marginBottom: "12px",
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </p>
            )}

            {/* CTA button */}
            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "20px" }}
            >
              {status === "loading" ? "Saving..." : "Notify me →"}
            </button>

            {/* Dismiss */}
            <p
              style={{
                fontSize: "12px",
                color: "var(--ink-mute)",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              No spam. No newsletters. Just deal alerts.{" "}
              <button
                onClick={() => setVisible(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--ink-mute)",
                  textDecoration: "underline",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                I&apos;ll pass for now
              </button>
            </p>
          </>
        )}
      </div>
    </>
  );
}