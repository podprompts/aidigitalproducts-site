"use client";

import { useState } from "react";
import { replyToContactAction } from "./actions";

export default function ReplyBox({ requestId }: { requestId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    const res = await replyToContactAction(requestId, text);
    if (!res.ok) {
      setError(res.error);
    } else {
      setText("");
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Write a reply..."
        style={{ width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit", border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)", boxSizing: "border-box", resize: "vertical", marginBottom: "10px" }}
      />
      <button type="button" className="btn btn-primary btn-sm" disabled={busy || !text.trim()} onClick={send}>
        {busy ? "Sending..." : "Reply"}
      </button>
      {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}