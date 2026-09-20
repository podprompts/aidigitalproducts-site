# Renames the seller application flow from /sell/waitlist to /sell/apply,
# broadens the form (portfolio link, more product types, required
# 30-char-minimum message), and removes the old dead API route/component.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\api\seller-applications" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\sell\apply" | Out-Null
New-Item -ItemType Directory -Force -Path "src\components" | Out-Null

$content = @'
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SellerApplicationForm from "@/components/SellerApplicationForm";

export const metadata: Metadata = {
  title: "Seller Application — AI Digital Products",
  description:
    "Apply to sell your AI digital products. We review every application and follow up by email.",
};

export default function SellerApplicationPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="page-hero">
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
              }}
            >
              — Seller Application —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 7vw, 96px)",
                lineHeight: 0.94,
                color: "var(--ink)",
              }}
            >
              Become a seller.
            </h1>
            <p
              style={{
                marginTop: "28px",
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.6,
                maxWidth: "480px",
                margin: "28px auto 0",
              }}
            >
              Start selling your AI products to thousands of buyers. Tell us about
              yourself and what you want to sell.
            </p>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <SellerApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
'@
Set-Content -LiteralPath "src\app\sell\apply\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\sell\apply\page.tsx" -ForegroundColor Green

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

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  const messageValid = message.trim().length >= MIN_MESSAGE_LENGTH;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!messageValid) {
      setErrorMsg(`Please write at least ${MIN_MESSAGE_LENGTH} characters — this is what we use to review your application.`);
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

      {/* Error */}
      {status === "error" && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading" || !messageValid}
        className="btn btn-primary"
        style={{ alignSelf: "flex-start", opacity: status === "loading" || !messageValid ? 0.6 : 1 }}
      >
        {status === "loading" ? "Submitting…" : "Apply to Sell"}
      </button>
    </form>
  );
}
'@
Set-Content -LiteralPath "src\components\SellerApplicationForm.tsx" -Value $content -NoNewline
Write-Host "NEW: src\components\SellerApplicationForm.tsx" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const MIN_MESSAGE_LENGTH = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, business_name, portfolio_url, product_types, message } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Please write at least ${MIN_MESSAGE_LENGTH} characters describing yourself and what you plan to sell` },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("seller_waitlist").insert({
      email: email.trim().toLowerCase(),
      name: name?.trim() ?? null,
      business_name: business_name?.trim() ?? null,
      portfolio_url: portfolio_url?.trim() || null,
      product_types: product_types ?? [],
      message: message.trim(),
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
Write-Host "NEW: src\app\api\seller-applications\route.ts" -ForegroundColor Green

$content = @'
import { redirect } from "next/navigation";

export default function SellerWaitlistRedirect() {
  redirect("/sell/apply");
}
'@
Set-Content -LiteralPath "src\app\sell\waitlist\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\sell\waitlist\page.tsx" -ForegroundColor Green

$content = @'
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sell — AI Digital Products",
  description:
    "List your AI digital products on the fastest-growing AI marketplace. Free to list. 20% per sale. Payouts handled automatically by Stripe.",
};

const howItWorks = [
  {
    num: "01",
    heading: "Free to List",
    body: "No upfront fees. No monthly subscriptions. List as many products as you want.",
  },
  {
    num: "02",
    heading: "20% Per Sale",
    body: "We only earn when you earn. One flat rate on every transaction.",
  },
  {
    num: "03",
    heading: "Automatic Payouts",
    body: "Connect your Stripe account and get paid directly on your Stripe payout schedule — no manual invoicing.",
  },
];

export default function SellPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        {/* Hero */}
        <section className="page-hero">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
              }}
            >
              — For Sellers —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 8vw, 112px)",
                lineHeight: 0.94,
                color: "var(--ink)",
                maxWidth: "900px",
                margin: "0 auto",
              }}
            >
              List your AI.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Reach buyers.</span>
            </h1>
            <p
              style={{
                marginTop: "28px",
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                maxWidth: "480px",
                margin: "28px auto 0",
                lineHeight: 1.6,
              }}
            >
              A direct path from product to payout. No gatekeeping.
            </p>
          </div>
        </section>

        {/* How it works — 3-cell grid */}
        <section className="block">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              — How it works —
            </div>
            <div className="catalog-grid">
              {howItWorks.map((item) => (
                <div
                  key={item.num}
                  style={{
                    background: "var(--bg)",
                    padding: "56px 40px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--ink-mute)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {item.num}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      letterSpacing: "-0.025em",
                      color: "var(--ink)",
                    }}
                  >
                    {item.heading}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--ink-faded)",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mid-page statement */}
        <section className="block alt">
          <div
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <h2
              className="display"
              style={{
                fontSize: "clamp(36px, 5.5vw, 72px)",
                lineHeight: 0.96,
                color: "var(--ink)",
                marginBottom: "28px",
              }}
            >
              Built for the new way.
            </h2>
            <p
              style={{
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.65,
                maxWidth: "560px",
                margin: "0 auto",
              }}
            >
              The line between AI-generated and human-made has blurred in digital work. This
              marketplace does not draw that line. It makes room for both. What matters is whether
              the product delivers what it promises.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <h2
            className="display"
            style={{
              fontSize: "clamp(40px, 6vw, 88px)",
              lineHeight: 0.94,
              color: "var(--ink)",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            Your product.{" "}
            <span style={{ color: "var(--ink-mute)" }}>Your terms.</span>
          </h2>
          <p
            style={{
              marginTop: "28px",
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--ink-faded)",
            }}
          >
            List today. Earn from the first sale.
          </p>
          <Link
            href="/sell/apply"
            className="btn btn-primary"
            style={{ marginTop: "44px", display: "inline-block" }}
          >
            Become a Seller
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
'@
Set-Content -LiteralPath "src\app\sell\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\sell\page.tsx" -ForegroundColor Green

$content = @'
"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Application {
  id: string;
  email: string;
  name: string | null;
  business_name: string | null;
  portfolio_url: string | null;
  product_types: string[] | null;
  message: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

function SellerApplicationsContent() {
  const { token } = useAdmin();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/seller-applications", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setApplications(d.applications ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleApprove(app: Application) {
    const confirmed = window.confirm(
      `Approve ${app.name ?? app.email}? This creates a real vendor account and emails them a link to set their password.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/approve`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      }
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  function startReject(app: Application) {
    setRejectingId(app.id);
    setRejectReason("");
    setError("");
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectReason("");
  }

  async function submitReject(app: Application) {
    if (!rejectReason.trim()) {
      setError("A rejection reason is required — it's sent directly to the applicant.");
      return;
    }

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/reject`, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      if (data.warning) {
        setNotice(data.warning);
      } else {
        setNotice(`Rejection sent to ${app.email}.`);
      }
      setRejectingId(null);
      setRejectReason("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleResend(app: Application) {
    const confirmed = window.confirm(
      `Send a fresh set-password link to ${app.name ?? app.email}? This replaces any earlier link they may have.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/resend-welcome`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resend");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      } else {
        setNotice(`Sent a fresh link to ${app.email}.`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${applications.length} application${applications.length !== 1 ? "s" : ""}`}
      </div>

      {notice && (
        <p style={{ fontSize: "13px", color: "#166534", marginBottom: "16px", wordBreak: "break-all" }}>{notice}</p>
      )}
      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!loading && applications.length === 0 && (
          <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No applications yet.</p>
        )}
        {applications.map((app) => (
          <div key={app.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>
                  {app.name ?? "(no name given)"} {app.business_name && <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>· {app.business_name}</span>}
                </div>
                <div style={{ fontSize: "13px", color: "var(--ink-faded)" }}>{app.email}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginTop: "4px" }}>
                  Applied {new Date(app.created_at).toLocaleString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px",
                  color: app.status === "approved" ? "#166534" : app.status === "rejected" ? "#c0392b" : "#8a6d1a",
                  background: app.status === "approved" ? "#eaf6ec" : app.status === "rejected" ? "#fdecea" : "#fff8e1",
                }}
              >
                {app.status}
              </span>
            </div>

            {app.product_types && app.product_types.length > 0 && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "8px" }}>
                <strong style={{ color: "var(--ink)" }}>Sells:</strong> {app.product_types.join(", ")}
              </div>
            )}
            {app.portfolio_url && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "8px" }}>
                <strong style={{ color: "var(--ink)" }}>Portfolio:</strong>{" "}
                <a href={app.portfolio_url} target="_blank" rel="noreferrer" style={{ color: "var(--ink)" }}>
                  {app.portfolio_url}
                </a>
              </div>
            )}
            {app.message && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "12px" }}>
                <strong style={{ color: "var(--ink)" }}>Message:</strong> {app.message}
              </div>
            )}
            {app.status === "rejected" && app.rejection_reason && (
              <div style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px", background: "#fdecea", padding: "10px 14px" }}>
                <strong>Rejection reason sent:</strong> {app.rejection_reason}
              </div>
            )}

            {app.status === "pending" && rejectingId !== app.id && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleApprove(app)}
                  disabled={actingId === app.id}
                  className="btn btn-primary btn-sm"
                >
                  {actingId === app.id ? "Working…" : "Approve"}
                </button>
                <button
                  onClick={() => startReject(app)}
                  disabled={actingId === app.id}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#c0392b" }}
                >
                  Reject
                </button>
              </div>
            )}

            {app.status === "pending" && rejectingId === app.id && (
              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Rejection reason — this is emailed directly to the applicant
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. We're not currently accepting products in this category, or your samples didn't meet our quality guidelines. Be specific about what they'd need to change to reapply successfully."
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
                    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
                    resize: "vertical", boxSizing: "border-box", marginBottom: "10px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => submitReject(app)}
                    disabled={actingId === app.id}
                    className="btn btn-primary btn-sm"
                    style={{ background: "#c0392b", borderColor: "#c0392b" }}
                  >
                    {actingId === app.id ? "Sending…" : "Send Rejection"}
                  </button>
                  <button onClick={cancelReject} disabled={actingId === app.id} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {app.status === "approved" && (
              <button
                onClick={() => handleResend(app)}
                disabled={actingId === app.id}
                className="btn btn-ghost btn-sm"
              >
                {actingId === app.id ? "Sending…" : "Resend Welcome Email"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellerApplicationsPage() {
  return (
    <AdminShell title="Seller Applications">
      <SellerApplicationsContent />
    </AdminShell>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\seller-applications\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\seller-applications\page.tsx" -ForegroundColor Green

# Remove the old, now-unused component and API route
if (Test-Path "src\components\SellerWaitlistForm.tsx") {
  Remove-Item -LiteralPath "src\components\SellerWaitlistForm.tsx" -Force
  Write-Host "REMOVED: src\components\SellerWaitlistForm.tsx" -ForegroundColor Yellow
}
if (Test-Path "src\app\api\waitlist") {
  Remove-Item -LiteralPath "src\app\api\waitlist" -Recurse -Force
  Write-Host "REMOVED: src\app\api\waitlist" -ForegroundColor Yellow
}

Write-Host "`nAll files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan