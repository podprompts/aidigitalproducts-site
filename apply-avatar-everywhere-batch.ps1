# Avatar-everywhere batch: admin avatar upload + new Settings page,
# onboarding modal now requires both Stripe Connect AND an avatar,
# avatars now display on the product page (Sold by + Seller section)
# and the admin Vendors table.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\admin\settings" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\avatar\confirm" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\avatar\presign" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\me" | Out-Null
New-Item -ItemType Directory -Force -Path "src\components" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;
const CDN = process.env.R2_CDN_URL!;
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  let body: { fileName?: string; contentType?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fileName, contentType, fileSize } = body;
  if (typeof fileSize === "number" && fileSize > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 3MB" }, { status: 400 });
  }

  const ext = (fileName?.split(".").pop() || "jpg").toLowerCase();
  const path = `avatars/admin-${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    ContentType: contentType || "image/jpeg",
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${CDN}/${path}`;

  return NextResponse.json({ uploadUrl, path, publicUrl });
}
'@
Set-Content -LiteralPath "src\app\api\admin\avatar\presign\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\avatar\presign\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const adminUser = await getAdminUser(req);
  if (!adminUser?.sub) {
    return NextResponse.json({ error: "Could not identify admin user" }, { status: 401 });
  }

  let body: { publicUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.publicUrl) {
    return NextResponse.json({ error: "Missing publicUrl" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("admin_profiles")
    .update({ avatar_url: body.publicUrl })
    .eq("id", adminUser.sub);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, avatar_url: body.publicUrl });
}
'@
Set-Content -LiteralPath "src\app\api\admin\avatar\confirm\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\avatar\confirm\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const adminUser = await getAdminUser(req);
  if (!adminUser?.sub) {
    return NextResponse.json({ error: "Could not identify admin user" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("admin_profiles")
    .select("display_name, email, avatar_url")
    .eq("id", adminUser.sub)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
'@
Set-Content -LiteralPath "src\app\api\admin\me\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\me\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";
import AvatarUploader from "@/components/AvatarUploader";

function SettingsContent() {
  const { token } = useAdmin();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/me", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setAvatarUrl(d.avatar_url ?? null))
      .catch(() => setAvatarUrl(null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p style={{ color: "var(--ink-faded)", fontSize: "14px" }}>Loading…</p>;

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>
        Profile Picture
      </div>
      <AvatarUploader currentAvatarUrl={avatarUrl} role="admin" onUploaded={setAvatarUrl} />
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Settings">
      <SettingsContent />
    </AdminShell>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\settings\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\admin\settings\page.tsx" -ForegroundColor Green

$content = @'
import Image from "next/image";

interface Props {
  url: string | null;
  size?: number;
  alt?: string;
}

export default function VendorAvatarBadge({ url, size = 32, alt = "Seller" }: Props) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        background: "var(--bg-alt)",
        border: "1px solid var(--line)",
        flexShrink: 0,
      }}
    >
      {url ? (
        <Image src={url} alt={alt} fill style={{ objectFit: "cover" }} sizes={`${size}px`} />
      ) : (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: `${Math.max(9, size * 0.3)}px`, fontWeight: 700, color: "var(--ink-mute)",
          }}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
'@
Set-Content -LiteralPath "src\components\VendorAvatarBadge.tsx" -Value $content -NoNewline
Write-Host "NEW: src\components\VendorAvatarBadge.tsx" -ForegroundColor Green

$content = @'
"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const MIN_DIMENSION = 400; // px — rejects small/low-quality images
const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const DISPLAY_SIZE = 96; // px — fixed modern avatar size regardless of source dimensions

interface Props {
  currentAvatarUrl: string | null;
  /** "vendor" (default) or "admin" — determines which presign/confirm routes to call */
  role?: "vendor" | "admin";
  /** Called with the new URL right after a successful upload */
  onUploaded?: (url: string) => void;
}

export default function AvatarUploader({ currentAvatarUrl, role = "vendor", onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const presignUrl = role === "admin" ? "/api/admin/avatar/presign" : "/api/vendor/avatar/presign";
  const confirmUrl = role === "admin" ? "/api/admin/avatar/confirm" : "/api/vendor/avatar/confirm";

  function checkImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read image dimensions"));
      };
      img.src = objectUrl;
    });
  }

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setError("");

    if (file.size > MAX_BYTES) {
      setError("Image must be under 3MB.");
      return;
    }

    try {
      const { width, height } = await checkImageDimensions(file);
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        setError(`Image is too small (${width}×${height}px). Please use at least ${MIN_DIMENSION}×${MIN_DIMENSION}px for a clear, high-quality picture.`);
        return;
      }
    } catch {
      setError("Couldn't read that image — please try a different file.");
      return;
    }

    setUploading(true);
    try {
      const presignRes = await fetch(presignUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error ?? "Failed to prepare upload");

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      const confirmRes = await fetch(confirmUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicUrl: presignData.publicUrl }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error ?? "Failed to save picture");

      setAvatarUrl(confirmData.avatar_url);
      onUploaded?.(confirmData.avatar_url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: `${DISPLAY_SIZE}px`,
          height: `${DISPLAY_SIZE}px`,
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
          background: "var(--bg-alt)",
          border: "1px solid var(--line)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Profile picture" fill style={{ objectFit: "cover" }} sizes={`${DISPLAY_SIZE}px`} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--ink-mute)", textAlign: "center", padding: "8px" }}>
            No photo
          </div>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff" }}>
            Uploading…
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-ghost btn-sm"
        >
          {avatarUrl ? "Change photo" : "Upload photo"}
        </button>
        <p style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "6px", maxWidth: "260px" }}>
          At least {MIN_DIMENSION}×{MIN_DIMENSION}px, under 3MB.
        </p>
        {error && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "6px" }}>{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\components\AvatarUploader.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\components\AvatarUploader.tsx" -ForegroundColor Green

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
  { label: "Settings",            href: "/admin/settings" },
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

$content = @'
"use client";

import { useState } from "react";
import AvatarUploader from "./AvatarUploader";

interface Props {
  stripeConnected: boolean;
  vendorName: string;
  avatarUrl: string | null;
}

export default function OnboardingWelcomeModal({ stripeConnected, vendorName, avatarUrl: initialAvatarUrl }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const needsStripe = !stripeConnected;
  const needsAvatar = !avatarUrl;
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!needsStripe && !needsAvatar)) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 20, 20, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--line)",
          maxWidth: "480px",
          width: "100%",
          padding: "36px",
          position: "relative",
        }}
      >
        <button
          onClick={() => setDismissed(true)}
          aria-label="Remind me later"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: "var(--ink-faded)",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ×
        </button>

        <div
          style={{
            fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)",
            textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: "16px",
          }}
        >
          Welcome, {vendorName}
        </div>

        <h2 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px", lineHeight: 1.2 }}>
          {needsStripe && needsAvatar
            ? "Two steps left to finish setting up."
            : needsStripe
            ? "One step left before you can get paid."
            : "One step left — add your photo."}
        </h2>

        {needsAvatar && (
          <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: needsStripe ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "12px" }}>
              1. Add a profile picture
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, marginBottom: "16px" }}>
              Buyers see this next to your products — every seller needs one.
            </p>
            <AvatarUploader currentAvatarUrl={avatarUrl} role="vendor" onUploaded={setAvatarUrl} />
          </div>
        )}

        {needsStripe && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "12px" }}>
              {needsAvatar ? "2. " : ""}Connect Stripe to get paid
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.65, marginBottom: "20px" }}>
              You&apos;re fully set up to list and manage products. But to actually receive your share
              of each sale, you need to connect a Stripe account. Until this is done, sales are still
              recorded normally — your payouts just can&apos;t be sent to you yet.
            </p>
            <p style={{ fontSize: "12px", color: "var(--ink-mute)", lineHeight: 1.6, marginBottom: "20px" }}>
              The platform keeps a 20% commission on each sale; the rest is transferred directly to
              your connected account by Stripe.
            </p>
            <a href="/vendor/connect" className="btn btn-primary">
              Connect Stripe Account
            </a>
          </div>
        )}

        <div style={{ marginTop: "24px" }}>
          <button onClick={() => setDismissed(true)} className="btn btn-ghost">
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\components\OnboardingWelcomeModal.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\components\OnboardingWelcomeModal.tsx" -ForegroundColor Green

$content = @'
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signOutAction } from "../actions";
import OnboardingWelcomeModal from "@/components/OnboardingWelcomeModal";

export const dynamic = "force-dynamic";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/vendor/login");
  }

  // Confirm this logged-in user actually has a vendor_profiles row —
  // being a valid Supabase Auth user isn't enough on its own; only
  // real vendors should get past this point.
  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("display_name, is_active, stripe_onboarding_complete, avatar_url")
    .eq("id", user.id)
    .single();

  if (!vendorProfile || !vendorProfile.is_active) {
    redirect("/vendor/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <OnboardingWelcomeModal
        stripeConnected={!!vendorProfile.stripe_onboarding_complete}
        avatarUrl={vendorProfile.avatar_url ?? null}
        vendorName={vendorProfile.display_name ?? "there"}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
          Vendor Portal — {vendorProfile.display_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="/vendor/products" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Products
          </a>
          <a href="/vendor/connect" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Payouts
          </a>
          <a href="/vendor/history" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            History
          </a>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign Out
            </button>
          </form>
        </div>
      </div>
      <div style={{ padding: "32px" }}>{children}</div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\layout.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\layout.tsx" -ForegroundColor Green

$content = @'
import { getProducts } from "@/lib/products";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StickyBuyBar from "@/components/StickyBuyBar";
import ProductThumbnail from "@/components/ProductThumbnail";
import PriceAndBuySection from "@/components/PriceAndBuySection";
import ViewingBadge from "@/components/ViewingBadge";
import ProductMeta from "@/components/ProductMeta";
import { mockProducts, mockCategories } from "@/lib/mock-data";
import ViewTracker from "@/components/ViewTracker";
import ProductGallery, { type GalleryImage } from "@/components/ProductGallery";
import ProductAttributes from "@/components/ProductAttributes";
import VendorAvatarBadge from "@/components/VendorAvatarBadge";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamicParams = true;
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from("products")
    .select("slug")
    .eq("is_active", true);

  const supabaseSlugs = (data ?? []).map((p) => ({ slug: p.slug }));
  const mockSlugs = mockProducts.map((p) => ({ slug: p.slug }));

  return [...supabaseSlugs, ...mockSlugs].filter(
    (p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: `${product.title} — AI Digital Products`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const mockMatch = mockProducts.find((p) => p.slug === slug);

  // Always fetch live Supabase data to get purchases, flags, and PLR fields
  const { data: dbProduct } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, sale_price_cents, regular_price_cents, sale_stripe_price_id, regular_stripe_price_id, plr_price_cents, plr_stripe_price_id, is_plr_available, description, is_active, purchases, is_favorite, is_featured, is_not_ai, vendor_id, creator_refund_terms")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  let product: (typeof mockProducts)[0] | null = null;

  if (mockMatch && dbProduct) {
    // Merge: mock is source of truth for priceId/regularPriceId/features,
    // Supabase is source of truth for purchases, flags, and PLR pricing
    product = {
      ...mockMatch,
      purchases: dbProduct.purchases ?? 0,
      isFavorite: dbProduct.is_favorite ?? false,
      isFeatured: dbProduct.is_featured ?? false,
      isNotAi: dbProduct.is_not_ai ?? false,
      plrPrice: dbProduct.plr_price_cents ? dbProduct.plr_price_cents / 100 : undefined,
      plrPriceId: dbProduct.plr_stripe_price_id ?? undefined,
      isPlrAvailable: dbProduct.is_plr_available ?? false,
    };
  } else if (mockMatch) {
    product = { ...mockMatch, purchases: 0 };
  } else if (dbProduct) {
    const shaped = {
      id: dbProduct.id,
      slug: dbProduct.slug,
      title: dbProduct.name,
      category: dbProduct.category ?? "Prompt Packs",
      price: (dbProduct.sale_price_cents ?? 0) / 100,
      regularPrice: dbProduct.regular_price_cents ? dbProduct.regular_price_cents / 100 : undefined,
      description: dbProduct.description ?? "",
      priceId: dbProduct.sale_stripe_price_id ?? undefined,
      regularPriceId: dbProduct.regular_stripe_price_id ?? undefined,
      plrPrice: dbProduct.plr_price_cents ? dbProduct.plr_price_cents / 100 : undefined,
      plrPriceId: dbProduct.plr_stripe_price_id ?? undefined,
      isPlrAvailable: dbProduct.is_plr_available ?? false,
      thumbnailUrl: undefined,
      purchases: dbProduct.purchases ?? 0,
      isFavorite: dbProduct.is_favorite ?? false,
      isFeatured: dbProduct.is_featured ?? false,
      isNotAi: dbProduct.is_not_ai ?? false,
      rating: undefined,
      reviewCount: undefined,
    };
    // @ts-ignore
    product = shaped;
  } else {
    // Check for slug redirect
    const { data: redirectTarget } = await supabaseAdmin
      .from("products")
      .select("slug")
      .eq("old_slug", slug)
      .eq("is_active", true)
      .single();

    if (redirectTarget?.slug) {
      redirect(`/products/${redirectTarget.slug}`);
    }

    notFound();
  }

  if (!product) notFound();

  // Resolve the real "Sold by" name from the vendor relationship. dbProduct
  // is only populated when a real Supabase row exists — mock-only products
  // have no vendor_id and fall back to the site default.
  let sellerName = "AI Digital Products";
  let sellerAvatarUrl: string | null = null;
  if (dbProduct?.vendor_id) {
    const { data: vendorRow } = await supabaseAdmin
      .from("vendor_profiles")
      .select("display_name, avatar_url")
      .eq("id", dbProduct.vendor_id)
      .single();
    if (vendorRow?.display_name) sellerName = vendorRow.display_name;
    sellerAvatarUrl = vendorRow?.avatar_url ?? null;
  }
  product.seller = sellerName;
  const creatorRefundTerms = dbProduct?.creator_refund_terms ?? null;

  const categoryObj = mockCategories.find((c) => c.name === product.category);
  const categorySlug = categoryObj?.slug ?? product.category.toLowerCase().replace(/\s+/g, "-");

  const allProducts = await getProducts();
  const related = allProducts.filter((p) => p.slug !== product.slug).slice(0, 4);

  async function generateHowToUseSteps(productTitle: string): Promise<string[]> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: `You are writing 3 short "How To Use" steps for a digital product called: "${productTitle}".

Rules:
- Each step is one concise sentence (max 12 words)
- Steps must be specific to this exact product type
- Written in second person ("Download your...", "Open the...", "Use the...")
- No fluff, no generic advice
- Return ONLY a JSON array of 3 strings, nothing else

Example format: ["Step one here", "Step two here", "Step three here"]`,
            },
          ],
        }),
        next: { revalidate: 86400 },
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? "[]";
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    } catch {
      // fall through to defaults
    }

    return [
      "Download your files instantly after purchase",
      "Follow the included documentation to get started",
      "Deploy or use your product right away",
    ];
  }

  const howToUseSteps = await generateHowToUseSteps(product.title);

  const isComingSoon = !product.priceId;
  const hasSale = !!(product.regularPrice && product.regularPriceId);

  const [{ data: dbProductData }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id, attributes, thumbnail_url")
      .eq("slug", slug)
      .single(),
  ]);

  const attributes     = (dbProductData?.attributes as Record<string, unknown> | null) ?? {};
  const dbProductId    = dbProductData?.id ?? product.id;
  const dbThumbnailUrl = (dbProductData?.thumbnail_url as string | null) ?? null;

  const { data: dbImages } = await supabaseAdmin
    .from("product_images")
    .select("url, is_primary, display_order, alt_text")
    .eq("product_id", dbProductId)
    .order("display_order", { ascending: true });

  let galleryImages: GalleryImage[];
  if (dbImages && dbImages.length > 0) {
    const sorted = [...dbImages].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return 0;
    });
    galleryImages = sorted.map((img) => ({
      url: img.url,
      alt: (img.alt_text as string | null) ?? product.title,
    }));
  } else {
    const fallback = dbThumbnailUrl ?? product.thumbnailUrl ?? null;
    galleryImages = fallback ? [{ url: fallback, alt: product.title }] : [];
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "clamp(60px, 10vw, 100px)", overflowX: "hidden" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "12px 24px 0",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 8px",
            alignItems: "center",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--ink-faded)",
            overflow: "hidden",
          }}
        >
          <Link href="/products" className="nav-link">
            Products
          </Link>
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <Link href={`/categories/${categorySlug}`} className="nav-link">
            {product.category}
          </Link>
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <span
            style={{
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "min(400px, 50vw)",
            }}
          >
            {product.title}
          </span>
        </div>

        <section
          style={{
            borderBottom: "1px solid var(--line-soft)",
            padding: "0 0 clamp(48px, 8vw, 80px)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="detail-grid">
              <ProductGallery images={galleryImages} alt={product.title} />

              <div
                style={{
                  padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)",
                  background: "var(--bg)",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--ink-faded)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                  }}
                >
                  {product.category}
                </div>

                <h1
                  className="display"
                  style={{
                    fontSize: "clamp(24px, 4vw, 56px)",
                    lineHeight: 1.05,
                    color: "var(--ink)",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {product.title}
                </h1>

                {/* Favorite + Human-Made pills on detail page */}
                {(product.isFavorite || product.isNotAi) && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                    {product.isFavorite && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "rgba(245, 243, 238, 0.93)",
                          border: "1px solid rgba(0,0,0,0.10)",
                          borderRadius: "4px",
                          padding: "4px 8px",
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                          <circle cx="4" cy="4" r="3" style={{ fill: "#e8c97a" }} />
                        </svg>
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2a2a2a" }}>
                          Favorite
                        </span>
                      </div>
                    )}
                    {product.isNotAi && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "rgba(245, 243, 238, 0.93)",
                          border: "1px solid rgba(0,0,0,0.10)",
                          borderRadius: "4px",
                          padding: "4px 8px",
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                          <path d="M2 8 Q5 1 8 8" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                          <path d="M3.5 9 Q5 3.5 6.5 9" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                          <circle cx="5" cy="9.2" r="0.6" style={{ fill: "#3a3a3a" }} />
                        </svg>
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2a2a2a" }}>
                          Human-Made
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isComingSoon ? (
                  <>
                    <div
                      style={{
                        marginTop: "24px",
                        fontSize: "48px",
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        color: "var(--ink)",
                        lineHeight: 1,
                      }}
                    >
                      ${product.price.toFixed(2)}
                    </div>
                    <p
                      style={{
                        marginTop: "20px",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "var(--ink-faded)",
                        lineHeight: 1.65,
                      }}
                    >
                      {product.description}
                    </p>
                    <div style={{ marginTop: "36px" }}>
                      <span
                        className="btn btn-primary"
                        style={{ opacity: 0.45, cursor: "not-allowed" }}
                      >
                        Coming Soon
                      </span>
                    </div>
                  </>
                ) : (
                  <PriceAndBuySection
                    productId={product.id}
                    productName={product.title}
                    salePrice={product.price}
                    salePriceId={product.priceId}
                    regularPrice={hasSale ? product.regularPrice : undefined}
                    regularPriceId={hasSale ? product.regularPriceId : undefined}
                    description={product.description}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    purchases={product.purchases}
                    plrPrice={product.plrPrice}
                    plrPriceId={product.plrPriceId}
                    isPlrAvailable={product.isPlrAvailable}
                  />
                )}

                <div
                  style={{
                    marginTop: "32px",
                    paddingTop: "24px",
                    borderTop: "1px solid var(--line)",
                    fontSize: "12px",
                    color: "var(--ink-mute)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <VendorAvatarBadge url={sellerAvatarUrl} size={22} alt={product.seller} />
                  <span>Sold by {product.seller}</span>
                  <span style={{ color: "var(--ink-soft)" }}>·</span>
                  <Link href="/refund-buyer-protection" style={{ color: "var(--ink-mute)", textDecoration: "underline" }}>
                    Refund policy
                  </Link>
                </div>

                {creatorRefundTerms && (
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "12px",
                      color: "var(--ink-faded)",
                      fontWeight: 500,
                      lineHeight: 1.6,
                      background: "var(--bg-alt)",
                      border: "1px solid var(--line)",
                      padding: "10px 14px",
                    }}
                  >
                    <strong style={{ color: "var(--ink)" }}>Creator&apos;s refund terms:</strong> {creatorRefundTerms}
                  </div>
                )}

                {Object.keys(attributes).length > 0 && (
                  <ProductAttributes attributes={attributes} />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — About this product —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.05,
                color: "var(--ink)",
                marginBottom: "28px",
              }}
            >
              What it does.{" "}
              <span style={{ color: "var(--ink-mute)" }}>How it works.</span>
            </h2>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.7,
                marginBottom: "20px",
              }}
            >
              {product.description} This product is built to be deployed, not studied. Everything
              you need to get it running is included.
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.7,
              }}
            >
              The documentation covers the full setup process from start to finish. If you run into
              anything, seller support is included.
            </p>
          </div>
        </section>

        <section className="block alt">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — How to use —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.05,
                color: "var(--ink)",
                marginBottom: "48px",
              }}
            >
              Ready in 3 simple steps.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Start creating today.</span>
            </h2>
            <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0" }}>
              {howToUseSteps.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: "24px",
                    alignItems: "flex-start",
                    padding: "20px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--ink-mute)",
                      letterSpacing: "0.1em",
                      lineHeight: 1,
                      flexShrink: 0,
                      paddingTop: "2px",
                      minWidth: "20px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--ink-faded)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — Seller —
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <VendorAvatarBadge url={sellerAvatarUrl} size={48} alt={product.seller} />
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "var(--ink)",
                }}
              >
                {product.seller}
              </div>
            </div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.65,
                maxWidth: "480px",
                marginBottom: "16px",
              }}
            >
              An independent builder specialising in AI digital products. All products are tested,
              documented, and supported directly by the seller.
            </p>
            {creatorRefundTerms && (
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--ink-faded)",
                  lineHeight: 1.65,
                  maxWidth: "480px",
                  marginBottom: "16px",
                }}
              >
                <strong style={{ color: "var(--ink)" }}>Refund terms for this product:</strong>{" "}
                {creatorRefundTerms}
              </p>
            )}
            <Link
              href="/refund-buyer-protection"
              style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", textDecoration: "underline" }}
            >
              View the full Refund &amp; Buyer Protection Policy →
            </Link>
          </div>
        </section>

        <section
          style={{
            padding: "clamp(80px, 12vw, 160px) 24px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
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
              — Related —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(32px, 4.5vw, 60px)",
                lineHeight: 0.96,
                color: "var(--ink)",
                textAlign: "center",
                marginBottom: "64px",
              }}
            >
              You might also like.{" "}
              <span style={{ color: "var(--ink-mute)" }}>More from the marketplace.</span>
            </h2>
            <div className="related-grid">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  style={{ textDecoration: "none", display: "flex", height: "100%", color: "inherit" }}
                >
                  <div
                    className="card"
                    style={{
                      padding: "28px 28px 40px",
                      minHeight: "220px",
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      height: "100%",
                      ...(p.isFeatured
                        ? { boxShadow: "0 0 0 1px rgba(160,160,160,0.13), 0 6px 32px rgba(0,0,0,0.16)" }
                        : {}),
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <ProductThumbnail url={p.thumbnailUrl} alt={p.title} />

                      {p.isFavorite && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "rgba(245, 243, 238, 0.93)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(0,0,0,0.10)",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            zIndex: 10,
                          }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                            <circle cx="4" cy="4" r="3" style={{ fill: "#e8c97a" }} />
                          </svg>
                          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2a2a2a" }}>
                            Favorite
                          </span>
                        </div>
                      )}

                      {p.isNotAi && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "rgba(245, 243, 238, 0.93)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(0,0,0,0.10)",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            zIndex: 10,
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                            <path d="M2 8 Q5 1 8 8" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                            <path d="M3.5 9 Q5 3.5 6.5 9" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                            <circle cx="5" cy="9.2" r="0.6" style={{ fill: "#3a3a3a" }} />
                          </svg>
                          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2a2a2a" }}>
                            Human-Made
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-faded)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                          {p.category}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: "8px", lineHeight: 1.25 }}>
                          {p.title}
                        </div>
                        <div className="card-seller">Seller · {p.seller}</div>

                        <ProductMeta
                          rating={p.rating}
                          reviewCount={p.reviewCount}
                          price={p.price}
                          purchases={p.purchases}
                        />

                        <ViewingBadge productId={p.id} />
                      </div>
                      <span className="card-arrow" style={{ marginTop: "20px" }}>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <ViewTracker productId={product.id} />

      <StickyBuyBar
        price={product.price}
        priceId={product.priceId}
        productId={product.id}
        productName={product.title}
      />
    </>
  );
}
'@
Set-Content -LiteralPath "src\app\products\[slug]\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\products\[slug]\page.tsx" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: vendors, error } = await supabaseAdmin
    .from("vendor_profiles")
    .select("id, display_name, business_name, email, is_active, stripe_account_id, avatar_url");

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
Write-Host "REPLACED: src\app\api\admin\vendors-connect-status\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";
import VendorAvatarBadge from "@/components/VendorAvatarBadge";

interface Vendor {
  id: string;
  display_name: string | null;
  business_name: string | null;
  email: string | null;
  is_active: boolean;
  stripe_account_id: string | null;
  avatar_url: string | null;
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <VendorAvatarBadge url={v.avatar_url} size={28} alt={v.business_name || v.display_name || "Vendor"} />
                    <span>
                      {v.business_name || v.display_name || "—"}
                      {!v.is_active && <span style={{ marginLeft: "6px", fontSize: "10px", color: "var(--ink-mute)" }}>(inactive)</span>}
                    </span>
                  </div>
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
Write-Host "REPLACED: src\app\admin\vendors\page.tsx" -ForegroundColor Green

Write-Host "`nAll 12 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan