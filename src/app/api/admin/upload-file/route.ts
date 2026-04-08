import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const form      = await req.formData();
  const file      = form.get("file") as File | null;
  const productId = form.get("productId") as string | null;

  if (!file || !productId) {
    return NextResponse.json({ error: "Missing file or productId" }, { status: 400 });
  }

  const ext      = file.name.split(".").pop() ?? "bin";
  const fileName = `${Date.now()}.${ext}`;
  const path     = `products/${productId}/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("product-files")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("[upload-file]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Save path on product record
  await supabaseAdmin
    .from("products")
    .update({ download_file_url: path })
    .eq("id", productId);

  return NextResponse.json({ path });
}
