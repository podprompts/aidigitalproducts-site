"use client";

import { useState, FormEvent } from "react";

const PRODUCT_TYPES = [
  "Prompt Packs",
  "AI Templates",
  "Notion / Docs",
  "Image / Art Packs",
  "Audio / Music",
  "Video / Motion",
  "Courses / Guides",
  "Other",
];

type Status = "idle" | "loading" | "success" | "error";

export default function SellerWaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      email: data.get("email"),
      name: data.get("name"),
      business_name: data.get("business_name"),
      product_types: selectedTypes,
      message: data.get("message"),
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          padding: "56px 40px",
          background: "var(--bg)",
          textAlign: "center",
        }}
      >
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
          — You&apos;re in —
        </div>
        <h2
          className="display"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", color: "var(--ink)", marginBottom: "16px" }}
        >
          Thanks for applying.
        </h2>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.6 }}>
          We&apos;re onboarding sellers in waves and will reach out when your spot opens.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "var(--bg)",
    border: "1px solid var(--ink-mute)",
    color: "var(--ink)",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--ink-faded)",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    marginBottom: "8px",
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Name */}
      <div>
        <label htmlFor="wl-name" style={labelStyle}>Name</label>
        <input
          id="wl-name"
          name="name"
          type="text"
          placeholder="Your name"
          style={inputStyle}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="wl-email" style={labelStyle}>
          Email <span style={{ color: "var(--ink)" }}>*</span>
        </label>
        <input
          id="wl-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      {/* Business / Brand */}
      <div>
        <label htmlFor="wl-business" style={labelStyle}>Business / Brand name</label>
        <input
          id="wl-business"
          name="business_name"
          type="text"
          placeholder="Optional"
          style={inputStyle}
        />
      </div>

      {/* Product types */}
      <div>
        <span style={labelStyle}>What will you sell?</span>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          {PRODUCT_TYPES.map((type) => {
            const active = selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                style={{
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  letterSpacing: "0.05em",
                  border: "1px solid var(--ink-mute)",
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink-faded)",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="wl-message" style={labelStyle}>Anything else?</label>
        <textarea
          id="wl-message"
          name="message"
          rows={4}
          placeholder="Tell us about your products, audience, or anything relevant."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-primary"
        style={{ alignSelf: "flex-start", opacity: status === "loading" ? 0.6 : 1 }}
      >
        {status === "loading" ? "Submitting…" : "Apply to Sell"}
      </button>
    </form>
  );
}
