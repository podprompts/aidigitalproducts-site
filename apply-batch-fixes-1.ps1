# Fixes mobile overlap (minWidth:0 grid fix), adds Pending/Approved/Rejected
# tabs to the seller applications admin page, adds 'AI Operating System'
# product type, and makes Name required on the seller application form.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
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
        // Preserve existing video_url if no new file selected
        video_url:               form.video_url || null,
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
          {initial.download_file_url && !downloadFile && (
            <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              Current: <span style={{ fontFamily: "monospace" }}>{initial.download_file_url.split("/").pop()}</span>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
            <input type="file" style={{ display: "none" }} onChange={(e) => setDownloadFile(e.target.files?.[0] ?? null)} />
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
          {initial.video_url && !videoFile && (
            <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              Current: <span style={{ fontFamily: "monospace" }}>{initial.video_url.split("/").pop()}</span>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
            <input type="file" accept="video/mp4" style={{ display: "none" }} onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
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
'@
Set-Content -LiteralPath "src\components\admin\ProductForm.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\components\admin\ProductForm.tsx" -ForegroundColor Green

$content = @'
"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Application {
  id: string;
  email: string;
  name: string | null;
  business_name: string | null;
  portfolio_url: string | null;
  product_types: string[] | null;
  message: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

function SellerApplicationsContent() {
  const { token } = useAdmin();
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/seller-applications", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setApplications(d.applications ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleApprove(app: Application) {
    const confirmed = window.confirm(
      `Approve ${app.name ?? app.email}? This creates a real vendor account and emails them a link to set their password.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/approve`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      }
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  function startReject(app: Application) {
    setRejectingId(app.id);
    setRejectReason("");
    setError("");
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectReason("");
  }

  async function submitReject(app: Application) {
    if (!rejectReason.trim()) {
      setError("A rejection reason is required — it's sent directly to the applicant.");
      return;
    }

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/reject`, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      if (data.warning) {
        setNotice(data.warning);
      } else {
        setNotice(`Rejection sent to ${app.email}.`);
      }
      setRejectingId(null);
      setRejectReason("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleResend(app: Application) {
    const confirmed = window.confirm(
      `Send a fresh set-password link to ${app.name ?? app.email}? This replaces any earlier link they may have.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/resend-welcome`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resend");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      } else {
        setNotice(`Sent a fresh link to ${app.email}.`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  const filteredApplications = applications.filter((a) => a.status === activeTab);
  const counts = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid var(--line)" }}>
        {(["pending", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "inherit",
              textTransform: "capitalize",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--ink)" : "2px solid transparent",
              color: activeTab === tab ? "var(--ink)" : "var(--ink-mute)",
              cursor: "pointer",
              marginBottom: "-1px",
            }}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {notice && (
        <p style={{ fontSize: "13px", color: "#166534", marginBottom: "16px", wordBreak: "break-all" }}>{notice}</p>
      )}
      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!loading && filteredApplications.length === 0 && (
          <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No {activeTab} applications.</p>
        )}
        {filteredApplications.map((app) => (
          <div key={app.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>
                  {app.name ?? "(no name given)"} {app.business_name && <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>· {app.business_name}</span>}
                </div>
                <div style={{ fontSize: "13px", color: "var(--ink-faded)" }}>{app.email}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginTop: "4px" }}>
                  Applied {new Date(app.created_at).toLocaleString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px",
                  color: app.status === "approved" ? "#166534" : app.status === "rejected" ? "#c0392b" : "#8a6d1a",
                  background: app.status === "approved" ? "#eaf6ec" : app.status === "rejected" ? "#fdecea" : "#fff8e1",
                }}
              >
                {app.status}
              </span>
            </div>

            {app.product_types && app.product_types.length > 0 && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "8px" }}>
                <strong style={{ color: "var(--ink)" }}>Sells:</strong> {app.product_types.join(", ")}
              </div>
            )}
            {app.portfolio_url && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "8px" }}>
                <strong style={{ color: "var(--ink)" }}>Portfolio:</strong>{" "}
                <a href={app.portfolio_url} target="_blank" rel="noreferrer" style={{ color: "var(--ink)" }}>
                  {app.portfolio_url}
                </a>
              </div>
            )}
            {app.message && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "12px" }}>
                <strong style={{ color: "var(--ink)" }}>Message:</strong> {app.message}
              </div>
            )}
            {app.status === "rejected" && app.rejection_reason && (
              <div style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px", background: "#fdecea", padding: "10px 14px" }}>
                <strong>Rejection reason sent:</strong> {app.rejection_reason}
              </div>
            )}

            {app.status === "pending" && rejectingId !== app.id && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleApprove(app)}
                  disabled={actingId === app.id}
                  className="btn btn-primary btn-sm"
                >
                  {actingId === app.id ? "Working…" : "Approve"}
                </button>
                <button
                  onClick={() => startReject(app)}
                  disabled={actingId === app.id}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#c0392b" }}
                >
                  Reject
                </button>
              </div>
            )}

            {app.status === "pending" && rejectingId === app.id && (
              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Rejection reason — this is emailed directly to the applicant
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. We're not currently accepting products in this category, or your samples didn't meet our quality guidelines. Be specific about what they'd need to change to reapply successfully."
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
                    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
                    resize: "vertical", boxSizing: "border-box", marginBottom: "10px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => submitReject(app)}
                    disabled={actingId === app.id}
                    className="btn btn-primary btn-sm"
                    style={{ background: "#c0392b", borderColor: "#c0392b" }}
                  >
                    {actingId === app.id ? "Sending…" : "Send Rejection"}
                  </button>
                  <button onClick={cancelReject} disabled={actingId === app.id} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {app.status === "approved" && (
              <button
                onClick={() => handleResend(app)}
                disabled={actingId === app.id}
                className="btn btn-ghost btn-sm"
              >
                {actingId === app.id ? "Sending…" : "Resend Welcome Email"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellerApplicationsPage() {
  return (
    <AdminShell title="Seller Applications">
      <SellerApplicationsContent />
    </AdminShell>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\seller-applications\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\seller-applications\page.tsx" -ForegroundColor Green

$content = @'
"use client";

import { useState, FormEvent } from "react";

const PRODUCT_TYPES = [
  "Prompt Packs",
  "AI Templates",
  "AI Operating System",
  "Chatbots / AI Agents",
  "Automation / Workflows",
  "Notion / Docs",
  "Image / Art Packs",
  "Audio / Music",
  "Video / Motion",
  "Courses / Guides",
  "Code / Scripts",
  "Datasets",
  "Other",
];

const MIN_MESSAGE_LENGTH = 30;

type Status = "idle" | "loading" | "success" | "error";

export default function SellerApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  const messageValid = message.trim().length >= MIN_MESSAGE_LENGTH;
  const nameValid = name.trim().length > 0;
  const canSubmit = messageValid && nameValid && agreedToTerms;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nameValid) {
      setErrorMsg("Please enter your name.");
      setStatus("error");
      return;
    }
    if (!messageValid) {
      setErrorMsg(`Please write at least ${MIN_MESSAGE_LENGTH} characters — this is what we use to review your application.`);
      setStatus("error");
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg("You must agree to the Terms of Service to apply.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      email: data.get("email"),
      name: name.trim(),
      business_name: data.get("business_name"),
      portfolio_url: data.get("portfolio_url"),
      product_types: selectedTypes,
      message: message.trim(),
      agreed_to_terms: true,
    };

    try {
      const res = await fetch("/api/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          padding: "56px 40px",
          background: "var(--bg)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--ink-faded)",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            marginBottom: "20px",
          }}
        >
          — Application received —
        </div>
        <h2
          className="display"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", color: "var(--ink)", marginBottom: "16px" }}
        >
          Thanks for applying.
        </h2>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.6 }}>
          We review every application personally and will email you either way — approved or not
          — usually within a few days.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "var(--bg)",
    border: "1px solid var(--ink-mute)",
    color: "var(--ink)",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--ink-faded)",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    marginBottom: "8px",
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Name */}
      <div>
        <label htmlFor="app-name" style={labelStyle}>
          Name <span style={{ color: "var(--ink)" }}>*</span>
        </label>
        <input
          id="app-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={inputStyle}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="app-email" style={labelStyle}>
          Email <span style={{ color: "var(--ink)" }}>*</span>
        </label>
        <input
          id="app-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      {/* Business / Brand */}
      <div>
        <label htmlFor="app-business" style={labelStyle}>Business / Brand name</label>
        <input
          id="app-business"
          name="business_name"
          type="text"
          placeholder="Optional"
          style={inputStyle}
        />
      </div>

      {/* Portfolio / sample link */}
      <div>
        <label htmlFor="app-portfolio" style={labelStyle}>Portfolio or sample link</label>
        <input
          id="app-portfolio"
          name="portfolio_url"
          type="url"
          placeholder="A link to your existing work, shop, or samples (optional, but it helps)"
          style={inputStyle}
        />
      </div>

      {/* Product types */}
      <div>
        <span style={labelStyle}>What will you sell?</span>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          {PRODUCT_TYPES.map((type) => {
            const active = selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                style={{
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  letterSpacing: "0.05em",
                  border: "1px solid var(--ink-mute)",
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink-faded)",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message - now required, min length enforced */}
      <div>
        <label htmlFor="app-message" style={labelStyle}>
          Tell us about yourself and what you plan to sell <span style={{ color: "var(--ink)" }}>*</span>
        </label>
        <textarea
          id="app-message"
          name="message"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your background, what you're planning to list, your audience — anything that helps us review your application."
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <p style={{ fontSize: "11px", color: messageValid ? "var(--ink-mute)" : "#e53e3e", marginTop: "6px" }}>
          {message.trim().length}/{MIN_MESSAGE_LENGTH} characters minimum
        </p>
      </div>

      {/* Terms agreement */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <input
          id="app-agree"
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          style={{ marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, cursor: "pointer" }}
        />
        <label htmlFor="app-agree" style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.5, cursor: "pointer" }}>
          I agree to the{" "}
          <a href="/terms" target="_blank" rel="noreferrer" style={{ color: "var(--ink)", fontWeight: 600 }}>
            Terms of Service
          </a>
          , including the Seller Terms and commission structure. <span style={{ color: "var(--ink)" }}>*</span>
        </label>
      </div>

      {/* Error */}
      {status === "error" && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading" || !canSubmit}
        className="btn btn-primary"
        style={{ alignSelf: "flex-start", opacity: status === "loading" || !canSubmit ? 0.6 : 1 }}
      >
        {status === "loading" ? "Submitting…" : "Apply to Sell"}
      </button>
    </form>
  );
}
'@
Set-Content -LiteralPath "src\components\SellerApplicationForm.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\components\SellerApplicationForm.tsx" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const MIN_MESSAGE_LENGTH = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, business_name, portfolio_url, product_types, message, agreed_to_terms } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Please write at least ${MIN_MESSAGE_LENGTH} characters describing yourself and what you plan to sell` },
        { status: 400 }
      );
    }

    if (agreed_to_terms !== true) {
      return NextResponse.json({ error: "You must agree to the Terms of Service to apply" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("seller_waitlist").insert({
      email: email.trim().toLowerCase(),
      name: name?.trim() ?? null,
      business_name: business_name?.trim() ?? null,
      portfolio_url: portfolio_url?.trim() || null,
      product_types: product_types ?? [],
      message: message.trim(),
      agreed_to_terms_at: new Date().toISOString(),
    });

    if (error) {
      // Unique constraint means they're already on the list
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You've already applied with this email." },
          { status: 409 }
        );
      }
      console.error("[seller-applications] insert error", error);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[seller-applications] unexpected error", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
'@
Set-Content -LiteralPath "src\app\api\seller-applications\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\seller-applications\route.ts" -ForegroundColor Green

Write-Host "`nAll 4 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan