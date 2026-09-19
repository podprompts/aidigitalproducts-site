# Replaces the raw-JSON pending review view with a readable field-by-field
# diff and side-by-side image previews. Run from the repo root.

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, video_url, download_url, vendor_id, pending_changes, review_status, review_submitted_at"
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

interface FieldDiff {
  label: string;
  oldValue: string;
  newValue: string;
}

/** Only returns fields the vendor actually touched AND that genuinely changed. */
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
  if ("video_url" in pending) push("Preview Video", p.video_url ? "Has a video" : "No video", pending.video_url ? "New video uploaded" : "Removed");
  if ("download_url" in pending) push("Download File", p.download_url ? "Has a file" : "No file", pending.download_url ? "New file uploaded" : "Removed");
  if ("attributes" in pending) diffs.push({ label: "Attributes", oldValue: "(see current listing)", newValue: "Updated" });

  return diffs;
}

function imagesChanged(p: PendingProduct): boolean {
  return "images" in (p.pending_changes || {});
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

Write-Host "`nAll 2 files replaced." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan