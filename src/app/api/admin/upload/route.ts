import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const CDN    = process.env.R2_CDN_URL!; // e.g. https://cdn.allnaturalbox.com

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const formData     = await req.formData();
  const file         = formData.get("file") as File | null;
  const productId    = formData.get("productId") as string | null;
  const isPrimary    = formData.get("isPrimary") === "true";
  const displayOrder = parseInt(formData.get("displayOrder") as string ?? "0", 10);

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext    = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path   = productId
    ? `product-images/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    : `product-images/temp/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         path,
    Body:        buffer,
    ContentType: file.type,
  }));

  const publicUrl = `${CDN}/${path}`;

  // Write to DB
  if (productId) {
    await supabaseAdmin.from("product_images").insert({
      product_id:    productId,
      url:           publicUrl,
      is_primary:    isPrimary,
      display_order: displayOrder,
      storage_path:  path,
    });

    if (isPrimary) {
      await supabaseAdmin
        .from("products")
        .update({ thumbnail_url: publicUrl })
        .eq("id", productId);
    }
  }

  return NextResponse.json({ url: publicUrl, path });
}