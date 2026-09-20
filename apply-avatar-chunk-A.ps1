# Chunk A: Admin avatar upload + Settings page
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\admin\settings" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\avatar\confirm" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\avatar\presign" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\admin\me" | Out-Null

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

Write-Host "`nAll 6 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan