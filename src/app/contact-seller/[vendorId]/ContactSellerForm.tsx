"use client";

import { useState } from "react";

export default function ContactSellerForm({ vendorId }: { vendorId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/contact-seller/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, name, email, message }),
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
        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)", marginBottom: "10px" }}>Message sent.</div>
        <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.65 }}>
          We emailed you a link to this conversation. The seller will reply through the platform, and you will get an
          email when they do.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="field">
        <label htmlFor="cs-name">Your name</label>
        <input id="cs-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="cs-email">Your email</label>
        <input id="cs-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="cs-message">Your message</label>
        <textarea id="cs-message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} />
      </div>
      {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={sending} style={{ opacity: sending ? 0.6 : 1 }}>
        {sending ? "Sending..." : "Send message"}
      </button>
      <p style={{ fontSize: "12px", color: "var(--ink-mute)", lineHeight: 1.6 }}>
        The seller will see your name and message. They will not see your email address.
      </p>
    </form>
  );
}