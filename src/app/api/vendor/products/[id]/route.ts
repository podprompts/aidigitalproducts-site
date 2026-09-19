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
    .select("id, name, description, sale_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url")
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
  // listing's basics, but never Stripe price IDs, PLR settings, or
  // site-level curation flags (is_featured, etc.). Those stay admin-only.
  const allowed: Record<string, unknown> = {};
  if (typeof body.name === "string") allowed.name = body.name;
  if (typeof body.description === "string") allowed.description = body.description;
  if (typeof body.sale_price_cents === "number" || body.sale_price_cents === null) {
    allowed.sale_price_cents = body.sale_price_cents;
  }
  if (typeof body.is_active === "boolean") allowed.is_active = body.is_active;
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