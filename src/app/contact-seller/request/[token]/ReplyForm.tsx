"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplyForm({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/contact-seller/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessage("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const boxStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
    boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
        Add a message
      </div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2000} style={{ ...boxStyle, resize: "vertical", marginBottom: "10px" }} />
      <button type="button" className="btn btn-primary btn-sm" disabled={busy || !message.trim()} onClick={send}>
        {busy ? "Sending..." : "Send message"}
      </button>
      {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}