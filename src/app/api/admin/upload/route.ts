import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const formData  = await req.formData();
  const file      = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;
  const isPrimary = formData.get("isPrimary") === "true";
  const displayOrder = parseInt(formData.get("displayOrder") as string ?? "0", 10);

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext    = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path   = productId
    ? `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    : `temp/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("product-images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl;

  // ── NEW: write to DB ──────────────────────────────────────────────────────
  if (productId) {
    // Insert into product_images table
    await supabaseAdmin.from("product_images").insert({
      product_id:    productId,
      url:           publicUrl,
      is_primary:    isPrimary,
      display_order: displayOrder,
      storage_path:  path,
    });

    // If primary, stamp thumbnail_url on the product row too
    if (isPrimary) {
      await supabaseAdmin
        .from("products")
        .update({ thumbnail_url: publicUrl })
        .eq("id", productId);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ url: publicUrl, path });
}
