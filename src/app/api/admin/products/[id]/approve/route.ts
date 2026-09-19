import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { syncStripePrice } from "@/lib/stripe-price-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

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
      { error: "This product has no pending submission to approve" },
      { status: 400 }
    );
  }

  const pending = product.pending_changes as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  // Plain fields — copy straight across if the vendor's submission touched them
  const plainFields = [
    "name", "slug", "category", "description", "features",
    "is_active", "is_plr_available", "attributes", "video_url", "download_url",
  ];
  for (const field of plainFields) {
    if (field in pending) updates[field] = pending[field];
  }

  // Price fields — this is the moment a price change actually syncs with
  // Stripe, not when the vendor originally submitted it. Diffed against
  // the CURRENT live price, since that's still what's active until now.
  try {
    if ("sale_price_cents" in pending) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.sale_price_cents as number | null,
        currentPriceCents: product.sale_price_cents,
        currentStripePriceId: product.sale_stripe_price_id,
      });
      updates.sale_price_cents = synced.priceCents;
      updates.sale_stripe_price_id = synced.stripePriceId;
    }
    if ("regular_price_cents" in pending) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.regular_price_cents as number | null,
        currentPriceCents: product.regular_price_cents,
        currentStripePriceId: product.regular_stripe_price_id,
      });
      updates.regular_price_cents = synced.priceCents;
      updates.regular_stripe_price_id = synced.stripePriceId;
    }
    if ("plr_price_cents" in pending) {
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

  // Images — replace the live set wholesale with the vendor's approved snapshot
  if (Array.isArray(pending.images)) {
    const images = pending.images as { url: string; is_primary?: boolean; display_order?: number }[];

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
  updates.review_status = "none";
  updates.review_rejected_reason = null;
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