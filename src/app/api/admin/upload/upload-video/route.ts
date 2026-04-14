import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const formData  = await req.formData();
  const file      = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".mp4")) {
    return NextResponse.json({ error: "Only .mp4 files are allowed" }, { status: 400 });
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const path   = productId
    ? `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
    : `temp/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;

  const { error } = await supabaseAdmin.storage
    .from("product-videos")
    .upload(path, buffer, { contentType: "video/mp4", upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from("product-videos")
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl;

  // Stamp video_url on the product row if we have a productId
  if (productId) {
    await supabaseAdmin
      .from("products")
      .update({ video_url: publicUrl })
      .eq("id", productId);
  }

  return NextResponse.json({ url: publicUrl, path });
}