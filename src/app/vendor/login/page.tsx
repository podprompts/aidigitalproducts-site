"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function VendorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/vendor/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1
          className="display"
          style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "4px" }}
        >
          Vendor Login
        </h1>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--ink-faded)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
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
              width: "100%",
              padding: "12px 14px",
              border: "1px solid var(--ink-soft)",
              fontSize: "14px",
              background: "transparent",
              color: "var(--ink)",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--ink-faded)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
            }}
          >
            Password
          </label>
          <PasswordInput
            id="vendor-password"
            value={password}
            onChange={setPassword}
            required
          />
        </div>

        {error && (
          <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}