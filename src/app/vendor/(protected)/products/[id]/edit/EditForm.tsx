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
        {saving ? (uploading ? "Uploading…" : "Saving…") : "Save Changes"}
      </button>
    </form>
  );
}