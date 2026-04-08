import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// ─── Auth ─────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const key =
    req.headers.get("x-admin-api-key") ??
    req.nextUrl.searchParams.get("api_key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false; // refuse all requests if env var is not set
  return key === expected;
}

// ─── GET — list current overrides ────────────────────────────────────────────
// Optional ?productId=<uuid> to filter by product.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get("productId");

  let query = supabaseAdmin
    .from("timer_admin_overrides")
    .select("*")
    .order("created_at", { ascending: false });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ─── POST — create an override ───────────────────────────────────────────────
// Body: { product_id, override_type, ip_address?, expires_at?, created_by? }
//
// override_type values:
//   "force_sale"    — all visitors (or a specific ip) see sale price
//   "force_regular" — all visitors (or a specific ip) see regular price
//   "reset_all"     — immediately deletes all visitor_timers for the product;
//                     no persistent record is kept after the reset executes
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { product_id, override_type, ip_address, expires_at, created_by } = body as {
    product_id?: string;
    override_type?: string;
    ip_address?: string | null;
    expires_at?: string | null;
    created_by?: string;
  };

  if (!product_id || !override_type) {
    return NextResponse.json(
      { error: "product_id and override_type are required" },
      { status: 400 }
    );
  }

  if (!["force_sale", "force_regular", "reset_all"].includes(override_type)) {
    return NextResponse.json(
      { error: "override_type must be force_sale | force_regular | reset_all" },
      { status: 400 }
    );
  }

  // ── reset_all: execute immediately, no persistent record needed ────────────
  if (override_type === "reset_all") {
    const { error: delError } = await supabaseAdmin
      .from("visitor_timers")
      .delete()
      .eq("product_id", product_id);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "All visitor timers reset. Next visit will start a fresh 30-min sale.",
      product_id,
      override_type: "reset_all",
    });
  }

  // ── force_sale / force_regular: persist to DB ──────────────────────────────
  const { data, error } = await supabaseAdmin
    .from("timer_admin_overrides")
    .insert({
      product_id,
      override_type,
      ip_address: ip_address ?? null,
      expires_at: expires_at ?? null,
      created_by: created_by ?? "admin",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// ─── DELETE — remove an override by id ───────────────────────────────────────
// ?id=<uuid>
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("timer_admin_overrides")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Override removed", id });
}
