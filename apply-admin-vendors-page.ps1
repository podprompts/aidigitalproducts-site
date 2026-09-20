# Adds a Vendors page to the admin panel showing every vendor's live
# Stripe Connect status, with a direct link into their Stripe dashboard.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\admin\vendors" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\vendors-connect-status" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\vendors-connect-status\[id]\login-link" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: vendors, error } = await supabaseAdmin
    .from("vendor_profiles")
    .select("id, display_name, business_name, email, is_active, stripe_account_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (vendors ?? []).map(async (v) => {
      if (!v.stripe_account_id) {
        return { ...v, connected: false, chargesEnabled: false, payoutsEnabled: false };
      }
      try {
        const account = await stripe.accounts.retrieve(v.stripe_account_id);
        return {
          ...v,
          connected: true,
          chargesEnabled: !!account.charges_enabled,
          payoutsEnabled: !!account.payouts_enabled,
        };
      } catch (err) {
        console.error(`[admin/vendors-connect-status] Failed to retrieve ${v.stripe_account_id}`, err);
        return { ...v, connected: true, chargesEnabled: false, payoutsEnabled: false, retrieveFailed: true };
      }
    })
  );

  return NextResponse.json({ vendors: enriched });
}
'@
Set-Content -LiteralPath "src\app\api\admin\vendors-connect-status\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\vendors-connect-status\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const { data: vendor } = await supabaseAdmin
    .from("vendor_profiles")
    .select("stripe_account_id")
    .eq("id", id)
    .single();

  if (!vendor?.stripe_account_id) {
    return NextResponse.json({ error: "This vendor hasn't connected a Stripe account" }, { status: 400 });
  }

  try {
    // Single-use, short-lived — generated fresh on every click, never cached.
    const loginLink = await stripe.accounts.createLoginLink(vendor.stripe_account_id);
    return NextResponse.json({ url: loginLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create login link" },
      { status: 502 }
    );
  }
}
'@
Set-Content -LiteralPath "src\app\api\admin\vendors-connect-status\[id]\login-link\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\vendors-connect-status\[id]\login-link\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Vendor {
  id: string;
  display_name: string | null;
  business_name: string | null;
  email: string | null;
  is_active: boolean;
  stripe_account_id: string | null;
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  retrieveFailed?: boolean;
}

function VendorsContent() {
  const { token } = useAdmin();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/vendors-connect-status", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function handleOpenStripe(vendor: Vendor) {
    setOpeningId(vendor.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/vendors-connect-status/${vendor.id}/login-link`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open Stripe");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOpeningId(null);
    }
  }

  function statusBadge(v: Vendor) {
    if (!v.connected) {
      return <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase" }}>Not connected</span>;
    }
    if (v.retrieveFailed) {
      return <span style={{ fontSize: "11px", fontWeight: 700, color: "#c0392b", textTransform: "uppercase" }}>Error checking status</span>;
    }
    if (v.chargesEnabled && v.payoutsEnabled) {
      return <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Fully connected</span>;
    }
    return <span style={{ fontSize: "11px", fontWeight: 700, color: "#8a6d1a", textTransform: "uppercase" }}>Onboarding incomplete</span>;
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
      </div>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ border: "1px solid var(--line)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
              {["Vendor", "Email", "Stripe Connect Status", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>Loading…</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>No vendors yet.</td></tr>
            ) : vendors.map((v, i) => (
              <tr key={v.id} style={{ borderBottom: "1px solid var(--line-soft)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)" }}>
                <td style={{ padding: "10px 14px", color: "var(--ink)", fontWeight: 600 }}>
                  {v.business_name || v.display_name || "—"}
                  {!v.is_active && <span style={{ marginLeft: "6px", fontSize: "10px", color: "var(--ink-mute)" }}>(inactive)</span>}
                </td>
                <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>{v.email ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>{statusBadge(v)}</td>
                <td style={{ padding: "10px 14px" }}>
                  {v.connected && (
                    <button
                      onClick={() => handleOpenStripe(v)}
                      disabled={openingId === v.id}
                      className="btn btn-ghost btn-sm"
                    >
                      {openingId === v.id ? "Opening…" : "View in Stripe →"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <AdminShell title="Vendors">
      <VendorsContent />
    </AdminShell>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\vendors\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\admin\vendors\page.tsx" -ForegroundColor Green

$content = @'
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminContext } from "./AdminContext";
import PasswordInput from "@/components/PasswordInput";

const NAV = [
  { label: "Dashboard",           href: "/admin" },
  { label: "Products",            href: "/admin/products" },
  { label: "Pending Reviews",     href: "/admin/pending-reviews" },
  { label: "Orders",              href: "/admin/orders" },
  { label: "Vendors",             href: "/admin/vendors" },
  { label: "Subscribers",         href: "/admin/subscribers" },
  { label: "Contacts",            href: "/admin/contacts" },
  { label: "Seller Applications", href: "/admin/seller-applications" },
];

interface Props { title: string; children: React.ReactNode }

export default function AdminShell({ title, children }: Props) {
  const [token,       setToken]       = useState<string | null>(null);
  const [checked,     setChecked]     = useState(false);
  const [email,       setEmail]       = useState("");
  const [pw,          setPw]          = useState("");
  const [error,       setError]       = useState("");
  const [loggingIn,   setLoggingIn]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("admin_auth");
    setToken(stored);
    setChecked(true);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Invalid email or password."); return; }
      localStorage.setItem("admin_auth", data.token);
      setToken(data.token);
    } catch {
      setError("Network error.");
    } finally {
      setLoggingIn(false);
    }
  }

  function logout() {
    // Clears the httpOnly admin_session cookie server-side (can't be
    // cleared from client JS directly) so maintenance mode kicks back
    // in for you on every route, not just /admin.
    fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("admin_auth");
    setToken(null);
  }

  if (!checked) return null;

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: "100%", maxWidth: "360px", padding: "0 24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "24px", textAlign: "center" }}>
            — Admin —
          </div>
          <h1 className="display" style={{ fontSize: "36px", lineHeight: 1, color: "var(--ink)", textAlign: "center", marginBottom: "40px" }}>
            Sign in.
          </h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="admin-pw">Password</label>
              <PasswordInput
                id="admin-pw"
                value={pw}
                onChange={setPw}
                placeholder="Admin password"
                required
              />
            </div>
            {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e", marginTop: "-8px" }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loggingIn} style={{ opacity: loggingIn ? 0.6 : 1 }}>
              {loggingIn ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const showSidebar = !isMobile || sidebarOpen;

  return (
    <AdminContext.Provider value={{ token, logout }}>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", position: "relative" }}>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(20,20,20,0.45)",
              zIndex: 40,
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            background: "var(--bg-alt)",
            borderRight: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            position: isMobile ? "fixed" : "sticky",
            top: 0,
            left: 0,
            height: "100vh",
            overflowY: "auto",
            zIndex: 50,
            transform: showSidebar ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Brand */}
          <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--line)" }}>
            <Link
              href="/"
              style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", display: "block", marginBottom: "4px" }}
            >
              ← Store
            </Link>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              Admin Panel
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "16px 0", flex: 1 }}>
            {NAV.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--ink)" : "var(--ink-faded)",
                    textDecoration: "none",
                    background: active ? "var(--bg-soft)" : "transparent",
                    borderLeft: active ? "2px solid var(--ink)" : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)" }}>
            <button
              onClick={logout}
              style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: "var(--ink-faded)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ink)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-faded)"; }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: isMobile ? 0 : undefined }}>

          {/* Top bar */}
          <div
            style={{
              padding: isMobile ? "14px 16px" : "16px 32px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg)",
              position: isMobile ? "sticky" : undefined,
              top: isMobile ? 0 : undefined,
              zIndex: 30,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Hamburger — mobile only */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen((o) => !o)}
                  aria-label="Toggle menu"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", gap: "5px" }}
                >
                  {[0,1,2].map((i) => (
                    <span key={i} style={{ display: "block", width: "20px", height: "2px", background: "var(--ink)", borderRadius: "2px" }} />
                  ))}
                </button>
              )}
              <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                {title}
              </h1>
            </div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-mute)", letterSpacing: "0.06em" }}>
              AI Digital Products
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, padding: isMobile ? "20px 16px" : "32px", overflowY: "auto" }}>
            {children}
          </div>

        </div>
      </div>
    </AdminContext.Provider>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\AdminShell.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\AdminShell.tsx" -ForegroundColor Green

Write-Host "`nAll 4 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan