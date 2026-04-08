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

        // Upsert new images
        const newImgs = finalImages.filter(i => !i.id);
        for (const [idx, img] of newImgs.entries()) {
          await fetch("/api/admin/images/reorder", {
            method: "PUT",
            headers: adminHeaders(token),
            body: JSON.stringify({
              images: [], // will use insert below
            }),
          });
          // Insert into product_images
          await fetch("/api/admin/products", {
            // We'll hit supabaseAdmin directly via our own route isn't ideal;
            // for simplicity insert via upload results
          });
        }

        // Upsert all images via reorder endpoint (handles display_order + is_primary)
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

      {/* Toast */}
      {toast && (
        <div
          style={{
            padding: "12px 16px",
            background: toast.ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${toast.ok ? "#bbf7d0" : "#fecaca"}`,
            color: toast.ok ? "#166534" : "#991b1b",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "24px",
            borderRadius: "2px",
          }}
        >
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
