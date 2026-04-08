import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  let body: { images: { id: string; display_order: number; is_primary: boolean }[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await Promise.all(
    body.images.map(({ id, display_order, is_primary }) =>
      supabaseAdmin
        .from("product_images")
        .update({ display_order, is_primary })
        .eq("id", id)
    )
  );

  return NextResponse.json({ ok: true });
}
