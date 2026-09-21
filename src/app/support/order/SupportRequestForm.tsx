"use client";

import { useState } from "react";
import { ESCALATION_REASONS, GENERAL_REASONS } from "@/lib/support-constants";

export default function SupportRequestForm({ defaultOrder }: { defaultOrder: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState(defaultOrder);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/support/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, orderNumber, reason, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div style={{ border: "1px solid var(--line)", background: "var(--bg-alt)", padding: "28px" }}>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)", marginBottom: "10px" }}>Check your email.</div>
        <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.65 }}>
          If those details match an order, we have sent a link to your request to that email address.
          Nothing arrived after a few minutes? Check your spam folder, and make sure you used the email you
          bought with and the order number from your confirmation email.
        </p>
      </div>
    );
  }

  const selectStyle: React.CSSProperties = {
    background: "transparent", border: "1px solid var(--ink-soft)", borderRadius: 0, padding: "14px 16px",
    fontFamily: "inherit", fontSize: "14px", fontWeight: 500, color: "var(--ink)", width: "100%",
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="field">
        <label htmlFor="sup-name">Your name</label>
        <input id="sup-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="sup-email">Email used for the purchase</label>
        <input id="sup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="sup-order">Order number</label>
        <input id="sup-order" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ADP-00019" required />
      </div>
      <div className="field">
        <label htmlFor="sup-reason">What is the problem?</label>
        <select id="sup-reason" value={reason} onChange={(e) => setReason(e.target.value)} required style={selectStyle}>
          <option value="">Choose a reason</option>
          <optgroup label="Contact the creator">
            {Object.entries(GENERAL_REASONS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </optgroup>
          <optgroup label="Ask our team to review right away">
            {Object.entries(ESCALATION_REASONS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="field">
        <label htmlFor="sup-message">Tell us what happened</label>
        <textarea id="sup-message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} />
      </div>
      {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={sending} style={{ opacity: sending ? 0.6 : 1 }}>
        {sending ? "Sending..." : "Send request"}
      </button>
      <p style={{ fontSize: "12px", color: "var(--ink-mute)", lineHeight: 1.6 }}>
        The creator will see your first name, the order number and your message. They will not see your email address.
      </p>
    </form>
  );
}