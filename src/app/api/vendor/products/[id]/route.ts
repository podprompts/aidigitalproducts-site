import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

async function getVendorUser() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getVendorUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url, pending_changes, review_status, review_rejected_reason, last_approved_changes, last_approved_at"
    )
    .eq("id", id)
    .eq("vendor_id", user.id) // scoped — a vendor can only ever fetch their own product
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

/**
 * Every vendor edit is staged, never written live. This route only ever
 * touches pending_changes / review_status / review_submitted_at — the
 * actual product columns (and product_images) are only updated when an
 * admin approves the submission, via the separate admin approval route.
 * Stripe price syncing also happens at approval time, not here, so a
 * price change never takes effect until it's actually approved either.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getVendorUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  // Verify ownership BEFORE allowing any update — never trust the client's
  // claim about which product this is.
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("id, vendor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.vendor_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Same field whitelist as before — a vendor can propose changes to their
  // own listing's content, pricing amounts, images, video, and file, but
  // never Stripe price IDs directly, site-level curation flags, the
  // coming-soon/archived states, or is_not_ai. Those stay admin-only.
  // "images" is a full array of { url, is_primary, display_order } — the
  // vendor's complete desired image set, not an incremental change.
  const proposed: Record<string, unknown> = {};
  if (typeof body.name === "string") proposed.name = body.name;
  if (typeof body.slug === "string") proposed.slug = body.slug;
  if (typeof body.category === "string") proposed.category = body.category;
  if (typeof body.description === "string") proposed.description = body.description;
  if (Array.isArray(body.features)) proposed.features = body.features;
  if (typeof body.sale_price_cents === "number" || body.sale_price_cents === null) {
    proposed.sale_price_cents = body.sale_price_cents;
  }
  if (typeof body.regular_price_cents === "number" || body.regular_price_cents === null) {
    proposed.regular_price_cents = body.regular_price_cents;
  }
  if (typeof body.is_active === "boolean") proposed.is_active = body.is_active;
  if (typeof body.is_plr_available === "boolean") proposed.is_plr_available = body.is_plr_available;
  if (typeof body.plr_price_cents === "number" || body.plr_price_cents === null) {
    proposed.plr_price_cents = body.plr_price_cents;
  }
  if (body.attributes && typeof body.attributes === "object") {
    proposed.attributes = body.attributes;
  }
  if (typeof body.video_url === "string" || body.video_url === null) {
    proposed.video_url = body.video_url;
  }
  if (typeof body.download_url === "string" || body.download_url === null) {
    proposed.download_url = body.download_url;
  }
  if (Array.isArray(body.images)) {
    proposed.images = body.images;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      pending_changes: proposed,
      review_status: "pending",
      review_submitted_at: new Date().toISOString(),
      review_rejected_reason: null,
    })
    .eq("id", id)
    .eq("vendor_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}