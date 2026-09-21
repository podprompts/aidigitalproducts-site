"use client";

import { useState, useTransition } from "react";
import { replyToSupportAction } from "./actions";

export default function SupportReply({ requestId }: { requestId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    setError("");
    startTransition(async () => {
      const res = await replyToSupportAction(requestId, text);
      if (!res.ok) setError(res.error);
      else setText("");
    });
  }

  return (
    <div style={{ marginTop: "14px" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Write a reply. The buyer receives it by email and can answer on their request page."
        style={{
          width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
          border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
          resize: "vertical", boxSizing: "border-box", marginBottom: "10px",
        }}
      />
      <button type="button" className="btn btn-primary btn-sm" onClick={send} disabled={pending || !text.trim()}>
        {pending ? "Sending..." : "Send reply"}
      </button>
      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
    </div>
  );
}