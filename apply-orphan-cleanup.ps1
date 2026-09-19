# Cleans up orphaned R2/storage files when a video, file, or image gets rejected.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { syncStripePrice } from "@/lib/stripe-price-sync";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_CDN = process.env.R2_CDN_URL!;

/** Deletes an orphaned R2 object by its public URL. Safe no-op if the URL
 * doesn't actually live under our own CDN, or if deletion fails for any
 * reason — an orphaned file is just storage bloat, never worth blocking
 * the actual review decision over. */
async function deleteR2ObjectByUrl(url: string): Promise<void> {
  if (!url || !url.startsWith(R2_CDN)) return;
  const key = url.slice(R2_CDN.length).replace(/^\/+/, "");
  if (!key) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch (err) {
    console.error("[approve] Failed to delete orphaned R2 object", key, err);
  }
}

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

  // Clean up files that were already uploaded to storage but got rejected —
  // they'll never be referenced by anything now, so delete them instead of
  // leaving orphaned storage bloat behind.
  if (rejectedPaths.includes("video_url") && typeof pending.video_url === "string") {
    await deleteR2ObjectByUrl(pending.video_url);
  }
  if (rejectedPaths.includes("download_url") && typeof pending.download_url === "string") {
    try {
      await supabaseAdmin.storage.from("product-files").remove([pending.download_url as string]);
    } catch (err) {
      console.error("[approve] Failed to delete orphaned download file", err);
    }
  }
  if (rejectedPaths.includes("images")) {
    const rejectedImages = (pending.images as { url: string }[]) ?? [];
    const { data: liveImages } = await supabaseAdmin.from("product_images").select("url").eq("product_id", id);
    const liveUrls = new Set((liveImages ?? []).map((r) => r.url));
    // Only delete images that aren't still part of the current live set —
    // an image the vendor kept unchanged should never be touched here.
    for (const img of rejectedImages) {
      if (img.url && !liveUrls.has(img.url)) {
        await deleteR2ObjectByUrl(img.url);
      }
    }
  }

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
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan