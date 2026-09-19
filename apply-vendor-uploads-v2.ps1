# Creates folders and writes full content for all 11 vendor product-editing files.
# Run from the root of your aidigitalproducts-site repo.
# Uses -LiteralPath throughout so [id] and (protected) in paths are treated as
# literal folder names, not wildcard patterns.

New-Item -ItemType Directory -Force -Path "src\app\api\vendor\images\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\images\confirm" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\images\presign" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\images\reorder" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\products\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\upload-file" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\upload-file\presign" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\upload-video" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\upload-video\presign" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\vendor\(protected)\products\[id]\edit" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

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
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { productId?: string; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fileName } = body;
  if (!productId) return NextResponse.json({ error: "No productId provided" }, { status: 400 });

  // Ownership check — a vendor can only upload to their own product
  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = (fileName?.split(".").pop() || "mp4").toLowerCase();
  const path = `product-videos/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({ Bucket: BUCKET, Key: path, ContentType: "video/mp4" });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${CDN}/${path}`;

  return NextResponse.json({ uploadUrl, path, publicUrl });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\upload-video\presign\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\upload-video\presign\route.ts" -ForegroundColor Green

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

  let body: { productId?: string; publicUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, publicUrl } = body;
  if (!productId || !publicUrl) {
    return NextResponse.json({ error: "Missing productId or publicUrl" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({ video_url: publicUrl })
    .eq("id", productId)
    .eq("vendor_id", user.id) // ownership enforced directly in the filter
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ url: publicUrl });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\upload-video\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\upload-video\route.ts" -ForegroundColor Green

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

  let body: { productId?: string; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fileName } = body;
  if (!productId) return NextResponse.json({ error: "No productId provided" }, { status: 400 });

  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = (fileName?.split(".").pop() || "zip").toLowerCase();
  const path = `products/${productId}/${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\upload-file\presign\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\upload-file\presign\route.ts" -ForegroundColor Green

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

  let body: { productId?: string; path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, path } = body;
  if (!productId || !path) {
    return NextResponse.json({ error: "Missing productId or path" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({ download_url: path })
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ path });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\upload-file\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\upload-file\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

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
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { productId?: string; fileName?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fileName, contentType } = body;
  if (!productId) return NextResponse.json({ error: "No productId provided" }, { status: 400 });

  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
Set-Content -LiteralPath "src\app\api\vendor\images\presign\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\images\presign\route.ts" -ForegroundColor Green

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

  let body: {
    productId?: string;
    publicUrl?: string;
    path?: string;
    isPrimary?: boolean;
    displayOrder?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, publicUrl, path, isPrimary, displayOrder } = body;
  if (!productId || !publicUrl) {
    return NextResponse.json({ error: "Missing productId or publicUrl" }, { status: 400 });
  }

  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl,
      is_primary: !!isPrimary,
      display_order: displayOrder ?? 0,
      storage_path: path ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isPrimary) {
    await supabaseAdmin.from("products").update({ thumbnail_url: publicUrl }).eq("id", productId);
  }

  return NextResponse.json({ image: data });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\images\confirm\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\images\confirm\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { images?: { id: string; display_order: number; is_primary: boolean }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const images = body.images ?? [];
  if (images.length === 0) return NextResponse.json({ ok: true });

  // Verify every image belongs to a product owned by this vendor before
  // touching any of them. Deliberately using two plain queries instead of
  // a PostgREST nested-relationship embed, to avoid depending on an
  // unverified auto-detected FK relationship.
  const ids = images.map((i) => i.id);
  const { data: rows } = await supabaseAdmin
    .from("product_images")
    .select("id, product_id")
    .in("id", ids);

  if (!rows || rows.length !== ids.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const productIds = [...new Set(rows.map((r) => r.product_id))];
  const { data: ownedProducts } = await supabaseAdmin
    .from("products")
    .select("id")
    .in("id", productIds)
    .eq("vendor_id", user.id);

  const ownedIds = new Set((ownedProducts ?? []).map((p) => p.id));
  const allOwned = productIds.every((pid) => ownedIds.has(pid));
  if (!allOwned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  for (const img of images) {
    await supabaseAdmin
      .from("product_images")
      .update({ display_order: img.display_order, is_primary: img.is_primary })
      .eq("id", img.id);
  }

  return NextResponse.json({ ok: true });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\images\reorder\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\images\reorder\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const { data: imageRow } = await supabaseAdmin
    .from("product_images")
    .select("id, product_id")
    .eq("id", id)
    .single();
  if (!imageRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", imageRow.product_id)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("product_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\images\[id]\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\images\[id]\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

async function getVendorUser() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getVendorUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, description, sale_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url")
    .eq("id", id)
    .eq("vendor_id", user.id) // scoped — a vendor can only ever fetch their own product
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getVendorUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  // Verify ownership BEFORE allowing any update — never trust the client's
  // claim about which product this is.
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("id, vendor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.vendor_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Deliberately restricted field set — a vendor can edit their own
  // listing's basics, but never Stripe price IDs, PLR settings, or
  // site-level curation flags (is_featured, etc.). Those stay admin-only.
  const allowed: Record<string, unknown> = {};
  if (typeof body.name === "string") allowed.name = body.name;
  if (typeof body.description === "string") allowed.description = body.description;
  if (typeof body.sale_price_cents === "number" || body.sale_price_cents === null) {
    allowed.sale_price_cents = body.sale_price_cents;
  }
  if (typeof body.is_active === "boolean") allowed.is_active = body.is_active;
  if (body.attributes && typeof body.attributes === "object") {
    allowed.attributes = body.attributes;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(allowed)
    .eq("id", id)
    .eq("vendor_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\products\[id]\route.ts" -Value $content -NoNewline
Write-Host "Wrote src\app\api\vendor\products\[id]\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ImageUploader, { type UIImage } from "@/components/admin/ImageUploader";

const PREDEFINED_ATTR_KEYS = [
  "promptsIncluded","worksWith","license","format","lastUpdated",
  "version","instantDownload","support","difficultyLevel","builtWith",
  "requirements","aiModel",
];

const WORKS_WITH_OPTIONS = [
  "Midjourney", "DALL-E 3", "Ideogram", "Stable Diffusion",
  "ChatGPT", "Claude", "GPT-4",
];

interface AttributeState {
  promptsIncluded: string;
  worksWith: string[];
  license: string;
  format: string;
  lastUpdated: string;
  version: string;
  instantDownload: string;
  support: string;
  difficultyLevel: string;
  builtWith: string;
  requirements: string;
  aiModel: string;
  custom: { key: string; value: string }[];
}

function attrsFromRecord(a: Record<string, unknown>): AttributeState {
  const custom = Object.entries(a)
    .filter(([k]) => !PREDEFINED_ATTR_KEYS.includes(k))
    .map(([k, v]) => ({ key: k, value: String(v) }));
  return {
    promptsIncluded: a.promptsIncluded != null ? String(a.promptsIncluded) : "",
    worksWith:       Array.isArray(a.worksWith) ? (a.worksWith as string[]) : [],
    license:         (a.license as string)         ?? "",
    format:          (a.format as string)           ?? "",
    lastUpdated:     (a.lastUpdated as string)      ?? "",
    version:         (a.version as string)          ?? "",
    instantDownload: a.instantDownload === true ? "true" : a.instantDownload === false ? "false" : "",
    support:         (a.support as string)          ?? "",
    difficultyLevel: (a.difficultyLevel as string)  ?? "",
    builtWith:       (a.builtWith as string)        ?? "",
    requirements:    (a.requirements as string)     ?? "",
    aiModel:         (a.aiModel as string)          ?? "",
    custom,
  };
}

function buildAttributesPayload(attrs: AttributeState): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (attrs.promptsIncluded)        result.promptsIncluded = Number(attrs.promptsIncluded);
  if (attrs.worksWith.length > 0)   result.worksWith = attrs.worksWith;
  if (attrs.license)                result.license = attrs.license;
  if (attrs.format)                 result.format = attrs.format;
  if (attrs.lastUpdated)            result.lastUpdated = attrs.lastUpdated;
  if (attrs.version)                result.version = attrs.version;
  if (attrs.instantDownload !== "") result.instantDownload = attrs.instantDownload === "true";
  if (attrs.support)                result.support = attrs.support;
  if (attrs.difficultyLevel)        result.difficultyLevel = attrs.difficultyLevel;
  if (attrs.builtWith)              result.builtWith = attrs.builtWith;
  if (attrs.requirements)           result.requirements = attrs.requirements;
  if (attrs.aiModel)                result.aiModel = attrs.aiModel;
  for (const c of attrs.custom) {
    if (c.key.trim() && c.value.trim()) result[c.key.trim()] = c.value.trim();
  }
  return result;
}

interface Props {
  product: {
    id: string;
    name: string;
    description: string | null;
    sale_price_cents: number | null;
    is_active: boolean;
    video_url: string | null;
    download_url: string | null;
    attributes: Record<string, unknown> | null;
  };
  initialImages: UIImage[];
}

export default function VendorProductEditForm({ product, initialImages }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(
    product.sale_price_cents ? (product.sale_price_cents / 100).toFixed(2) : ""
  );
  const [isActive, setIsActive] = useState(product.is_active);
  const [images, setImages] = useState<UIImage[]>(initialImages);
  const [attrs, setAttrs] = useState<AttributeState>(() =>
    product.attributes ? attrsFromRecord(product.attributes) : {
      promptsIncluded: "", worksWith: [], license: "", format: "", lastUpdated: "",
      version: "", instantDownload: "", support: "", difficultyLevel: "",
      builtWith: "", requirements: "", aiModel: "", custom: [],
    }
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  async function uploadNewImages(): Promise<UIImage[]> {
    const result: UIImage[] = [];
    for (const img of images) {
      if (!img.file) { result.push(img); continue; }

      const presignRes = await fetch("/api/vendor/images/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          fileName: img.file.name,
          contentType: img.file.type,
        }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to get image upload URL");
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": img.file.type || "image/jpeg" },
        body: img.file,
      });
      if (!uploadRes.ok) throw new Error("Image upload to storage failed");

      result.push({ ...img, url: publicUrl, file: undefined });
    }
    return result;
  }

  async function syncImages(finalImages: UIImage[]): Promise<void> {
    if (finalImages.length === 0) return;

    const finalIds = new Set(finalImages.filter((i) => i.id).map((i) => i.id!));
    const removed = initialImages.filter((i) => i.id && !finalIds.has(i.id));
    await Promise.all(
      removed.map((img) => fetch(`/api/vendor/images/${img.id}`, { method: "DELETE" }))
    );

    const existingToUpdate = finalImages.filter((i) => i.id);
    if (existingToUpdate.length > 0) {
      await fetch("/api/vendor/images/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: existingToUpdate.map((img) => ({
            id: img.id,
            display_order: img.display_order,
            is_primary: img.is_primary,
          })),
        }),
      });
    }

    for (const img of finalImages.filter((i) => !i.id)) {
      await fetch("/api/vendor/images/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          publicUrl: img.url,
          isPrimary: img.is_primary,
          displayOrder: img.display_order,
        }),
      });
    }
  }

  async function uploadVideo(): Promise<void> {
    if (!videoFile) return;
    const presignRes = await fetch("/api/vendor/upload-video/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, fileName: videoFile.name }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to get upload URL");
    }
    const { uploadUrl, publicUrl } = await presignRes.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: videoFile,
    });
    if (!uploadRes.ok) throw new Error("Video upload to storage failed");

    const confirmRes = await fetch("/api/vendor/upload-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, publicUrl }),
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to save video URL");
    }
  }

  async function uploadDownloadFile(): Promise<void> {
    if (!downloadFile) return;
    const presignRes = await fetch("/api/vendor/upload-file/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, fileName: downloadFile.name }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to get upload URL");
    }
    const { token: uploadToken, path } = await presignRes.json();

    const { error: uploadError } = await supabase.storage
      .from("product-files")
      .uploadToSignedUrl(path, uploadToken, downloadFile);
    if (uploadError) throw new Error(uploadError.message ?? "File upload to storage failed");

    const confirmRes = await fetch("/api/vendor/upload-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, path }),
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to save file URL");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          sale_price_cents: price ? Math.round(parseFloat(price) * 100) : null,
          is_active: isActive,
          attributes: buildAttributesPayload(attrs),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save");
      }

      setUploading(true);
      const finalImages = await uploadNewImages();
      if (videoFile) await uploadVideo();
      if (downloadFile) await uploadDownloadFile();
      await syncImages(finalImages);
      setUploading(false);

      setToast({ msg: "Saved!", ok: true });
      setTimeout(() => router.push("/vendor/products"), 1000);
    } catch (err) {
      setToast({ msg: (err as Error).message, ok: false });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid var(--ink-soft)",
    fontSize: "14px",
    background: "transparent",
    color: "var(--ink)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--ink-faded)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <h1 className="display" style={{ fontSize: "26px", color: "var(--ink)" }}>
        Edit Product
      </h1>

      <div>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Price ($)</label>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>Active (visible on the site)</span>
      </label>

      {/* Product Images */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <div style={{ ...labelStyle, marginBottom: "12px" }}>Product Images</div>
        <ImageUploader images={images} onChange={setImages} uploading={uploading} />
      </div>

      {/* Download file */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <label style={labelStyle}>Download File</label>
        {product.download_url && !downloadFile && (
          <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
            Current file on record
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
          <input type="file" style={{ display: "none" }} onChange={(e) => setDownloadFile(e.target.files?.[0] ?? null)} />
          {downloadFile
            ? <><strong style={{ color: "var(--ink)" }}>{downloadFile.name}</strong> — {(downloadFile.size / 1024 / 1024).toFixed(2)} MB</>
            : <>{product.download_url ? "Replace file…" : "Choose file to upload…"}</>
          }
        </label>
      </div>

      {/* Video */}
      <div>
        <label style={labelStyle}>Preview Video (.mp4)</label>
        {product.video_url && !videoFile && (
          <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
            Current video on record
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
          <input type="file" accept="video/mp4" style={{ display: "none" }} onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
          {videoFile
            ? <><strong style={{ color: "var(--ink)" }}>{videoFile.name}</strong> — {(videoFile.size / 1024 / 1024).toFixed(2)} MB</>
            : <>{product.video_url ? "Replace video…" : "Choose .mp4 to upload…"}</>
          }
        </label>
      </div>

      {/* Attributes */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <div style={{ ...labelStyle, marginBottom: "16px" }}>Product Attributes</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Prompts Included</label>
            <input style={inputStyle} type="number" min="0" value={attrs.promptsIncluded} onChange={(e) => setAttrs((a) => ({ ...a, promptsIncluded: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>License</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.license} onChange={(e) => setAttrs((a) => ({ ...a, license: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="Personal Use">Personal Use</option>
              <option value="Commercial Use">Commercial Use</option>
              <option value="Extended Commercial">Extended Commercial</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Format</label>
            <input style={inputStyle} value={attrs.format} onChange={(e) => setAttrs((a) => ({ ...a, format: e.target.value }))} placeholder="e.g. PDF + TXT" />
          </div>
          <div>
            <label style={labelStyle}>Version</label>
            <input style={inputStyle} value={attrs.version} onChange={(e) => setAttrs((a) => ({ ...a, version: e.target.value }))} placeholder="e.g. 1.0" />
          </div>
          <div>
            <label style={labelStyle}>Difficulty Level</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.difficultyLevel} onChange={(e) => setAttrs((a) => ({ ...a, difficultyLevel: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>AI Model</label>
            <input style={inputStyle} value={attrs.aiModel} onChange={(e) => setAttrs((a) => ({ ...a, aiModel: e.target.value }))} placeholder="e.g. GPT-4, Claude" />
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Requirements</label>
          <input style={inputStyle} value={attrs.requirements} onChange={(e) => setAttrs((a) => ({ ...a, requirements: e.target.value }))} placeholder="e.g. Node.js 18+, Python 3" />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Works With</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {WORKS_WITH_OPTIONS.map((opt) => {
              const checked = attrs.worksWith.includes(opt);
              return (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: `1px solid ${checked ? "var(--ink)" : "var(--ink-soft)"}`, background: checked ? "var(--ink)" : "transparent", cursor: "pointer" }}>
                  <input type="checkbox" checked={checked} onChange={() => setAttrs((a) => ({ ...a, worksWith: checked ? a.worksWith.filter((w) => w !== opt) : [...a.worksWith, opt] }))} style={{ display: "none" }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: checked ? "var(--bg)" : "var(--ink-faded)" }}>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {toast && (
        <p style={{ fontSize: "13px", color: toast.ok ? "#166534" : "#e53e3e", margin: 0 }}>
          {toast.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn btn-primary"
        style={{ opacity: saving ? 0.6 : 1, alignSelf: "flex-start" }}
      >
        {saving ? (uploading ? "Uploading…" : "Saving…") : "Save Changes"}
      </button>
    </form>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\products\[id]\edit\EditForm.tsx" -Value $content -NoNewline
Write-Host "Wrote src\app\vendor\(protected)\products\[id]\edit\EditForm.tsx" -ForegroundColor Green

$content = @'
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import VendorProductEditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditVendorProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, description, sale_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url")
    .eq("id", id)
    .single();

  // Ownership check — a vendor can only ever land here for their own product
  if (!product || product.vendor_id !== user.id) notFound();

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("id, url, is_primary, display_order")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  return <VendorProductEditForm product={product} initialImages={images ?? []} />;
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\products\[id]\edit\page.tsx" -Value $content -NoNewline
Write-Host "Wrote src\app\vendor\(protected)\products\[id]\edit\page.tsx" -ForegroundColor Green

Write-Host "`nAll 11 files created/replaced." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan