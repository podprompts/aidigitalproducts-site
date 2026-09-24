"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin, adminHeaders } from "@/app/admin/AdminContext";
import ImageUploader, { type UIImage } from "./ImageUploader";
import { mockCategories } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase/client";
 
export interface AdminProductData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  regular_price: string;
  sale_stripe_price_id: string;
  regular_stripe_price_id: string;
  // PLR fields — new
  plr_price: string;
  plr_stripe_price_id: string;
  is_plr_available: boolean;
  vendor_id: string;
  features: string;
  status: "active" | "coming_soon" | "archived";
  is_featured: boolean;
  is_favorite: boolean;
  is_not_ai: boolean;
  thumbnail_url?: string;
  video_url?: string;
  download_file_url?: string;
  attributes?: Record<string, unknown>;
}
 
const WORKS_WITH_OPTIONS = [
  "Midjourney", "DALL-E 3", "Ideogram", "Stable Diffusion",
  "ChatGPT", "Claude", "GPT-4",
];
 
const PREDEFINED_ATTR_KEYS = [
  "promptsIncluded","worksWith","license","format","lastUpdated",
  "version","instantDownload","support","difficultyLevel","builtWith",
  "requirements","aiModel",
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
 
function todayISO() {
  return new Date().toISOString().split("T")[0];
}
 
const DEFAULT_ATTRS: AttributeState = {
  promptsIncluded: "",
  worksWith:       [],
  license:         "Commercial Use",
  format:          "",
  lastUpdated:     todayISO(),
  version:         "1.0",
  instantDownload: "true",
  support:         "",
  difficultyLevel: "",
  builtWith:       "",
  requirements:    "",
  aiModel:         "",
  custom:          [],
};
 
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
  if (attrs.promptsIncluded)            result.promptsIncluded = Number(attrs.promptsIncluded);
  if (attrs.worksWith.length > 0)       result.worksWith = attrs.worksWith;
  if (attrs.license)                    result.license = attrs.license;
  if (attrs.format)                     result.format = attrs.format;
  if (attrs.lastUpdated)                result.lastUpdated = attrs.lastUpdated;
  if (attrs.version)                    result.version = attrs.version;
  if (attrs.instantDownload !== "")     result.instantDownload = attrs.instantDownload === "true";
  if (attrs.support)                    result.support = attrs.support;
  if (attrs.difficultyLevel)            result.difficultyLevel = attrs.difficultyLevel;
  if (attrs.builtWith)                  result.builtWith = attrs.builtWith;
  if (attrs.requirements)               result.requirements = attrs.requirements;
  if (attrs.aiModel)                    result.aiModel = attrs.aiModel;
  for (const c of attrs.custom) {
    if (c.key.trim() && c.value.trim()) result[c.key.trim()] = c.value.trim();
  }
  return result;
}
 
const EMPTY: AdminProductData = {
  name: "", slug: "", description: "", category: mockCategories[0]?.name ?? "",
  price: "", regular_price: "", sale_stripe_price_id: "", regular_stripe_price_id: "",
  plr_price: "", plr_stripe_price_id: "", is_plr_available: false,
  vendor_id: "", features: "",
  status: "active", is_featured: false, is_favorite: false, is_not_ai: false,
  video_url: "",
};
 
interface Props {
  initial?: Partial<AdminProductData>;
  initialImages?: UIImage[];
}
 
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
 
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
      <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {label}
      </label>
      {children}
    </div>
  );

}
 
const inputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--ink-soft)",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--ink)",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  borderRadius: "2px",
};
 
export default function ProductForm({ initial = {}, initialImages = [] }: Props) {
  const { token } = useAdmin();
  const router    = useRouter();
 
  const [form,         setForm]         = useState<AdminProductData>({ ...EMPTY, ...initial });
  const [images,       setImages]       = useState<UIImage[]>(initialImages);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  const [videoFile,    setVideoFile]    = useState<File | null>(null);
  const [removeDownloadFile, setRemoveDownloadFile] = useState(false);
  const [removeVideo,        setRemoveVideo]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [slugManual,   setSlugManual]   = useState(!!initial.slug);
  const [attrs,        setAttrs]        = useState<AttributeState>(() =>
    initial.attributes && Object.keys(initial.attributes).length > 0
      ? attrsFromRecord(initial.attributes)
      : initial.id ? { ...DEFAULT_ATTRS, instantDownload: "", license: "", version: "", lastUpdated: "" }
      : DEFAULT_ATTRS
  );
  const [showAttrs, setShowAttrs] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; display_name: string }[]>([]);

  const isEdit = !!initial.id;

  useEffect(() => {
    fetch("/api/admin/vendors", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((data) => {
        const list = data.vendors ?? [];
        setVendors(list);
        // Default new products to the first (currently only) vendor
        if (!isEdit && !initial.vendor_id && list.length > 0) {
          setForm((prev) => (prev.vendor_id ? prev : { ...prev, vendor_id: list[0].id }));
        }
      })
      .catch(() => setVendors([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  function set(key: keyof AdminProductData, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
 
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    set("name", name);
    if (!slugManual) set("slug", slugify(name));
  }
 
  async function uploadNewImages(productId: string): Promise<UIImage[]> {
    const result: UIImage[] = [];
    for (const img of images) {
      if (!img.file) { result.push(img); continue; }

      // Step 1: get a short-lived presigned URL to upload directly to R2
      const presignRes = await fetch("/api/admin/images/presign", {
        method: "POST",
        headers: adminHeaders(token),
        body: JSON.stringify({ productId, fileName: img.file.name, contentType: img.file.type }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to get upload URL");
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      // Step 2: upload the actual image bytes directly to R2 — this
      // bypasses Vercel's serverless function body-size limit entirely,
      // the same fix already applied to video uploads below.
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

  async function uploadDownloadFile(productId: string): Promise<void> {
    if (!downloadFile) return;

    // Step 1: get a Supabase signed upload URL/token
    const presignRes = await fetch("/api/admin/upload-file/presign", {
      method: "POST",
      headers: adminHeaders(token),
      body: JSON.stringify({ productId, fileName: downloadFile.name }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to get upload URL");
    }
    const { token: uploadToken, path } = await presignRes.json();

    // Step 2: upload the actual file bytes directly to Supabase Storage —
    // this bypasses Vercel's serverless function body-size limit entirely,
    // the same fix applied to video uploads. Supabase's signed-upload flow
    // requires this specific SDK method (not a plain PUT) to set up the
    // request correctly.
    const { error: uploadError } = await supabase.storage
      .from("product-files")
      .uploadToSignedUrl(path, uploadToken, downloadFile);
    if (uploadError) throw new Error(uploadError.message ?? "File upload to storage failed");

    // Step 3: confirm — stamp download_url onto the product row
    const confirmRes = await fetch("/api/admin/upload-file", {
      method: "POST",
      headers: adminHeaders(token),
      body: JSON.stringify({ productId, path }),
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to save file URL");
    }
  }

  async function uploadVideo(productId: string): Promise<void> {
    if (!videoFile) return;

    // Step 1: get a short-lived presigned URL to upload directly to R2
    const presignRes = await fetch("/api/admin/upload-video/presign", {
      method: "POST",
      headers: adminHeaders(token),
      body: JSON.stringify({ productId, fileName: videoFile.name }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to get upload URL");
    }
    const { uploadUrl, publicUrl } = await presignRes.json();

    // Step 2: upload the actual video bytes directly to R2 — this bypasses
    // Vercel's serverless function body-size limit entirely, since the file
    // never passes through our own server.
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: videoFile,
    });
    if (!uploadRes.ok) throw new Error("Video upload to storage failed");

    // Step 3: confirm — stamp video_url onto the product row
    const confirmRes = await fetch("/api/admin/upload-video", {
      method: "POST",
      headers: adminHeaders(token),
      body: JSON.stringify({ productId, publicUrl }),
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to save video URL");
    }
  }
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      const payload = {
        name:                    form.name,
        slug:                    form.slug,
        description:             form.description,
        category:                form.category,
        features:                form.features.split("\n").map(s => s.trim()).filter(Boolean),
        sale_price_cents:        form.price ? Math.round(parseFloat(form.price) * 100) : null,
        regular_price_cents:     form.regular_price ? Math.round(parseFloat(form.regular_price) * 100) : null,
        sale_stripe_price_id:    form.sale_stripe_price_id || null,
        regular_stripe_price_id: form.regular_stripe_price_id || null,
        // PLR fields — new
        plr_price_cents:         form.plr_price ? Math.round(parseFloat(form.plr_price) * 100) : null,
        plr_stripe_price_id:     form.plr_stripe_price_id || null,
        is_plr_available:        form.is_plr_available,
        vendor_id:               form.vendor_id || null,
        is_active:               form.status === "active",
        is_featured:             form.is_featured,
        is_favorite:             form.is_favorite,
        is_not_ai:               form.is_not_ai,
        attributes:              buildAttributesPayload(attrs),
        // Preserve existing video_url unless a new file was picked or it was removed
        video_url:               removeVideo ? null : (form.video_url || null),
        // Preserve existing download_file_url unless a new file was picked or it was removed
        download_url:            removeDownloadFile ? null : (initial.download_file_url || undefined),
      };
 
      const productRes = await fetch(
        isEdit ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: isEdit ? "PUT" : "POST",
          headers: adminHeaders(token),
          body: JSON.stringify(payload),
        }
      );
      if (!productRes.ok) {
        const err = await productRes.json();
        throw new Error(err.error ?? "Failed to save product");
      }
      const { product } = await productRes.json();
      const productId: string = product.id;
 
      setUploading(true);

      // Upload images
      const finalImages = await uploadNewImages(productId);

      // Upload video if selected — route stamps video_url on the DB row automatically
      if (videoFile) await uploadVideo(productId);

      setUploading(false);
 
      // Sync product_images table
      if (finalImages.length > 0) {
        const finalIds = new Set(finalImages.filter(i => i.id).map(i => i.id!));
        const removed  = initialImages.filter(i => i.id && !finalIds.has(i.id));
        await Promise.all(
          removed.map(img =>
            fetch(`/api/admin/images/${img.id}`, { method: "DELETE", headers: adminHeaders(token) })
          )
        );
 
        const existingToUpdate = finalImages.filter(i => i.id);
        if (existingToUpdate.length > 0) {
          await fetch("/api/admin/images/reorder", {
            method: "PUT",
            headers: adminHeaders(token),
            body: JSON.stringify({
              images: existingToUpdate.map(img => ({
                id: img.id,
                display_order: img.display_order,
                is_primary: img.is_primary,
              })),
            }),
          });
        }
 
        for (const img of finalImages.filter(i => !i.id)) {
          await fetch("/api/admin/images/insert", {
            method: "POST",
            headers: adminHeaders(token),
            body: JSON.stringify({
              product_id:    productId,
              url:           img.url,
              is_primary:    img.is_primary,
              display_order: img.display_order,
            }),
          });
        }
 
        const primary = finalImages.find(i => i.is_primary) ?? finalImages[0];
        if (primary) {
          await fetch(`/api/admin/products/${productId}`, {
            method: "PUT",
            headers: adminHeaders(token),
            body: JSON.stringify({ thumbnail_url: primary.url }),
          });
        }
      }
 
      // Upload download file — direct to storage, bypassing Vercel's body-size limit
      if (downloadFile) {
        await uploadDownloadFile(productId);
      }
 
      setToast({ msg: isEdit ? "Product updated!" : "Product created!", ok: true });
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (err) {
      setToast({ msg: (err as Error).message ?? "Something went wrong.", ok: false });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }
 
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0", maxWidth: "860px" }}>
 
      {toast && (
        <div style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 9999,
          display: "flex", alignItems: "center", gap: "10px",
          padding: "14px 20px",
          background: toast.ok ? "#166534" : "#991b1b",
          color: "#fff", fontSize: "13px", fontWeight: 700, borderRadius: "4px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)", letterSpacing: "0.01em",
          minWidth: "220px", pointerEvents: "none",
        }}>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>{toast.ok ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}
 
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Field label="Product Name *">
            <input style={inputStyle} value={form.name} onChange={handleNameChange} placeholder="e.g. Ultimate Prompt Pack" required />
          </Field>
          <Field label="Slug *">
            <input style={inputStyle} value={form.slug} onChange={(e) => { setSlugManual(true); set("slug", slugify(e.target.value)); }} placeholder="e.g. ultimate-prompt-pack" required />
          </Field>
          <Field label="Category *">
            <select style={{ ...inputStyle, appearance: "auto" }} value={form.category} onChange={(e) => set("category", e.target.value)} required>
              {mockCategories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Vendor">
            <select
              style={{ ...inputStyle, appearance: "auto" }}
              value={form.vendor_id}
              onChange={(e) => set("vendor_id", e.target.value)}
            >
              <option value="">— No vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.display_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select style={{ ...inputStyle, appearance: "auto" }} value={form.status} onChange={(e) => set("status", e.target.value as AdminProductData["status"])}>
              <option value="active">Active</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)" }}>Featured product</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_favorite} onChange={(e) => set("is_favorite", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)" }}>Favorite product</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_not_ai} onChange={(e) => set("is_not_ai", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)" }}>Not an AI product</span>
          </label>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Field label="Sale Price ($)">
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 9.99" />
          </Field>
          <Field label="Regular Price ($) — optional">
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.regular_price} onChange={(e) => set("regular_price", e.target.value)} placeholder="e.g. 19.99" />
          </Field>
          <Field label="Stripe Sale Price ID">
            <input style={inputStyle} value={form.sale_stripe_price_id} onChange={(e) => set("sale_stripe_price_id", e.target.value)} placeholder="price_xxx" />
          </Field>
          <Field label="Stripe Regular Price ID — optional">
            <input style={inputStyle} value={form.regular_stripe_price_id} onChange={(e) => set("regular_stripe_price_id", e.target.value)} placeholder="price_xxx" />
          </Field>
        </div>
      </div>

      {/* PLR licensing — new section */}
      <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>
          PLR Licensing
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "20px" }}>
          <input
            type="checkbox"
            checked={form.is_plr_available}
            onChange={(e) => set("is_plr_available", e.target.checked)}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)" }}>
            Offer a PLR (resale) license for this product
          </span>
        </label>

        {form.is_plr_available && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            <Field label="PLR Price ($)">
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                min="0"
                value={form.plr_price}
                onChange={(e) => set("plr_price", e.target.value)}
                placeholder="e.g. 97.00"
              />
            </Field>
            <Field label="Stripe PLR Price ID">
              <input
                style={inputStyle}
                value={form.plr_stripe_price_id}
                onChange={(e) => set("plr_stripe_price_id", e.target.value)}
                placeholder="price_xxx"
              />
            </Field>
          </div>
        )}
      </div>
 
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
        <Field label="Description *">
          <textarea style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short product description shown on cards and detail page…" required />
        </Field>
        <Field label="Features — one per line">
          <textarea style={{ ...inputStyle, minHeight: "120px", resize: "vertical", fontFamily: "monospace", fontSize: "13px" }} value={form.features} onChange={(e) => set("features", e.target.value)} placeholder={"50 ready-to-use prompts\nInstant download\nCommercial use license"} />
        </Field>

        {/* Image upload */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Product Images</div>
          <ImageUploader images={images} onChange={setImages} uploading={uploading} />
        </div>

        {/* Download file */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Download File</div>
{initial.download_file_url && !downloadFile && !removeDownloadFile && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--ink-faded)" }}>
                Current: <span style={{ fontFamily: "monospace" }}>{initial.download_file_url.split("/").pop()}</span>
              </div>
              <button
                type="button"
                onClick={() => setRemoveDownloadFile(true)}
                aria-label="Remove download file"
                style={{ background: "none", border: "1px solid var(--ink-soft)", borderRadius: "2px", width: "22px", height: "22px", cursor: "pointer", fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1, flexShrink: 0 }}
              >
                x
              </button>
            </div>
          )}
          {removeDownloadFile && !downloadFile && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              <div style={{ flex: 1, fontSize: "12px", color: "var(--ink-faded)" }}>Will be removed on save.</div>
              <button
                type="button"
                onClick={() => setRemoveDownloadFile(false)}
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0 }}
              >
                Undo
              </button>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
            <input type="file" style={{ display: "none" }} onChange={(e) => { setDownloadFile(e.target.files?.[0] ?? null); setRemoveDownloadFile(false); }} />
            {downloadFile
              ? <><strong style={{ color: "var(--ink)" }}>{downloadFile.name}</strong> — {(downloadFile.size / 1024 / 1024).toFixed(2)} MB</>
              : <>{initial.download_file_url ? "Replace file…" : "Choose file to upload…"}</>
            }
          </label>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--ink-mute)" }}>Uploaded to private storage. Customers receive a secure signed URL after purchase.</div>
        </div>

        {/* Video upload */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Preview Video — optional (.mp4)</div>
{initial.video_url && !videoFile && !removeVideo && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--ink-faded)" }}>
                Current: <span style={{ fontFamily: "monospace" }}>{initial.video_url.split("/").pop()}</span>
              </div>
              <button
                type="button"
                onClick={() => setRemoveVideo(true)}
                aria-label="Remove preview video"
                style={{ background: "none", border: "1px solid var(--ink-soft)", borderRadius: "2px", width: "22px", height: "22px", cursor: "pointer", fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1, flexShrink: 0 }}
              >
                x
              </button>
            </div>
          )}
          {removeVideo && !videoFile && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              <div style={{ flex: 1, fontSize: "12px", color: "var(--ink-faded)" }}>Will be removed on save.</div>
              <button
                type="button"
                onClick={() => setRemoveVideo(false)}
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0 }}
              >
                Undo
              </button>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
            <input type="file" accept="video/mp4" style={{ display: "none" }} onChange={(e) => { setVideoFile(e.target.files?.[0] ?? null); setRemoveVideo(false); }} />
            {videoFile
              ? <><strong style={{ color: "var(--ink)" }}>{videoFile.name}</strong> — {(videoFile.size / 1024 / 1024).toFixed(2)} MB</>
              : <>{initial.video_url ? "Replace video…" : "Choose .mp4 to upload…"}</>
            }
          </label>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--ink-mute)" }}>Plays silently on hover over product cards. Uploaded to public storage automatically.</div>
        </div>
      </div>
 
      {/* Attributes */}
      <div style={{ marginTop: "32px", borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
        <button type="button" onClick={() => setShowAttrs((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: "0", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          <span style={{ fontSize: "14px", lineHeight: 1 }}>{showAttrs ? "▾" : "▸"}</span>
          Product Attributes
        </button>
 
        {showAttrs && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
              <Field label="Prompts Included">
                <input style={inputStyle} type="number" min="0" value={attrs.promptsIncluded} onChange={(e) => setAttrs((a) => ({ ...a, promptsIncluded: e.target.value }))} placeholder="e.g. 50" />
              </Field>
              <Field label="License">
                <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.license} onChange={(e) => setAttrs((a) => ({ ...a, license: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="Personal Use">Personal Use</option>
                  <option value="Commercial Use">Commercial Use</option>
                  <option value="Extended Commercial">Extended Commercial</option>
                </select>
              </Field>
              <Field label="Format">
                <input style={inputStyle} value={attrs.format} onChange={(e) => setAttrs((a) => ({ ...a, format: e.target.value }))} placeholder="e.g. PDF + TXT" />
              </Field>
              <Field label="Version">
                <input style={inputStyle} value={attrs.version} onChange={(e) => setAttrs((a) => ({ ...a, version: e.target.value }))} placeholder="e.g. 1.0" />
              </Field>
              <Field label="Last Updated">
                <input style={{ ...inputStyle, minWidth: 0 }} type="date" value={attrs.lastUpdated} onChange={(e) => setAttrs((a) => ({ ...a, lastUpdated: e.target.value }))} />
              </Field>
              <Field label="Instant Download">
                <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.instantDownload} onChange={(e) => setAttrs((a) => ({ ...a, instantDownload: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
              <Field label="Support">
                <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.support} onChange={(e) => setAttrs((a) => ({ ...a, support: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="Email">Email</option>
                  <option value="Community">Community</option>
                  <option value="None">None</option>
                </select>
              </Field>
              <Field label="Difficulty Level">
                <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.difficultyLevel} onChange={(e) => setAttrs((a) => ({ ...a, difficultyLevel: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </Field>
              <Field label="AI Model">
                <input style={inputStyle} value={attrs.aiModel} onChange={(e) => setAttrs((a) => ({ ...a, aiModel: e.target.value }))} placeholder="e.g. GPT-4, Claude" />
              </Field>
              <Field label="Built With">
                <input style={inputStyle} value={attrs.builtWith} onChange={(e) => setAttrs((a) => ({ ...a, builtWith: e.target.value }))} placeholder="e.g. Notion, Airtable" />
              </Field>
            </div>
            <Field label="Requirements">
              <input style={inputStyle} value={attrs.requirements} onChange={(e) => setAttrs((a) => ({ ...a, requirements: e.target.value }))} placeholder="e.g. Node.js 18+, Python 3" />
            </Field>

            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Works With</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {WORKS_WITH_OPTIONS.map((opt) => {
                  const checked = attrs.worksWith.includes(opt);
                  return (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: `1px solid ${checked ? "var(--ink)" : "var(--ink-soft)"}`, background: checked ? "var(--ink)" : "transparent", cursor: "pointer", borderRadius: "2px", userSelect: "none" }}>
                      <input type="checkbox" checked={checked} onChange={() => setAttrs((a) => ({ ...a, worksWith: checked ? a.worksWith.filter((w) => w !== opt) : [...a.worksWith, opt] }))} style={{ display: "none" }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: checked ? "var(--bg)" : "var(--ink-faded)" }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Custom Attributes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {attrs.custom.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input style={{ ...inputStyle, flex: "0 0 180px" }} value={c.key} onChange={(e) => setAttrs((a) => { const custom = [...a.custom]; custom[i] = { ...custom[i], key: e.target.value }; return { ...a, custom }; })} placeholder="Attribute name" />
                    <input style={{ ...inputStyle, flex: 1 }} value={c.value} onChange={(e) => setAttrs((a) => { const custom = [...a.custom]; custom[i] = { ...custom[i], value: e.target.value }; return { ...a, custom }; })} placeholder="Value" />
                    <button type="button" onClick={() => setAttrs((a) => ({ ...a, custom: a.custom.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: "16px", color: "var(--ink-mute)", lineHeight: 1 }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={() => setAttrs((a) => ({ ...a, custom: [...a.custom, { key: "", value: "" }] }))} className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginTop: "4px" }}>+ Add Custom Attribute</button>
              </div>
            </div>
          </div>
        )}
      </div>
 
      <div style={{ display: "flex", gap: "12px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? (uploading ? "Uploading…" : "Saving…") : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push("/admin/products")}>Cancel</button>
      </div>
    </form>
  );
}