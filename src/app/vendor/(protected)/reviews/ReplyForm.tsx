"use client";

import { useState, useTransition } from "react";
import { saveReplyAction, deleteReplyAction } from "./actions";

export default function ReplyForm({
  reviewId,
  existingReply,
}: {
  reviewId: string;
  existingReply: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(existingReply ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    startTransition(async () => {
      const res = await saveReplyAction(reviewId, text);
      if (!res.ok) setError(res.error);
      else setEditing(false);
    });
  }

  function remove() {
    if (!window.confirm("Delete your reply to this review?")) return;
    setError("");
    startTransition(async () => {
      const res = await deleteReplyAction(reviewId);
      if (!res.ok) setError(res.error);
      else { setText(""); setEditing(false); }
    });
  }

  if (!editing) {
    return (
      <div style={{ marginTop: "12px" }}>
        {existingReply && (
          <div style={{ padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--line)", marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Your reply
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {existingReply}
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} disabled={pending}>
            {existingReply ? "Edit reply" : "Reply"}
          </button>
          {existingReply && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#c0392b" }} onClick={remove} disabled={pending}>
              {pending ? "Working..." : "Delete reply"}
            </button>
          )}
        </div>
        {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="Write a public reply. Keep it professional. Buyers will see it under their review."
        style={{
          width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
          border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
          resize: "vertical", boxSizing: "border-box", marginBottom: "8px",
        }}
      />
      <div style={{ fontSize: "11px", color: "var(--ink-mute)", marginBottom: "10px" }}>
        {text.length}/1000 - replies are public
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Save reply"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { setEditing(false); setText(existingReply ?? ""); setError(""); }}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
    </div>
  );
}