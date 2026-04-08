"use client";

import { useState } from "react";

const EMPTY = { name: "", email: "", subject: "", message: "" };
type Status = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [form, setForm]     = useState(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");

    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setForm(EMPTY);
      setStatus("success");
    } catch {
      setErrMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "56px 0" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--ink-faded)",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            marginBottom: "20px",
          }}
        >
          — Message Sent —
        </div>
        <h2
          className="display"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", color: "var(--ink)", marginBottom: "16px" }}
        >
          Thank you.
        </h2>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.6 }}>
          We&apos;ll respond to you shortly.
        </p>
      </div>
    );
  }

  const disabled = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "28px" }}
    >
      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          disabled={disabled}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          disabled={disabled}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="What's this about?"
          value={form.subject}
          onChange={handleChange}
          disabled={disabled}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="How can we help?"
          value={form.message}
          onChange={handleChange}
          disabled={disabled}
          required
        />
      </div>

      {status === "error" && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e", marginTop: "-8px" }}>
          {errMsg}
        </p>
      )}

      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={disabled}
          style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
        >
          {disabled ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}
