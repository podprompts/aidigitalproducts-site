import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  let body: { productId?: string; path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, path } = body;
  if (!productId || !path) {
    return NextResponse.json({ error: "Missing productId or path" }, { status: 400 });
  }

  // .select() so a mismatched productId surfaces as a real error rather
  // than silently reporting success (same lesson as before).
  const { data, error } = await supabaseAdmin
    .from("products")
    .update({ download_url: path })
    .eq("id", productId)
    .select();

  if (error) {
    console.error("[upload-file] failed to update product row", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: `No product found with id ${productId}` },
      { status: 404 }
    );
  }

  return NextResponse.json({ path });
}