"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESCALATION_REASONS, REASON_LABELS } from "@/lib/support-constants";

export default function ThreadActions({
  token, status, overdue,
}: { token: string; status: string; overdue: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(payload: Record<string, string>, after?: () => void) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/support/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      after?.();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const reasons: Record<string, string> = overdue
    ? { no_response: REASON_LABELS.no_response, ...ESCALATION_REASONS }
    : ESCALATION_REASONS;

  const boxStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
          Add a message
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2000} style={{ ...boxStyle, resize: "vertical", marginBottom: "10px" }} />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy || !message.trim()}
          onClick={() => call({ action: "reply", message }, () => setMessage(""))}
        >
          {busy ? "Sending..." : "Send message"}
        </button>
      </div>

      {status === "open" && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
            Ask our team to step in
          </div>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...boxStyle, marginBottom: "10px" }}>
            <option value="">Choose a reason</option>
            {Object.entries(reasons).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="Optional: anything our team should know" style={{ ...boxStyle, resize: "vertical", marginBottom: "10px" }} />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy || !reason}
            onClick={() => call({ action: "escalate", reason, message: note }, () => { setReason(""); setNote(""); })}
          >
            Escalate to AI Digital Products
          </button>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => { if (window.confirm("Mark this request as resolved?")) call({ action: "resolve" }); }}
        >
          My problem is solved
        </button>
      </div>

      {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{error}</p>}
    </div>
  );
}