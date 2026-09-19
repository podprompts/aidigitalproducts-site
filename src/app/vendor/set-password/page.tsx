"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function VendorSetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // The recovery link authenticates the browser via a session encoded in
    // the URL itself — the Supabase client picks this up automatically on
    // load. We just confirm it actually landed before showing the form.
    supabase.auth.getUser().then(({ data }) => {
      setSessionValid(!!data.user);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/vendor/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Checking your link…</p>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px" }}>
        <div style={{ maxWidth: "360px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>
            This link has expired or already been used.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
            Contact us at{" "}
            <a href="mailto:support@aidigitalproducts.com" style={{ color: "var(--ink)" }}>
              support@aidigitalproducts.com
            </a>{" "}
            for a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", textAlign: "center", marginBottom: "12px" }}>
          Set your password.
        </h1>
        <p style={{ fontSize: "13px", color: "var(--ink-faded)", textAlign: "center", marginBottom: "36px" }}>
          Choose a password for your new seller account.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
              New Password
            </label>
            <PasswordInput id="new-password" value={password} onChange={setPassword} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
              Confirm Password
            </label>
            <PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} required />
          </div>
          {error && <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}