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