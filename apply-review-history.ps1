# Adds a permanent vendor review-history log, and makes the top-of-page
# approval/rejection banners clear after being viewed once.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\vendor\(protected)\history" | Out-Null

$content = @'
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ApprovedChange { label: string; oldValue: string; newValue: string }

export default async function VendorHistoryPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: logs } = await supabaseAdmin
    .from("product_review_log")
    .select("id, product_id, approved_changes, rejected_reason, rejected_fields, created_at")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const productIds = [...new Set((logs ?? []).map((l) => l.product_id).filter(Boolean))];
  let productNames: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabaseAdmin.from("products").select("id, name").in("id", productIds);
    productNames = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "8px" }}>
        Review History
      </h1>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px" }}>
        A permanent record of every decision made on your submitted edits — this stays here even
        after the notice at the top of the edit page has cleared.
      </p>

      {(!logs || logs.length === 0) && (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No review history yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {(logs ?? []).map((log) => {
          const approved = (log.approved_changes as ApprovedChange[] | null) ?? [];
          const rejectedFields = (log.rejected_fields as string[] | null) ?? [];
          return (
            <div key={log.id} style={{ border: "1px solid var(--line)", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>
                  {productNames[log.product_id] ?? "Unknown product"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>

              {approved.length > 0 && (
                <div
                  style={{
                    background: "#eaf6ec", border: "1px solid #9dd6a8", padding: "10px 14px",
                    fontSize: "13px", color: "#1e5e2f", marginBottom: log.rejected_reason ? "8px" : 0,
                  }}
                >
                  <strong>Approved:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                    {approved.map((c, i) => (
                      <li key={i}>{c.label}: {c.oldValue} → {c.newValue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {log.rejected_reason && (
                <div style={{ background: "#fdecea", border: "1px solid #e5a19a", padding: "10px 14px", fontSize: "13px", color: "#7a2e26" }}>
                  <strong>Declined:</strong> {rejectedFields.join(", ") || "—"}
                  <br />
                  Reason: {log.rejected_reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\history\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\vendor\(protected)\history\page.tsx" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { syncStripePrice } from "@/lib/stripe-price-sync";

type Ctx = { params: Promise<{ id: string }> };

const FIELD_LABELS: Record<string, string> = {
  name: "Name", slug: "Slug", category: "Category", description: "Description",
  features: "Features", sale_price_cents: "Sale Price", regular_price_cents: "Regular Price",
  plr_price_cents: "PLR Price", is_active: "Active", is_plr_available: "PLR Available",
  video_url: "Preview Video", download_url: "Download File", images: "Images",
};

const ATTR_LABELS: Record<string, string> = {
  promptsIncluded: "Prompts Included", worksWith: "Works With", license: "License",
  format: "Format", lastUpdated: "Last Updated", version: "Version",
  instantDownload: "Instant Download", support: "Support", difficultyLevel: "Difficulty Level",
  builtWith: "Built With", requirements: "Requirements", aiModel: "AI Model",
};

function formatPrice(cents: unknown): string {
  return typeof cents === "number" ? `$${(cents / 100).toFixed(2)}` : "—";
}
function formatBool(v: unknown): string {
  return v ? "Yes" : "No";
}
function formatAttrValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
interface ApprovedSummaryItem { label: string; oldValue: string; newValue: string }

function labelForPath(path: string): string {
  if (path.startsWith("attributes.")) {
    const key = path.slice("attributes.".length);
    return ATTR_LABELS[key] ?? key;
  }
  return FIELD_LABELS[path] ?? path;
}

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
  const approvedSummary: ApprovedSummaryItem[] = [];

  // Plain fields — applied only if their exact path was approved
  const plainFields = [
    "name", "slug", "category", "description", "features",
    "is_active", "is_plr_available", "video_url", "download_url",
  ];
  for (const field of plainFields) {
    if (field in pending && approvedPaths.has(field)) {
      updates[field] = pending[field];
      if (field === "video_url") {
        approvedSummary.push({ label: "Preview Video", oldValue: product.video_url ? "Had a video" : "No video", newValue: "New video is now live" });
      } else if (field === "download_url") {
        approvedSummary.push({ label: "Download File", oldValue: product.download_url ? "Had a file" : "No file", newValue: "New file is now live" });
      } else if (field === "is_active" || field === "is_plr_available") {
        approvedSummary.push({ label: FIELD_LABELS[field], oldValue: formatBool((product as Record<string, unknown>)[field]), newValue: formatBool(pending[field]) });
      } else if (field === "features") {
        approvedSummary.push({ label: "Features", oldValue: ((product.features as string[]) ?? []).join(", ") || "—", newValue: ((pending.features as string[]) ?? []).join(", ") || "—" });
      } else {
        approvedSummary.push({ label: FIELD_LABELS[field] ?? field, oldValue: String((product as Record<string, unknown>)[field] ?? "—"), newValue: String(pending[field] ?? "—") });
      }
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
        approvedSummary.push({
          label: ATTR_LABELS[key] ?? key,
          oldValue: formatAttrValue(currentAttrs[key]),
          newValue: formatAttrValue(pendingAttrs[key]),
        });
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
      approvedSummary.push({ label: "Sale Price", oldValue: formatPrice(product.sale_price_cents), newValue: formatPrice(synced.priceCents) });
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
      approvedSummary.push({ label: "Regular Price", oldValue: formatPrice(product.regular_price_cents), newValue: formatPrice(synced.priceCents) });
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
      approvedSummary.push({ label: "PLR Price", oldValue: formatPrice(product.plr_price_cents), newValue: formatPrice(synced.priceCents) });
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
    approvedSummary.push({ label: "Images", oldValue: "Previous images", newValue: `${images.length} image(s) now live` });
  }

  const admin = await getAdminUser(req);

  updates.pending_changes = null;
  updates.review_status = rejectedPaths.length > 0 ? "rejected" : "none";
  updates.review_rejected_reason =
    rejectedPaths.length > 0 ? (body.reason || `Not approved: ${rejectedPaths.join(", ")}`) : null;
  updates.reviewed_by = admin?.sub ?? null;
  updates.reviewed_at = new Date().toISOString();

  if (approvedSummary.length > 0) {
    updates.last_approved_changes = approvedSummary;
    updates.last_approved_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Write a permanent record of this decision, independent of the
  // vendor-facing banner fields above, which get cleared once viewed.
  if (approvedSummary.length > 0 || rejectedPaths.length > 0) {
    await supabaseAdmin.from("product_review_log").insert({
      product_id: id,
      vendor_id: product.vendor_id,
      approved_changes: approvedSummary.length > 0 ? approvedSummary : null,
      rejected_reason: rejectedPaths.length > 0 ? (updates.review_rejected_reason as string) : null,
      rejected_fields: rejectedPaths.length > 0 ? rejectedPaths.map(labelForPath) : null,
      reviewed_by: admin?.sub ?? null,
    });
  }

  return NextResponse.json({ product: updated });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\[id]\approve\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\admin\products\[id]\approve\route.ts" -ForegroundColor Green

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
    .select("id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url, review_status, review_rejected_reason, last_approved_changes, last_approved_at")
    .eq("id", id)
    .single();

  // Ownership check — a vendor can only ever land here for their own product
  if (!product || product.vendor_id !== user.id) notFound();

  // The rejection/approval banners are shown exactly once — capture their
  // current values for THIS render, then clear them immediately so a
  // refresh or a later visit doesn't keep showing a decision the vendor
  // has already seen. The permanent record still lives in
  // product_review_log regardless of this clearing.
  const bannerData = {
    review_status: product.review_status,
    review_rejected_reason: product.review_rejected_reason,
    last_approved_changes: product.last_approved_changes,
    last_approved_at: product.last_approved_at,
  };

  const hasApprovedBanner = Array.isArray(product.last_approved_changes) && product.last_approved_changes.length > 0;
  if (product.review_status === "rejected" || hasApprovedBanner) {
    await supabaseAdmin
      .from("products")
      .update({
        // "pending" is an ongoing state, not a past decision — only ever
        // clear review_status if it was specifically "rejected".
        review_status: product.review_status === "rejected" ? "none" : product.review_status,
        review_rejected_reason: null,
        last_approved_changes: null,
        last_approved_at: null,
      })
      .eq("id", id);
  }

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("id, url, is_primary, display_order")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  return (
    <VendorProductEditForm
      product={{ ...product, ...bannerData }}
      initialImages={images ?? []}
    />
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\products\[id]\edit\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\products\[id]\edit\page.tsx" -ForegroundColor Green

$content = @'
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signOutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/vendor/login");
  }

  // Confirm this logged-in user actually has a vendor_profiles row —
  // being a valid Supabase Auth user isn't enough on its own; only
  // real vendors should get past this point.
  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("display_name, is_active")
    .eq("id", user.id)
    .single();

  if (!vendorProfile || !vendorProfile.is_active) {
    redirect("/vendor/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
          Vendor Portal — {vendorProfile.display_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="/vendor/products" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Products
          </a>
          <a href="/vendor/connect" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Payouts
          </a>
          <a href="/vendor/history" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            History
          </a>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign Out
            </button>
          </form>
        </div>
      </div>
      <div style={{ padding: "32px" }}>{children}</div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\layout.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\layout.tsx" -ForegroundColor Green

Write-Host "`nAll 4 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan