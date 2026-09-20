# Adds a required 'I agree to Terms of Service' checkbox to the seller
# application form, enforced client- and server-side, with the agreement
# timestamp recorded for your records.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
"use client";

import { useState, FormEvent } from "react";

const PRODUCT_TYPES = [
  "Prompt Packs",
  "AI Templates",
  "Chatbots / AI Agents",
  "Automation / Workflows",
  "Notion / Docs",
  "Image / Art Packs",
  "Audio / Music",
  "Video / Motion",
  "Courses / Guides",
  "Code / Scripts",
  "Datasets",
  "Other",
];

const MIN_MESSAGE_LENGTH = 30;

type Status = "idle" | "loading" | "success" | "error";

export default function SellerApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  const messageValid = message.trim().length >= MIN_MESSAGE_LENGTH;
  const canSubmit = messageValid && agreedToTerms;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!messageValid) {
      setErrorMsg(`Please write at least ${MIN_MESSAGE_LENGTH} characters — this is what we use to review your application.`);
      setStatus("error");
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg("You must agree to the Terms of Service to apply.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      email: data.get("email"),
      name: data.get("name"),
      business_name: data.get("business_name"),
      portfolio_url: data.get("portfolio_url"),
      product_types: selectedTypes,
      message: message.trim(),
      agreed_to_terms: true,
    };

    try {
      const res = await fetch("/api/seller-applications", {
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
          — Application received —
        </div>
        <h2
          className="display"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", color: "var(--ink)", marginBottom: "16px" }}
        >
          Thanks for applying.
        </h2>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.6 }}>
          We review every application personally and will email you either way — approved or not
          — usually within a few days.
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
        <label htmlFor="app-name" style={labelStyle}>Name</label>
        <input
          id="app-name"
          name="name"
          type="text"
          placeholder="Your name"
          style={inputStyle}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="app-email" style={labelStyle}>
          Email <span style={{ color: "var(--ink)" }}>*</span>
        </label>
        <input
          id="app-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      {/* Business / Brand */}
      <div>
        <label htmlFor="app-business" style={labelStyle}>Business / Brand name</label>
        <input
          id="app-business"
          name="business_name"
          type="text"
          placeholder="Optional"
          style={inputStyle}
        />
      </div>

      {/* Portfolio / sample link */}
      <div>
        <label htmlFor="app-portfolio" style={labelStyle}>Portfolio or sample link</label>
        <input
          id="app-portfolio"
          name="portfolio_url"
          type="url"
          placeholder="A link to your existing work, shop, or samples (optional, but it helps)"
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

      {/* Message - now required, min length enforced */}
      <div>
        <label htmlFor="app-message" style={labelStyle}>
          Tell us about yourself and what you plan to sell <span style={{ color: "var(--ink)" }}>*</span>
        </label>
        <textarea
          id="app-message"
          name="message"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your background, what you're planning to list, your audience — anything that helps us review your application."
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <p style={{ fontSize: "11px", color: messageValid ? "var(--ink-mute)" : "#e53e3e", marginTop: "6px" }}>
          {message.trim().length}/{MIN_MESSAGE_LENGTH} characters minimum
        </p>
      </div>

      {/* Terms agreement */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <input
          id="app-agree"
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          style={{ marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, cursor: "pointer" }}
        />
        <label htmlFor="app-agree" style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.5, cursor: "pointer" }}>
          I agree to the{" "}
          <a href="/terms" target="_blank" rel="noreferrer" style={{ color: "var(--ink)", fontWeight: 600 }}>
            Terms of Service
          </a>
          , including the Seller Terms and commission structure. <span style={{ color: "var(--ink)" }}>*</span>
        </label>
      </div>

      {/* Error */}
      {status === "error" && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading" || !canSubmit}
        className="btn btn-primary"
        style={{ alignSelf: "flex-start", opacity: status === "loading" || !canSubmit ? 0.6 : 1 }}
      >
        {status === "loading" ? "Submitting…" : "Apply to Sell"}
      </button>
    </form>
  );
}
'@
Set-Content -LiteralPath "src\components\SellerApplicationForm.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\components\SellerApplicationForm.tsx" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const MIN_MESSAGE_LENGTH = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, business_name, portfolio_url, product_types, message, agreed_to_terms } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Please write at least ${MIN_MESSAGE_LENGTH} characters describing yourself and what you plan to sell` },
        { status: 400 }
      );
    }

    if (agreed_to_terms !== true) {
      return NextResponse.json({ error: "You must agree to the Terms of Service to apply" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("seller_waitlist").insert({
      email: email.trim().toLowerCase(),
      name: name?.trim() ?? null,
      business_name: business_name?.trim() ?? null,
      portfolio_url: portfolio_url?.trim() || null,
      product_types: product_types ?? [],
      message: message.trim(),
      agreed_to_terms_at: new Date().toISOString(),
    });

    if (error) {
      // Unique constraint means they're already on the list
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You've already applied with this email." },
          { status: 409 }
        );
      }
      console.error("[seller-applications] insert error", error);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[seller-applications] unexpected error", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
'@
Set-Content -LiteralPath "src\app\api\seller-applications\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\seller-applications\route.ts" -ForegroundColor Green

Write-Host "`nAll 2 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan