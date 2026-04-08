"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin, adminHeaders } from "@/app/admin/AdminContext";
import ImageUploader, { type UIImage } from "./ImageUploader";
import { mockCategories } from "@/lib/mock-data";

export interface AdminProductData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  regular_price: string;
  price_id: string;
  regular_price_id: string;
  seller: string;
  features: string;        // newline-separated
  status: "active" | "coming_soon" | "archived";
  is_featured: boolean;
  thumbnail_url?: string;
  download_file_url?: string;
  attributes?: Record<string, unknown>;
}

// ── Attribute state ───────────────────────────────────────────────────────────

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
  instantDownload: string; // "true" | "false" | ""
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
  price: "", regular_price: "", price_id: "", regular_price_id: "",
  seller: "AI Digital Products", features: "",
  status: "active", is_featured: false,
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
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
  const [showAttrs,    setShowAttrs]    = useState(false);

  const isEdit = !!initial.id;

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
      if (!img.file) {
        // Existing image — keep as-is
        result.push(img);
        continue;
      }
      const fd = new FormData();
      fd.append("file", img.file);
      fd.append("productId", productId);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-key": token },
        body: fd,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const { url } = await res.json();
      result.push({ ...img, url, file: undefined });
    }
    return result;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      // 1 — Save product record
      const payload = {
        name:              form.name,
        slug:              form.slug,
        description:       form.description,
        category:          form.category,
        price:             form.price ? parseFloat(form.price) : null,
        regular_price:     form.regular_price ? parseFloat(form.regular_price) : null,
        price_id:          form.price_id || null,
        regular_price_id:  form.regular_price_id || null,
        seller:            form.seller,
        features:          form.features.split("\n").map(s => s.trim()).filter(Boolean),
        status:            form.status,
        is_featured:       form.is_featured,
        attributes:        buildAttributesPayload(attrs),
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

      // 2 — Upload new images
      setUploading(true);
      const finalImages = await uploadNewImages(productId);
      setUploading(false);

      // 3 — Sync product_images table
      if (finalImages.length > 0) {
        // Delete removed images (images that were in initialImages but not in finalImages)
        const finalIds = new Set(finalImages.filter(i => i.id).map(i => i.id!));
        const removed  = initialImages.filter(i => i.id && !finalIds.has(i.id));
        await Promise.all(
          removed.map(img =>
            fetch(`/api/admin/images/${img.id}`, {
              method: "DELETE",
              headers: adminHeaders(token),
            })
          )
        );

        // Update display_order + is_primary for existing images
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

        // Insert new image rows into product_images via a dedicated endpoint
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

        // Update thumbnail_url on product to the primary (or first) image
        const primary = finalImages.find(i => i.is_primary) ?? finalImages[0];
        if (primary) {
          await fetch(`/api/admin/products/${productId}`, {
            method: "PUT",
            headers: adminHeaders(token),
            body: JSON.stringify({ thumbnail_url: primary.url }),
          });
        }
      }

      // Upload download file if one was selected
      if (downloadFile) {
        const fd = new FormData();
        fd.append("file", downloadFile);
        fd.append("productId", productId);
        const fileRes = await fetch("/api/admin/upload-file", {
          method: "POST",
          headers: { "x-admin-key": token },
          body: fd,
        });
        if (!fileRes.ok) {
          const err = await fileRes.json();
          throw new Error(err.error ?? "File upload failed");
        }
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

      {/* Toast — fixed overlay so it's visible regardless of scroll position */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 20px",
            background: toast.ok ? "#166534" : "#991b1b",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            borderRadius: "4px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            letterSpacing: "0.01em",
            minWidth: "220px",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }}>{toast.ok ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <Field label="Product Name *">
            <input
              style={inputStyle}
              value={form.name}
              onChange={handleNameChange}
              placeholder="e.g. Ultimate Prompt Pack"
              required
            />
          </Field>

          <Field label="Slug *">
            <input
              style={inputStyle}
              value={form.slug}
              onChange={(e) => { setSlugManual(true); set("slug", e.target.value); }}
              placeholder="e.g. ultimate-prompt-pack"
              required
            />
          </Field>

          <Field label="Category *">
            <select
              style={{ ...inputStyle, appearance: "auto" }}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              required
            >
              {mockCategories.map((c) => (
                <option key={c.slug} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Seller">
            <input
              style={inputStyle}
              value={form.seller}
              onChange={(e) => set("seller", e.target.value)}
              placeholder="Seller name"
            />
          </Field>

          <Field label="Status">
            <select
              style={{ ...inputStyle, appearance: "auto" }}
              value={form.status}
              onChange={(e) => set("status", e.target.value as AdminProductData["status"])}
            >
              <option value="active">Active</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="archived">Archived</option>
            </select>
          </Field>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)" }}>Featured product</span>
          </label>

        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <Field label="Sale Price ($) *">
            <input
              style={inputStyle}
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. 9.99"
              required
            />
          </Field>

          <Field label="Regular Price ($) — optional">
            <input
              style={inputStyle}
              type="number"
              step="0.01"
              min="0"
              value={form.regular_price}
              onChange={(e) => set("regular_price", e.target.value)}
              placeholder="e.g. 19.99"
            />
          </Field>

          <Field label="Stripe Sale Price ID">
            <input
              style={inputStyle}
              value={form.price_id}
              onChange={(e) => set("price_id", e.target.value)}
              placeholder="price_xxx"
            />
          </Field>

          <Field label="Stripe Regular Price ID — optional">
            <input
              style={inputStyle}
              value={form.regular_price_id}
              onChange={(e) => set("regular_price_id", e.target.value)}
              placeholder="price_xxx"
            />
          </Field>

        </div>
      </div>

      {/* Full-width fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>

        <Field label="Description *">
          <textarea
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short product description shown on cards and detail page…"
            required
          />
        </Field>

        <Field label="Features — one per line">
          <textarea
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical", fontFamily: "monospace", fontSize: "13px" }}
            value={form.features}
            onChange={(e) => set("features", e.target.value)}
            placeholder={"50 ready-to-use prompts\nInstant download\nCommercial use license"}
          />
        </Field>

        {/* Image upload */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
            Product Images
          </div>
          <ImageUploader images={images} onChange={setImages} uploading={uploading} />
        </div>

        {/* Download file upload */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
            Download File
          </div>
          {initial.download_file_url && !downloadFile && (
            <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              Current: <span style={{ fontFamily: "monospace" }}>{initial.download_file_url.split("/").pop()}</span>
            </div>
          )}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              border: "1px dashed var(--ink-soft)",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--ink-faded)",
            }}
          >
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setDownloadFile(e.target.files?.[0] ?? null)}
            />
            {downloadFile
              ? <><strong style={{ color: "var(--ink)" }}>{downloadFile.name}</strong> — {(downloadFile.size / 1024 / 1024).toFixed(2)} MB</>
              : <>{initial.download_file_url ? "Replace file…" : "Choose file to upload…"}</>
            }
          </label>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--ink-mute)" }}>
            Uploaded to private storage. Customers receive a secure signed URL after purchase.
          </div>
        </div>

      </div>

      {/* ── Attributes ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: "32px", borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
        <button
          type="button"
          onClick={() => setShowAttrs((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "none", border: "none", padding: "0",
            cursor: "pointer", fontSize: "11px", fontWeight: 700,
            color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em",
          }}
        >
          <span style={{ fontSize: "14px", lineHeight: 1 }}>{showAttrs ? "▾" : "▸"}</span>
          Product Attributes
        </button>

        {showAttrs && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "20px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>

              <Field label="Prompts Included">
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={attrs.promptsIncluded}
                  onChange={(e) => setAttrs((a) => ({ ...a, promptsIncluded: e.target.value }))}
                  placeholder="e.g. 50"
                />
              </Field>

              <Field label="License">
                <select
                  style={{ ...inputStyle, appearance: "auto" }}
                  value={attrs.license}
                  onChange={(e) => setAttrs((a) => ({ ...a, license: e.target.value }))}
                >
                  <option value="">— Select —</option>
                  <option value="Personal Use">Personal Use</option>
                  <option value="Commercial Use">Commercial Use</option>
                  <option value="Extended Commercial">Extended Commercial</option>
                </select>
              </Field>

              <Field label="Format">
                <input
                  style={inputStyle}
                  value={attrs.format}
                  onChange={(e) => setAttrs((a) => ({ ...a, format: e.target.value }))}
                  placeholder="e.g. PDF + TXT"
                />
              </Field>

              <Field label="Version">
                <input
                  style={inputStyle}
                  value={attrs.version}
                  onChange={(e) => setAttrs((a) => ({ ...a, version: e.target.value }))}
                  placeholder="e.g. 1.0"
                />
              </Field>

              <Field label="Last Updated">
                <input
                  style={inputStyle}
                  type="date"
                  value={attrs.lastUpdated}
                  onChange={(e) => setAttrs((a) => ({ ...a, lastUpdated: e.target.value }))}
                />
              </Field>

              <Field label="Instant Download">
                <select
                  style={{ ...inputStyle, appearance: "auto" }}
                  value={attrs.instantDownload}
                  onChange={(e) => setAttrs((a) => ({ ...a, instantDownload: e.target.value }))}
                >
                  <option value="">— Select —</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>

              <Field label="Support">
                <select
                  style={{ ...inputStyle, appearance: "auto" }}
                  value={attrs.support}
                  onChange={(e) => setAttrs((a) => ({ ...a, support: e.target.value }))}
                >
                  <option value="">— Select —</option>
                  <option value="Email">Email</option>
                  <option value="Community">Community</option>
                  <option value="None">None</option>
                </select>
              </Field>

              <Field label="Difficulty Level">
                <select
                  style={{ ...inputStyle, appearance: "auto" }}
                  value={attrs.difficultyLevel}
                  onChange={(e) => setAttrs((a) => ({ ...a, difficultyLevel: e.target.value }))}
                >
                  <option value="">— Select —</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </Field>

              <Field label="AI Model">
                <input
                  style={inputStyle}
                  value={attrs.aiModel}
                  onChange={(e) => setAttrs((a) => ({ ...a, aiModel: e.target.value }))}
                  placeholder="e.g. GPT-4, Claude"
                />
              </Field>

              <Field label="Built With">
                <input
                  style={inputStyle}
                  value={attrs.builtWith}
                  onChange={(e) => setAttrs((a) => ({ ...a, builtWith: e.target.value }))}
                  placeholder="e.g. Notion, Airtable"
                />
              </Field>

            </div>

            <Field label="Requirements">
              <input
                style={inputStyle}
                value={attrs.requirements}
                onChange={(e) => setAttrs((a) => ({ ...a, requirements: e.target.value }))}
                placeholder="e.g. Node.js 18+, Python 3"
              />
            </Field>

            {/* Works With — checkboxes */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
                Works With
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {WORKS_WITH_OPTIONS.map((opt) => {
                  const checked = attrs.worksWith.includes(opt);
                  return (
                    <label
                      key={opt}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 12px",
                        border: `1px solid ${checked ? "var(--ink)" : "var(--ink-soft)"}`,
                        background: checked ? "var(--ink)" : "transparent",
                        cursor: "pointer",
                        borderRadius: "2px",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setAttrs((a) => ({
                            ...a,
                            worksWith: checked
                              ? a.worksWith.filter((w) => w !== opt)
                              : [...a.worksWith, opt],
                          }))
                        }
                        style={{ display: "none" }}
                      />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: checked ? "var(--bg)" : "var(--ink-faded)" }}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom attributes */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
                Custom Attributes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {attrs.custom.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      style={{ ...inputStyle, flex: "0 0 180px" }}
                      value={c.key}
                      onChange={(e) => setAttrs((a) => {
                        const custom = [...a.custom];
                        custom[i] = { ...custom[i], key: e.target.value };
                        return { ...a, custom };
                      })}
                      placeholder="Attribute name"
                    />
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={c.value}
                      onChange={(e) => setAttrs((a) => {
                        const custom = [...a.custom];
                        custom[i] = { ...custom[i], value: e.target.value };
                        return { ...a, custom };
                      })}
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => setAttrs((a) => ({ ...a, custom: a.custom.filter((_, j) => j !== i) }))}
                      style={{
                        background: "none", border: "none", padding: "4px 8px",
                        cursor: "pointer", fontSize: "16px", color: "var(--ink-mute)",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setAttrs((a) => ({ ...a, custom: [...a.custom, { key: "", value: "" }] }))}
                  className="btn btn-ghost btn-sm"
                  style={{ alignSelf: "flex-start", marginTop: "4px" }}
                >
                  + Add Custom Attribute
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={saving}
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? (uploading ? "Uploading…" : "Saving…") : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </button>
      </div>

    </form>
  );
}
