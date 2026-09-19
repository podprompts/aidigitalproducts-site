# Per-line-item approval: each changed field is now independently
# checkable, instead of one all-or-nothing Approve/Reject decision.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { syncStripePrice } from "@/lib/stripe-price-sync";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Applies a vendor submission field by field. Each entry in pending_changes
 * (and each individual key inside pending_changes.attributes) is its own
 * independently approvable "path" — e.g. "sale_price_cents", "images", or
 * "attributes.license". Only paths listed in approvedPaths actually get
 * written; anything else in the submission is discarded. This is what lets
 * an admin approve 3 of 5 requested changes and decline the other 2 in one
 * action, rather than an all-or-nothing decision.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  let body: { approvedPaths?: string[]; rejectedPaths?: string[]; reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const approvedPaths = new Set(body.approvedPaths ?? []);
  const rejectedPaths = body.rejectedPaths ?? [];

  const { data: product, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.review_status !== "pending" || !product.pending_changes) {
    return NextResponse.json(
      { error: "This product has no pending submission to review" },
      { status: 400 }
    );
  }

  const pending = product.pending_changes as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  // Plain fields — applied only if their exact path was approved
  const plainFields = [
    "name", "slug", "category", "description", "features",
    "is_active", "is_plr_available", "video_url", "download_url",
  ];
  for (const field of plainFields) {
    if (field in pending && approvedPaths.has(field)) {
      updates[field] = pending[field];
    }
  }

  // Attributes — merge ONLY the approved individual keys on top of the
  // current live attributes. A rejected attribute key simply keeps its
  // existing value, while an approved one nearby still goes through.
  if ("attributes" in pending && pending.attributes && typeof pending.attributes === "object") {
    const pendingAttrs = pending.attributes as Record<string, unknown>;
    const currentAttrs = (product.attributes as Record<string, unknown>) ?? {};
    const mergedAttrs = { ...currentAttrs };
    let anyAttrApproved = false;
    for (const key of Object.keys(pendingAttrs)) {
      if (approvedPaths.has(`attributes.${key}`)) {
        mergedAttrs[key] = pendingAttrs[key];
        anyAttrApproved = true;
      }
    }
    if (anyAttrApproved) updates.attributes = mergedAttrs;
  }

  // Price fields — Stripe sync only runs for a field that was actually approved
  try {
    if ("sale_price_cents" in pending && approvedPaths.has("sale_price_cents")) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.sale_price_cents as number | null,
        currentPriceCents: product.sale_price_cents,
        currentStripePriceId: product.sale_stripe_price_id,
      });
      updates.sale_price_cents = synced.priceCents;
      updates.sale_stripe_price_id = synced.stripePriceId;
    }
    if ("regular_price_cents" in pending && approvedPaths.has("regular_price_cents")) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.regular_price_cents as number | null,
        currentPriceCents: product.regular_price_cents,
        currentStripePriceId: product.regular_stripe_price_id,
      });
      updates.regular_price_cents = synced.priceCents;
      updates.regular_stripe_price_id = synced.stripePriceId;
    }
    if ("plr_price_cents" in pending && approvedPaths.has("plr_price_cents")) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.plr_price_cents as number | null,
        currentPriceCents: product.plr_price_cents,
        currentStripePriceId: product.plr_stripe_price_id,
      });
      updates.plr_price_cents = synced.priceCents;
      updates.plr_stripe_price_id = synced.stripePriceId;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to sync price with Stripe: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 502 }
    );
  }

  // Images — one all-or-nothing line item, applied only if "images" itself was approved
  if ("images" in pending && approvedPaths.has("images")) {
    const images = (pending.images as { url: string; is_primary?: boolean; display_order?: number }[]) ?? [];
    await supabaseAdmin.from("product_images").delete().eq("product_id", id);
    if (images.length > 0) {
      await supabaseAdmin.from("product_images").insert(
        images.map((img, i) => ({
          product_id: id,
          url: img.url,
          is_primary: !!img.is_primary,
          display_order: img.display_order ?? i,
        }))
      );
      const primary = images.find((img) => img.is_primary) ?? images[0];
      updates.thumbnail_url = primary.url;
    } else {
      updates.thumbnail_url = null;
    }
  }

  const admin = await getAdminUser(req);

  updates.pending_changes = null;
  updates.review_status = rejectedPaths.length > 0 ? "rejected" : "none";
  updates.review_rejected_reason =
    rejectedPaths.length > 0 ? (body.reason || `Not approved: ${rejectedPaths.join(", ")}`) : null;
  updates.reviewed_by = admin?.sub ?? null;
  updates.reviewed_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ product: updated });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\[id]\approve\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\admin\products\[id]\approve\route.ts" -ForegroundColor Green

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
  path: string;
  label: string;
  oldValue: string;
  newValue: string;
}

