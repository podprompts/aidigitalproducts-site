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
const CDN    = process.env.R2_CDN_URL!;

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
    ? `product-videos/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
    : `product-videos/temp/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;

  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         path,
    Body:        buffer,
    ContentType: "video/mp4",
  }));

  const publicUrl = `${CDN}/${path}`;

  if (productId) {
    await supabaseAdmin
      .from("products")
      .update({ video_url: publicUrl })
      .eq("id", productId);
  }

  return NextResponse.json({ url: publicUrl, path });
}