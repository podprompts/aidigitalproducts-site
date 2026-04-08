import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!isAdminAuthed(req)) return unauthorized();
  const { id } = await params;

  const { data: image } = await supabaseAdmin
    .from("product_images")
    .select("url")
    .eq("id", id)
    .single();

  if (image?.url) {
    try {
      const u = new URL(image.url);
      const parts = u.pathname.split("/");
      const bucketIdx = parts.indexOf("product-images");
      if (bucketIdx >= 0) {
        const path = parts.slice(bucketIdx + 1).join("/");
        await supabaseAdmin.storage.from("product-images").remove([path]);
      }
    } catch { /* skip unparseable URL */ }
  }

  const { error } = await supabaseAdmin
    .from("product_images")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