function buildAttributeDiffs(current: Record<string, unknown> | null, pending: Record<string, unknown>): FieldDiff[] {
  const cur = current ?? {};
  const diffs: FieldDiff[] = [];
  const keys = new Set([...Object.keys(cur), ...Object.keys(pending)]);
  for (const key of keys) {
    const oldStr = formatAttrValue(cur[key]);
    const newStr = formatAttrValue(pending[key]);
    if (oldStr !== newStr) {
      diffs.push({ path: `attributes.${key}`, label: ATTR_LABELS[key] ?? key, oldValue: oldStr, newValue: newStr });
    }
  }
  return diffs;
}

/** Every returned diff is its own independently approvable line item — the
 * "path" is what gets sent back to the server to say exactly which of these
 * the admin decided to approve versus reject. */
function buildDiffs(p: PendingProduct): FieldDiff[] {
  const pending = p.pending_changes || {};
  const diffs: FieldDiff[] = [];

  const push = (path: string, label: string, oldValue: string, newValue: string) => {
    if (oldValue !== newValue) diffs.push({ path, label, oldValue, newValue });
  };

  if ("name" in pending) push("name", "Name", p.name ?? "—", String(pending.name ?? "—"));
  if ("slug" in pending) push("slug", "Slug", p.slug ?? "—", String(pending.slug ?? "—"));
  if ("category" in pending) push("category", "Category", p.category ?? "—", String(pending.category ?? "—"));
  if ("description" in pending) push("description", "Description", p.description ?? "—", String(pending.description ?? "—"));
  if ("features" in pending) {
    push("features", "Features", (p.features ?? []).join(", ") || "—", ((pending.features as string[]) ?? []).join(", ") || "—");
  }
  if ("sale_price_cents" in pending) push("sale_price_cents", "Sale Price", formatPrice(p.sale_price_cents), formatPrice(pending.sale_price_cents));
  if ("regular_price_cents" in pending) push("regular_price_cents", "Regular Price", formatPrice(p.regular_price_cents), formatPrice(pending.regular_price_cents));
  if ("plr_price_cents" in pending) push("plr_price_cents", "PLR Price", formatPrice(p.plr_price_cents), formatPrice(pending.plr_price_cents));
  if ("is_active" in pending) push("is_active", "Active", formatBool(p.is_active), formatBool(pending.is_active));
  if ("is_plr_available" in pending) push("is_plr_available", "PLR Available", formatBool(p.is_plr_available), formatBool(pending.is_plr_available));

  if ("video_url" in pending && pending.video_url !== p.video_url) {
    push("video_url", "Preview Video", p.video_url ? "Has a video" : "No video", "New video uploaded");
  }
  if ("download_url" in pending && pending.download_url !== p.download_url) {
    push("download_url", "Download File", p.download_url ? "Has a file" : "No file", "New file uploaded");
  }

  if ("attributes" in pending && pending.attributes && typeof pending.attributes === "object") {
    diffs.push(...buildAttributeDiffs(p.attributes, pending.attributes as Record<string, unknown>));
  }

  return diffs;
}

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

  return (
    <>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", maxWidth: "640px" }}>
        Vendor edits wait here until reviewed. Uncheck anything you don&apos;t want to approve —
        everything checked gets applied, everything unchecked gets declined, in one action. The
        live site keeps showing the previously approved version until you act.
      </p>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
      {loading && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Loading…</p>}
      {!loading && !error && products.length === 0 && (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Nothing pending review right now.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {products.map((p) => (
          <PendingProductCard key={p.id} product={p} token={token ?? ""} onDone={load} />
        ))}
      </div>
    </>
  );
}

function PendingProductCard({
  product: p,
  token,
  onDone,
}: {
  product: PendingProduct;
  token: string;
  onDone: () => void;
}) {
  const diffs = buildDiffs(p);
  const hasImageChange = imagesChanged(p);
  const proposedImages = (p.pending_changes?.images as { url: string; is_primary?: boolean }[]) ?? [];

  const allPaths = [...diffs.map((d) => d.path), ...(hasImageChange ? ["images"] : [])];

  const [checked, setChecked] = useState<Set<string>>(new Set(allPaths));
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  function toggle(path: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function handleApply() {
    setWorking(true);
    setError("");
    try {
      const approvedPaths = allPaths.filter((path) => checked.has(path));
      const rejectedPaths = allPaths.filter((path) => !checked.has(path));

      const res = await fetch(`/api/admin/products/${p.id}/approve`, {
        method: "POST",
        headers: { "x-admin-key": token, "Content-Type": "application/json" },
        body: JSON.stringify({ approvedPaths, rejectedPaths, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to apply decisions");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  const anyUnchecked = allPaths.some((path) => !checked.has(path));

  return (
    <div style={{ border: "1px solid var(--line)", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>{p.name}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
            Vendor: {p.vendor_name} · Submitted {new Date(p.review_submitted_at).toLocaleString()}
          </div>
        </div>
        <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--ink-faded)" }}>
          View live listing ↗
        </a>
      </div>

      {diffs.length === 0 && !hasImageChange && (
        <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "16px" }}>No visible field changes detected.</p>
      )}

      {diffs.length > 0 && (
        <div style={{ border: "1px solid var(--line)", marginBottom: hasImageChange ? "16px" : "16px" }}>
          {diffs.map((d, i) => (
            <label
              key={d.path}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 130px 1fr 24px 1fr",
                gap: "12px",
                alignItems: "start",
                padding: "10px 14px",
                borderBottom: i < diffs.length - 1 || hasImageChange ? "1px solid var(--line)" : "none",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked.has(d.path)}
                onChange={() => toggle(d.path)}
                style={{ marginTop: "2px" }}
              />
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{d.label}</div>
              <div style={{ color: "var(--ink-mute)", textDecoration: "line-through" }}>{d.oldValue}</div>
              <div style={{ color: "var(--ink-mute)", textAlign: "center" }}>→</div>
              <div style={{ color: checked.has(d.path) ? "#166534" : "var(--ink-mute)", fontWeight: 600 }}>{d.newValue}</div>
            </label>
          ))}

          {hasImageChange && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checked.has("images")}
                onChange={() => toggle("images")}
                style={{ marginTop: "2px" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink)", marginBottom: "8px" }}>Images</div>
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
            </label>
          )}
        </div>
      )}

      {anyUnchecked && (
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for declining the unchecked item(s) — shown to the vendor"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--ink-soft)", fontSize: "13px", marginBottom: "12px", boxSizing: "border-box" }}
        />
      )}

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      {(diffs.length > 0 || hasImageChange) && (
        <button onClick={handleApply} disabled={working} className="btn btn-primary btn-sm">
          {working ? "Applying…" : "Apply Decisions"}
        </button>
      )}
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\pending-reviews\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\pending-reviews\page.tsx" -ForegroundColor Green

Write-Host "`nAll 2 files replaced." -ForegroundColor Cyan
Write-Host "Note: the old /reject endpoint (route.ts under products/[id]/reject) is now unused by the UI but left in place, harmless." -ForegroundColor Yellow
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan