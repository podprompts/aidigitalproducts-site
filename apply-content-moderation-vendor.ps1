# Content moderation, part 1: stages every vendor edit for admin review
# instead of writing live. Run from the root of your aidigitalproducts-site repo.

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
    .select(
      "id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url, pending_changes, review_status, review_rejected_reason"
    )
    .eq("id", id)
    .eq("vendor_id", user.id) // scoped — a vendor can only ever fetch their own product
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

/**
 * Every vendor edit is staged, never written live. This route only ever
 * touches pending_changes / review_status / review_submitted_at — the
 * actual product columns (and product_images) are only updated when an
 * admin approves the submission, via the separate admin approval route.
 * Stripe price syncing also happens at approval time, not here, so a
 * price change never takes effect until it's actually approved either.
 */
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

  // Same field whitelist as before — a vendor can propose changes to their
  // own listing's content, pricing amounts, images, video, and file, but
  // never Stripe price IDs directly, site-level curation flags, the
  // coming-soon/archived states, or is_not_ai. Those stay admin-only.
  // "images" is a full array of { url, is_primary, display_order } — the
  // vendor's complete desired image set, not an incremental change.
  const proposed: Record<string, unknown> = {};
  if (typeof body.name === "string") proposed.name = body.name;
  if (typeof body.slug === "string") proposed.slug = body.slug;
  if (typeof body.category === "string") proposed.category = body.category;
  if (typeof body.description === "string") proposed.description = body.description;
  if (Array.isArray(body.features)) proposed.features = body.features;
  if (typeof body.sale_price_cents === "number" || body.sale_price_cents === null) {
    proposed.sale_price_cents = body.sale_price_cents;
  }
  if (typeof body.regular_price_cents === "number" || body.regular_price_cents === null) {
    proposed.regular_price_cents = body.regular_price_cents;
  }
  if (typeof body.is_active === "boolean") proposed.is_active = body.is_active;
  if (typeof body.is_plr_available === "boolean") proposed.is_plr_available = body.is_plr_available;
  if (typeof body.plr_price_cents === "number" || body.plr_price_cents === null) {
    proposed.plr_price_cents = body.plr_price_cents;
  }
  if (body.attributes && typeof body.attributes === "object") {
    proposed.attributes = body.attributes;
  }
  if (typeof body.video_url === "string" || body.video_url === null) {
    proposed.video_url = body.video_url;
  }
  if (typeof body.download_url === "string" || body.download_url === null) {
    proposed.download_url = body.download_url;
  }
  if (Array.isArray(body.images)) {
    proposed.images = body.images;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      pending_changes: proposed,
      review_status: "pending",
      review_submitted_at: new Date().toISOString(),
      review_rejected_reason: null,
    })
    .eq("id", id)
    .eq("vendor_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\products\[id]\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\vendor\products\[id]\route.ts" -ForegroundColor Green

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

  // Ownership check only — no longer writes video_url live. The main
  // product PUT route stages this URL into pending_changes instead, so
  // it doesn't take effect until an admin approves it.
  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();

  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ url: publicUrl });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\upload-video\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\vendor\upload-video\route.ts" -ForegroundColor Green

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

  // Ownership check only — no longer writes download_url live. The main
  // product PUT route stages this path into pending_changes instead, so
  // it doesn't take effect until an admin approves it.
  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();

  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ path });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\upload-file\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\vendor\upload-file\route.ts" -ForegroundColor Green

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

  // No longer inserts into product_images or updates thumbnail_url live —
  // the main product PUT route stages this into pending_changes.images
  // instead, so a new image doesn't appear on the live site until an
  // admin approves the submission.
  return NextResponse.json({
    image: { url: publicUrl, is_primary: !!isPrimary, display_order: displayOrder ?? 0, storage_path: path ?? null },
  });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\images\confirm\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\vendor\images\confirm\route.ts" -ForegroundColor Green

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
    slug: string;
    category: string | null;
    description: string | null;
    features: string[] | null;
    sale_price_cents: number | null;
    regular_price_cents: number | null;
    is_plr_available: boolean | null;
    plr_price_cents: number | null;
    is_active: boolean;
    video_url: string | null;
    download_url: string | null;
    attributes: Record<string, unknown> | null;
    review_status?: string;
    review_rejected_reason?: string | null;
  };
  initialImages: UIImage[];
}

export default function VendorProductEditForm({ product, initialImages }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [category, setCategory] = useState(product.category ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [features, setFeatures] = useState((product.features ?? []).join("\n"));
  const [price, setPrice] = useState(
    product.sale_price_cents ? (product.sale_price_cents / 100).toFixed(2) : ""
  );
  const [regularPrice, setRegularPrice] = useState(
    product.regular_price_cents ? (product.regular_price_cents / 100).toFixed(2) : ""
  );
  const [isPlrAvailable, setIsPlrAvailable] = useState(product.is_plr_available ?? false);
  const [plrPrice, setPlrPrice] = useState(
    product.plr_price_cents ? (product.plr_price_cents / 100).toFixed(2) : ""
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

  async function buildFinalImages(): Promise<{ url: string; is_primary: boolean; display_order: number }[]> {
    const result: { url: string; is_primary: boolean; display_order: number }[] = [];
    for (const img of images) {
      if (!img.file) {
        result.push({ url: img.url, is_primary: img.is_primary, display_order: img.display_order });
        continue;
      }

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

      result.push({ url: publicUrl, is_primary: img.is_primary, display_order: img.display_order });
    }
    return result;
  }

  async function getVideoUrl(): Promise<string | null> {
    if (!videoFile) return product.video_url;

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

    return publicUrl;
  }

  async function getDownloadUrl(): Promise<string | null> {
    if (!downloadFile) return product.download_url;

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

    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      // Upload any new files to storage first — this does NOT make them
      // live. Nothing becomes visible on the site until an admin approves
      // the submission this builds up next.
      setUploading(true);
      const finalImages = await buildFinalImages();
      const videoUrl = await getVideoUrl();
      const downloadUrl = await getDownloadUrl();
      setUploading(false);

      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          category,
          description,
          features: features.split("\n").map((f) => f.trim()).filter(Boolean),
          sale_price_cents: price ? Math.round(parseFloat(price) * 100) : null,
          regular_price_cents: regularPrice ? Math.round(parseFloat(regularPrice) * 100) : null,
          is_active: isActive,
          is_plr_available: isPlrAvailable,
          plr_price_cents: isPlrAvailable && plrPrice ? Math.round(parseFloat(plrPrice) * 100) : null,
          attributes: buildAttributesPayload(attrs),
          video_url: videoUrl,
          download_url: downloadUrl,
          images: finalImages,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save");
      }

      setToast({ msg: "Submitted for admin review!", ok: true });
      setTimeout(() => router.push("/vendor/products"), 1200);
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

      {product.review_status === "pending" && (
        <div style={{ background: "#fff8e1", border: "1px solid #f0d878", padding: "14px 18px", fontSize: "13px", color: "#6b5a1a" }}>
          Your last submission is awaiting admin review. The live listing still shows your
          previously approved version until it's reviewed.
        </div>
      )}
      {product.review_status === "rejected" && (
        <div style={{ background: "#fdecea", border: "1px solid #e5a19a", padding: "14px 18px", fontSize: "13px", color: "#7a2e26" }}>
          <strong>Your last submission was not approved.</strong>
          {product.review_rejected_reason && <> Reason: {product.review_rejected_reason}</>}
        </div>
      )}

      <div>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label style={labelStyle}>Slug</label>
        <input style={inputStyle} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <p style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "4px" }}>
          This controls the product's URL — changing it breaks any existing links or bookmarks to this page.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Category</label>
        <input style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Voice Agents" />
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
        <label style={labelStyle}>Features — one per line</label>
        <textarea
          style={{ ...inputStyle, minHeight: "90px", resize: "vertical", fontFamily: "monospace", fontSize: "13px" }}
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
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

      <div>
        <label style={labelStyle}>Regular Price ($) — optional</label>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          min="0"
          value={regularPrice}
          onChange={(e) => setRegularPrice(e.target.value)}
          placeholder={'Shown as a strikethrough "was" price'}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>Active (visible on the site)</span>
      </label>

      {/* PLR Licensing */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <div style={{ ...labelStyle, marginBottom: "12px" }}>PLR Licensing</div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: isPlrAvailable ? "16px" : 0 }}>
          <input type="checkbox" checked={isPlrAvailable} onChange={(e) => setIsPlrAvailable(e.target.checked)} />
          <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>Offer a PLR (resale) license for this product</span>
        </label>
        {isPlrAvailable && (
          <div>
            <label style={labelStyle}>PLR Price ($)</label>
            <input
              style={inputStyle}
              type="number"
              step="0.01"
              min="0"
              value={plrPrice}
              onChange={(e) => setPlrPrice(e.target.value)}
            />
            <p style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "4px" }}>
              This sets the displayed price. The site owner still needs to confirm a matching Stripe price is set up before this goes live for real checkout.
            </p>
          </div>
        )}
      </div>

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
          <div>
            <label style={labelStyle}>Last Updated</label>
            <input style={inputStyle} type="date" value={attrs.lastUpdated} onChange={(e) => setAttrs((a) => ({ ...a, lastUpdated: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Instant Download</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.instantDownload} onChange={(e) => setAttrs((a) => ({ ...a, instantDownload: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Support</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.support} onChange={(e) => setAttrs((a) => ({ ...a, support: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="Email">Email</option>
              <option value="Community">Community</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Built With</label>
            <input style={inputStyle} value={attrs.builtWith} onChange={(e) => setAttrs((a) => ({ ...a, builtWith: e.target.value }))} placeholder="e.g. Notion" />
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

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Custom Attributes</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {attrs.custom.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: "8px" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Key"
                  value={c.key}
                  onChange={(e) => setAttrs((a) => ({
                    ...a,
                    custom: a.custom.map((x, xi) => xi === i ? { ...x, key: e.target.value } : x),
                  }))}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Value"
                  value={c.value}
                  onChange={(e) => setAttrs((a) => ({
                    ...a,
                    custom: a.custom.map((x, xi) => xi === i ? { ...x, value: e.target.value } : x),
                  }))}
                />
                <button
                  type="button"
                  onClick={() => setAttrs((a) => ({ ...a, custom: a.custom.filter((_, xi) => xi !== i) }))}
                  style={{ padding: "0 14px", border: "1px solid var(--ink-soft)", background: "transparent", cursor: "pointer", color: "var(--ink-faded)" }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAttrs((a) => ({ ...a, custom: [...a.custom, { key: "", value: "" }] }))}
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: "flex-start" }}
            >
              + Add Custom Attribute
            </button>
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
        {saving ? (uploading ? "Uploading…" : "Submitting…") : "Submit for Review"}
      </button>
    </form>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\products\[id]\edit\EditForm.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\products\[id]\edit\EditForm.tsx" -ForegroundColor Green

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
    .select("id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url, review_status, review_rejected_reason")
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
Write-Host "REPLACED: src\app\vendor\(protected)\products\[id]\edit\page.tsx" -ForegroundColor Green

$content = @'
import Link from "next/link";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, sale_price_cents, purchases, is_active, review_status")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  const list = products ?? [];
  const totalRevenueCents = list.reduce(
    (sum, p) => sum + (p.sale_price_cents ?? 0) * (p.purchases ?? 0),
    0
  );

  return (
    <div>
      <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "8px" }}>
        Your Products
      </h1>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", maxWidth: "560px" }}>
        Estimated revenue: <strong>${(totalRevenueCents / 100).toFixed(2)}</strong> — based on
        current price × total purchases. This is an estimate, not a precise historical figure,
        since it doesn't account for past price changes or license type.
      </p>

      <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--line)" }}>
        {list.length === 0 && (
          <div style={{ padding: "20px", fontSize: "14px", color: "var(--ink-faded)" }}>
            No products linked to your account yet.
          </div>
        )}
        {list.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid var(--line)",
              fontSize: "14px",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{p.name}</div>
              <div style={{ color: "var(--ink-mute)", fontSize: "12px", marginTop: "2px" }}>
                ${((p.sale_price_cents ?? 0) / 100).toFixed(2)} · {p.purchases ?? 0} purchases ·{" "}
                {p.is_active ? "Active" : "Inactive"}
                {p.review_status === "pending" && (
                  <span style={{ marginLeft: "8px", color: "#8a6d1a", fontWeight: 600 }}>· Pending review</span>
                )}
                {p.review_status === "rejected" && (
                  <span style={{ marginLeft: "8px", color: "#c0392b", fontWeight: 600 }}>· Edit rejected</span>
                )}
              </div>
            </div>
            <Link href={`/vendor/products/${p.id}/edit`} className="btn btn-ghost btn-sm">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\products\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\products\page.tsx" -ForegroundColor Green

Write-Host "`nAll 7 files replaced." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan