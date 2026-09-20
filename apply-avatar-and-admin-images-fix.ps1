# Adds vendor profile picture upload (direct-to-R2, with client-side
# quality validation) and a new admin images presign route matching the
# working vendor pattern, fixing the body-through-function bug.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\api\admin\images\presign" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\avatar\confirm" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\avatar\presign" | Out-Null
New-Item -ItemType Directory -Force -Path "src\components" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";

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

const MAX_BYTES = 3 * 1024 * 1024; // 3MB cap

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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

  // No product/ownership check needed — this is always scoped to the
  // authenticated vendor's own avatar, keyed by their own user id.
  const ext = (fileName?.split(".").pop() || "jpg").toLowerCase();
  const path = `avatars/${user.id}/${Date.now()}.${ext}`;

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
Set-Content -LiteralPath "src\app\api\vendor\avatar\presign\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\vendor\avatar\presign\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { publicUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.publicUrl) {
    return NextResponse.json({ error: "Missing publicUrl" }, { status: 400 });
  }

  // Unlike product images, a profile picture is the vendor's own account
  // setting, not a listing edit — it goes live immediately, no admin
  // review needed.
  const { error } = await supabaseAdmin
    .from("vendor_profiles")
    .update({ avatar_url: body.publicUrl })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, avatar_url: body.publicUrl });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\avatar\confirm\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\vendor\avatar\confirm\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const MIN_DIMENSION = 400; // px — rejects small/low-quality images
const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const DISPLAY_SIZE = 96; // px — fixed modern avatar size regardless of source dimensions

interface Props {
  currentAvatarUrl: string | null;
}

export default function AvatarUploader({ currentAvatarUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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
      const presignRes = await fetch("/api/vendor/avatar/presign", {
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

      const confirmRes = await fetch("/api/vendor/avatar/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicUrl: presignData.publicUrl }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error ?? "Failed to save picture");

      setAvatarUrl(confirmData.avatar_url);
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
Write-Host "NEW: src\components\AvatarUploader.tsx" -ForegroundColor Green

$content = @'
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import AvatarUploader from "@/components/AvatarUploader";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  // The layout already redirects to /vendor/login when there's no user,
  // but guard here too rather than asserting non-null.
  if (!user) return null;

  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("business_name, display_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const { count: productCount } = await supabaseAdmin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", user.id);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", marginBottom: "24px" }}>
        Welcome back.
      </h1>

      <div style={{ marginBottom: "28px", paddingBottom: "28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
          Profile Picture
        </div>
        <AvatarUploader currentAvatarUrl={vendorProfile?.avatar_url ?? null} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--ink-faded)" }}>
        <p>Business: {vendorProfile?.business_name}</p>
        <p>Email: {vendorProfile?.email}</p>
        <p>Products linked to your account: {productCount ?? 0}</p>
      </div>
      <a
        href="/vendor/products"
        className="btn btn-primary"
        style={{ marginTop: "24px", display: "inline-block" }}
      >
        View & Manage Products
      </a>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\dashboard\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\dashboard\page.tsx" -ForegroundColor Green

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

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  let body: { productId?: string; fileName?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fileName, contentType } = body;
  if (!productId) return NextResponse.json({ error: "No productId provided" }, { status: 400 });

  // No ownership check needed here the way the vendor route has one —
  // admin can edit any product's images by design.
  const ext = (fileName?.split(".").pop() || "jpg").toLowerCase();
  const path = `product-images/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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
Set-Content -LiteralPath "src\app\api\admin\images\presign\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\images\presign\route.ts" -ForegroundColor Green

Write-Host "`nAll 5 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan