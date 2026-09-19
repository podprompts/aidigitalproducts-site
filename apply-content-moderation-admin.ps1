# Content moderation, part 2: admin approval queue.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\admin\pending-reviews" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\products\[id]\approve" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\products\[id]\reject" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\products\pending" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, vendor_id, pending_changes, review_status, review_submitted_at")
    .eq("review_status", "pending")
    .order("review_submitted_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vendorIds = [...new Set((products ?? []).map((p) => p.vendor_id).filter(Boolean))];
  let vendorMap: Record<string, string> = {};
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabaseAdmin
      .from("vendor_profiles")
      .select("id, display_name")
      .in("id", vendorIds);
    vendorMap = Object.fromEntries((vendors ?? []).map((v) => [v.id, v.display_name]));
  }

  const enriched = (products ?? []).map((p) => ({
    ...p,
    vendor_name: p.vendor_id ? vendorMap[p.vendor_id] ?? "Unknown vendor" : "—",
  }));

  return NextResponse.json({ products: enriched });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\pending\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\products\pending\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { syncStripePrice } from "@/lib/stripe-price-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const { data: product, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.review_status !== "pending" || !product.pending_changes) {
    return NextResponse.json(
      { error: "This product has no pending submission to approve" },
      { status: 400 }
    );
  }

  const pending = product.pending_changes as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  // Plain fields — copy straight across if the vendor's submission touched them
  const plainFields = [
    "name", "slug", "category", "description", "features",
    "is_active", "is_plr_available", "attributes", "video_url", "download_url",
  ];
  for (const field of plainFields) {
    if (field in pending) updates[field] = pending[field];
  }

  // Price fields — this is the moment a price change actually syncs with
  // Stripe, not when the vendor originally submitted it. Diffed against
  // the CURRENT live price, since that's still what's active until now.
  try {
    if ("sale_price_cents" in pending) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.sale_price_cents as number | null,
        currentPriceCents: product.sale_price_cents,
        currentStripePriceId: product.sale_stripe_price_id,
      });
      updates.sale_price_cents = synced.priceCents;
      updates.sale_stripe_price_id = synced.stripePriceId;
    }
    if ("regular_price_cents" in pending) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.regular_price_cents as number | null,
        currentPriceCents: product.regular_price_cents,
        currentStripePriceId: product.regular_stripe_price_id,
      });
      updates.regular_price_cents = synced.priceCents;
      updates.regular_stripe_price_id = synced.stripePriceId;
    }
    if ("plr_price_cents" in pending) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.plr_price_cents as number | null,
        currentPriceCents: product.plr_price_cents,
        currentStripePriceId: product.plr_stripe_price_id,
      });
      updates.plr_price_cents = synced.priceCents;
      updates.plr_stripe_price_id = synced.stripePriceId;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to sync price with Stripe: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 502 }
    );
  }

  // Images — replace the live set wholesale with the vendor's approved snapshot
  if (Array.isArray(pending.images)) {
    const images = pending.images as { url: string; is_primary?: boolean; display_order?: number }[];

    await supabaseAdmin.from("product_images").delete().eq("product_id", id);

    if (images.length > 0) {
      await supabaseAdmin.from("product_images").insert(
        images.map((img, i) => ({
          product_id: id,
          url: img.url,
          is_primary: !!img.is_primary,
          display_order: img.display_order ?? i,
        }))
      );
      const primary = images.find((img) => img.is_primary) ?? images[0];
      updates.thumbnail_url = primary.url;
    } else {
      updates.thumbnail_url = null;
    }
  }

  const admin = await getAdminUser(req);

  updates.pending_changes = null;
  updates.review_status = "none";
  updates.review_rejected_reason = null;
  updates.reviewed_by = admin?.sub ?? null;
  updates.reviewed_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ product: updated });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\[id]\approve\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\products\[id]\approve\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("review_status")
    .eq("id", id)
    .single();

  if (!product || product.review_status !== "pending") {
    return NextResponse.json(
      { error: "This product has no pending submission to reject" },
      { status: 400 }
    );
  }

  // Deliberately leaves pending_changes and the live listing untouched —
  // rejecting never changes what's actually shown on the site.
  const { data: updated, error } = await supabaseAdmin
    .from("products")
    .update({
      review_status: "rejected",
      review_rejected_reason: body.reason || "No reason given",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: updated });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\[id]\reject\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\products\[id]\reject\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useState, useEffect, useContext } from "react";
import AdminShell from "../AdminShell";
import { AdminContext } from "../AdminContext";

interface PendingProduct {
  id: string;
  name: string;
  slug: string;
  vendor_name: string;
  pending_changes: Record<string, unknown>;
  review_submitted_at: string;
}

export default function PendingReviewsPage() {
  const { token } = useContext(AdminContext);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/pending", {
        headers: { "x-admin-key": token ?? "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setProducts(data.products ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(id: string) {
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}/approve`, {
        method: "POST",
        headers: { "x-admin-key": token ?? "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}/reject`, {
        method: "POST",
        headers: { "x-admin-key": token ?? "", "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      setRejectingId(null);
      setRejectReason("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <AdminShell title="Pending Reviews">
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", maxWidth: "640px" }}>
        Vendor edits wait here until approved. The live site keeps showing each product&apos;s
        previously approved version until you act on its submission — approving or rejecting
        never causes a listing to disappear.
      </p>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      {loading && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Loading…</p>}

      {!loading && products.length === 0 && (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Nothing pending review right now.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
                  Vendor: {p.vendor_name} · Submitted {new Date(p.review_submitted_at).toLocaleString()}
                </div>
              </div>
              <a
                href={`/products/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "12px", color: "var(--ink-faded)" }}
              >
                View live listing ↗
              </a>
            </div>

            <div
              style={{
                background: "var(--bg-alt)",
                border: "1px solid var(--line)",
                padding: "12px 16px",
                fontSize: "13px",
                marginBottom: "16px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace", fontSize: "12px" }}>
                {JSON.stringify(p.pending_changes, null, 2)}
              </pre>
            </div>

            {rejectingId === p.id ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--ink-soft)", fontSize: "13px" }}
                />
                <button
                  onClick={() => handleReject(p.id)}
                  disabled={actingId === p.id}
                  className="btn btn-primary btn-sm"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => { setRejectingId(null); setRejectReason(""); }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleApprove(p.id)}
                  disabled={actingId === p.id}
                  className="btn btn-primary btn-sm"
                >
                  {actingId === p.id ? "Working…" : "Approve"}
                </button>
                <button onClick={() => setRejectingId(p.id)} className="btn btn-ghost btn-sm">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\pending-reviews\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\admin\pending-reviews\page.tsx" -ForegroundColor Green

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

Write-Host "`nAll 5 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan