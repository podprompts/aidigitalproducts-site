# Fixes: vendor form only submits genuinely-changed fields, and the admin
# diff view now compares actual values (video/file/images) plus does a real
# per-attribute diff instead of a generic 'Updated' placeholder.
# Run from the root of your aidigitalproducts-site repo.

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
      // Build the submission from scratch, including ONLY fields that
      // actually differ from the original — never send an unchanged field
      // just because the form happens to hold its current value. This is
      // what keeps the admin's review screen honest about what really
      // changed, and keeps pending_changes free of noise.
      const payload: Record<string, unknown> = {};

      if (name !== product.name) payload.name = name;
      if (slug !== product.slug) payload.slug = slug;
      if (category !== (product.category ?? "")) payload.category = category;
      if (description !== (product.description ?? "")) payload.description = description;

      const newFeatures = features.split("\n").map((f) => f.trim()).filter(Boolean);
      if (JSON.stringify(newFeatures) !== JSON.stringify(product.features ?? [])) {
        payload.features = newFeatures;
      }

      const newSalePrice = price ? Math.round(parseFloat(price) * 100) : null;
      if (newSalePrice !== product.sale_price_cents) payload.sale_price_cents = newSalePrice;

      const newRegularPrice = regularPrice ? Math.round(parseFloat(regularPrice) * 100) : null;
      if (newRegularPrice !== product.regular_price_cents) payload.regular_price_cents = newRegularPrice;

      if (isActive !== product.is_active) payload.is_active = isActive;
      if (isPlrAvailable !== (product.is_plr_available ?? false)) payload.is_plr_available = isPlrAvailable;

      const newPlrPrice = isPlrAvailable && plrPrice ? Math.round(parseFloat(plrPrice) * 100) : null;
      if (newPlrPrice !== product.plr_price_cents) payload.plr_price_cents = newPlrPrice;

      const newAttributes = buildAttributesPayload(attrs);
      if (JSON.stringify(newAttributes) !== JSON.stringify(product.attributes ?? {})) {
        payload.attributes = newAttributes;
      }

      // Upload any new files to storage first — this does NOT make them
      // live. Nothing becomes visible on the site until an admin approves
      // the submission this builds up. Only touched at all if the vendor
      // actually selected something new.
      setUploading(true);
      if (videoFile) {
        payload.video_url = await getVideoUrl();
      }
      if (downloadFile) {
        payload.download_url = await getDownloadUrl();
      }

      const finalImages = await buildFinalImages();
      const originalImages = initialImages.map((img) => ({
        url: img.url,
        is_primary: img.is_primary,
        display_order: img.display_order,
      }));
      if (JSON.stringify(finalImages) !== JSON.stringify(originalImages)) {
        payload.images = finalImages;
      }
      setUploading(false);

      if (Object.keys(payload).length === 0) {
        setToast({ msg: "No changes to submit.", ok: false });
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, video_url, download_url, attributes, vendor_id, pending_changes, review_status, review_submitted_at"
    )
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

  // Current live images, for comparing against each submission's proposed set
  const productIds = (products ?? []).map((p) => p.id);
  let currentImagesByProduct: Record<string, { url: string; is_primary: boolean }[]> = {};
  if (productIds.length > 0) {
    const { data: images } = await supabaseAdmin
      .from("product_images")
      .select("product_id, url, is_primary, display_order")
      .in("product_id", productIds)
      .order("display_order", { ascending: true });
    currentImagesByProduct = (images ?? []).reduce((acc, img) => {
      (acc[img.product_id] ??= []).push({ url: img.url, is_primary: img.is_primary });
      return acc;
    }, {} as Record<string, { url: string; is_primary: boolean }[]>);
  }

  const enriched = (products ?? []).map((p) => ({
    ...p,
    vendor_name: p.vendor_id ? vendorMap[p.vendor_id] ?? "Unknown vendor" : "—",
    current_images: currentImagesByProduct[p.id] ?? [],
  }));

  return NextResponse.json({ products: enriched });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\pending\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\admin\products\pending\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useState, useEffect, useContext } from "react";
import AdminShell from "../AdminShell";
import { AdminContext } from "../AdminContext";

interface PendingProduct {
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
  vendor_name: string;
  pending_changes: Record<string, unknown>;
  review_submitted_at: string;
  current_images: { url: string; is_primary: boolean }[];
}

function formatPrice(cents: unknown): string {
  return typeof cents === "number" ? `$${(cents / 100).toFixed(2)}` : "—";
}

function formatBool(v: unknown): string {
  return v ? "Yes" : "No";
}

const ATTR_LABELS: Record<string, string> = {
  promptsIncluded: "Prompts Included",
  worksWith: "Works With",
  license: "License",
  format: "Format",
  lastUpdated: "Last Updated",
  version: "Version",
  instantDownload: "Instant Download",
  support: "Support",
  difficultyLevel: "Difficulty Level",
  builtWith: "Built With",
  requirements: "Requirements",
  aiModel: "AI Model",
};

function formatAttrValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

interface FieldDiff {
  label: string;
  oldValue: string;
  newValue: string;
}

/** Real per-key diff of the attributes object, not a generic placeholder — this
 * is what actually surfaces something like "License: Commercial Use → Personal Use". */
function buildAttributeDiffs(current: Record<string, unknown> | null, pending: Record<string, unknown>): FieldDiff[] {
  const cur = current ?? {};
  const diffs: FieldDiff[] = [];
  const keys = new Set([...Object.keys(cur), ...Object.keys(pending)]);
  for (const key of keys) {
    const oldStr = formatAttrValue(cur[key]);
    const newStr = formatAttrValue(pending[key]);
    if (oldStr !== newStr) {
      diffs.push({ label: ATTR_LABELS[key] ?? key, oldValue: oldStr, newValue: newStr });
    }
  }
  return diffs;
}

/** Only returns fields the vendor actually touched AND that genuinely changed
 * in value — presence alone in pending_changes is not enough, since a
 * submission may include a field that happens to match the current value. */
function buildDiffs(p: PendingProduct): FieldDiff[] {
  const pending = p.pending_changes || {};
  const diffs: FieldDiff[] = [];

  const push = (label: string, oldValue: string, newValue: string) => {
    if (oldValue !== newValue) diffs.push({ label, oldValue, newValue });
  };

  if ("name" in pending) push("Name", p.name ?? "—", String(pending.name ?? "—"));
  if ("slug" in pending) push("Slug", p.slug ?? "—", String(pending.slug ?? "—"));
  if ("category" in pending) push("Category", p.category ?? "—", String(pending.category ?? "—"));
  if ("description" in pending) push("Description", p.description ?? "—", String(pending.description ?? "—"));
  if ("features" in pending) {
    push("Features", (p.features ?? []).join(", ") || "—", ((pending.features as string[]) ?? []).join(", ") || "—");
  }
  if ("sale_price_cents" in pending) push("Sale Price", formatPrice(p.sale_price_cents), formatPrice(pending.sale_price_cents));
  if ("regular_price_cents" in pending) push("Regular Price", formatPrice(p.regular_price_cents), formatPrice(pending.regular_price_cents));
  if ("plr_price_cents" in pending) push("PLR Price", formatPrice(p.plr_price_cents), formatPrice(pending.plr_price_cents));
  if ("is_active" in pending) push("Active", formatBool(p.is_active), formatBool(pending.is_active));
  if ("is_plr_available" in pending) push("PLR Available", formatBool(p.is_plr_available), formatBool(pending.is_plr_available));

  // Compare the actual URL, not just presence — an unchanged submission
  // shouldn't be reported as "New video uploaded" just because video_url
  // was included in the payload.
  if ("video_url" in pending && pending.video_url !== p.video_url) {
    push("Preview Video", p.video_url ? "Has a video" : "No video", "New video uploaded");
  }
  if ("download_url" in pending && pending.download_url !== p.download_url) {
    push("Download File", p.download_url ? "Has a file" : "No file", "New file uploaded");
  }

  if ("attributes" in pending && pending.attributes && typeof pending.attributes === "object") {
    diffs.push(...buildAttributeDiffs(p.attributes, pending.attributes as Record<string, unknown>));
  }

  return diffs;
}

/** Compares the actual proposed image set against the current one — not
 * just whether "images" happens to be present in pending_changes. */
function imagesChanged(p: PendingProduct): boolean {
  const pending = p.pending_changes || {};
  if (!("images" in pending)) return false;
  const proposed = (pending.images as { url: string; is_primary?: boolean }[]) ?? [];
  const current = p.current_images ?? [];
  if (proposed.length !== current.length) return true;
  for (let i = 0; i < proposed.length; i++) {
    if (proposed[i].url !== current[i].url || !!proposed[i].is_primary !== !!current[i].is_primary) return true;
  }
  return false;
}

export default function PendingReviewsPage() {
  return (
    <AdminShell title="Pending Reviews">
      <PendingReviewsContent />
    </AdminShell>
  );
}

function PendingReviewsContent() {
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
    <>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", maxWidth: "640px" }}>
        Vendor edits wait here until approved. The live site keeps showing each product&apos;s
        previously approved version until you act on its submission — approving or rejecting
        never causes a listing to disappear.
      </p>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      {loading && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Loading…</p>}

      {!loading && !error && products.length === 0 && (
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

            {(() => {
              const diffs = buildDiffs(p);
              const proposedImages = (p.pending_changes?.images as { url: string; is_primary?: boolean }[]) ?? [];

              return (
                <div style={{ marginBottom: "16px" }}>
                  {diffs.length === 0 && !imagesChanged(p) && (
                    <p style={{ fontSize: "13px", color: "var(--ink-mute)" }}>No visible field changes detected.</p>
                  )}

                  {diffs.length > 0 && (
                    <div style={{ border: "1px solid var(--line)" }}>
                      {diffs.map((d, i) => (
                        <div
                          key={d.label}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "140px 1fr 24px 1fr",
                            gap: "12px",
                            alignItems: "start",
                            padding: "10px 14px",
                            borderBottom: i < diffs.length - 1 ? "1px solid var(--line)" : "none",
                            fontSize: "13px",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "var(--ink)" }}>{d.label}</div>
                          <div style={{ color: "var(--ink-mute)", textDecoration: "line-through" }}>{d.oldValue}</div>
                          <div style={{ color: "var(--ink-mute)", textAlign: "center" }}>→</div>
                          <div style={{ color: "#166534", fontWeight: 600 }}>{d.newValue}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {imagesChanged(p) && (
                    <div style={{ marginTop: diffs.length > 0 ? "16px" : 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                        Images
                      </div>
                      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "var(--ink-mute)", marginBottom: "6px" }}>Current ({p.current_images.length})</div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {p.current_images.length === 0 && <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>None</span>}
                            {p.current_images.map((img, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={img.url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", border: img.is_primary ? "2px solid var(--ink)" : "1px solid var(--line)" }} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "#166534", marginBottom: "6px" }}>Proposed ({proposedImages.length})</div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {proposedImages.length === 0 && <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>None</span>}
                            {proposedImages.map((img, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={img.url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", border: img.is_primary ? "2px solid #166534" : "1px solid var(--line)" }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
    </>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\pending-reviews\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\pending-reviews\page.tsx" -ForegroundColor Green

Write-Host "`nAll 3 files replaced." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan