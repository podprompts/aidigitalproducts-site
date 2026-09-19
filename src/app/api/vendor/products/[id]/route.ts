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
    .select("id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url")
    .eq("id", id)
    .eq("vendor_id", user.id) // scoped — a vendor can only ever fetch their own product
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

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

  // Deliberately restricted field set — a vendor can edit their own
  // listing's content and pricing amounts, but never Stripe price IDs
  // (sale, regular, or PLR), site-level curation flags (is_featured,
  // is_favorite), the coming-soon/archived states, or is_not_ai. Those
  // stay admin-only.
  const allowed: Record<string, unknown> = {};
  if (typeof body.name === "string") allowed.name = body.name;
  if (typeof body.slug === "string") allowed.slug = body.slug;
  if (typeof body.category === "string") allowed.category = body.category;
  if (typeof body.description === "string") allowed.description = body.description;
  if (Array.isArray(body.features)) allowed.features = body.features;
  if (typeof body.sale_price_cents === "number" || body.sale_price_cents === null) {
    allowed.sale_price_cents = body.sale_price_cents;
  }
  if (typeof body.regular_price_cents === "number" || body.regular_price_cents === null) {
    allowed.regular_price_cents = body.regular_price_cents;
  }
  if (typeof body.is_active === "boolean") allowed.is_active = body.is_active;
  if (typeof body.is_plr_available === "boolean") allowed.is_plr_available = body.is_plr_available;
  if (typeof body.plr_price_cents === "number" || body.plr_price_cents === null) {
    allowed.plr_price_cents = body.plr_price_cents;
  }
  if (body.attributes && typeof body.attributes === "object") {
    allowed.attributes = body.attributes;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(allowed)
    .eq("id", id)
    .eq("vendor_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}