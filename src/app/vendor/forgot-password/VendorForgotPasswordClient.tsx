"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function VendorForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    // window.location.origin correctly reflects whatever domain this page is
    // actually loaded from (production in prod, localhost in local dev) —
    // this is the client-side equivalent of the redirectTo lesson learned
    // earlier with the server-side generateLink() call.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/vendor/set-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 100px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "12px" }}>
          Reset your password.
        </h1>

        {status === "sent" ? (
          <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
            If an account exists for <strong style={{ color: "var(--ink)" }}>{email}</strong>, a
            password reset link is on its way. Check your inbox (and spam folder) — the link
            will bring you back here to set a new password.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6, margin: 0 }}>
              Enter the email associated with your vendor account and we&apos;ll send you a link
              to set a new password.
            </p>
            <div>
              <label
                style={{
                  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)",
                  textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px", border: "1px solid var(--ink-soft)",
                  fontSize: "14px", background: "transparent", color: "var(--ink)",
                }}
              />
            </div>
            {status === "error" && (
              <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn btn-primary"
              style={{ opacity: status === "loading" ? 0.6 : 1 }}
            >
              {status === "loading" ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <Link
          href="/vendor/login"
          style={{ display: "inline-block", marginTop: "20px", fontSize: "13px", fontWeight: 600, color: "var(--ink-mute)" }}
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
