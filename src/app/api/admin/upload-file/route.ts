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

  console.log("[upload-file] DIAGNOSTIC — productId:", productId, "| path:", path);

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

  // Save path on product record — this is the actual column name confirmed
  // by the live database export (not download_file_url, not file_path).
  // .select() is required here: without it, Supabase reports success even
  // when zero rows match .eq("id", productId), which would silently hide
  // a mismatched or invalid productId instead of surfacing it as an error.
  const { data: updateData, error: updateError } = await supabaseAdmin
    .from("products")
    .update({ download_url: path })
    .eq("id", productId)
    .select();

  if (updateError) {
    console.error("[upload-file] failed to update product row", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log("[upload-file] DIAGNOSTIC — updateData:", JSON.stringify(updateData));

  if (!updateData || updateData.length === 0) {
    console.error("[upload-file] update matched zero rows for productId:", productId);
    return NextResponse.json(
      { error: `No product found with id ${productId} — file was uploaded to storage but not linked` },
      { status: 404 }
    );
  }

  return NextResponse.json({ path });
}