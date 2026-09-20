import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
const CDN = process.env.R2_CDN_URL!;

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  let body: { productId?: string; fileName?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fileName, contentType } = body;
  if (!productId) return NextResponse.json({ error: "No productId provided" }, { status: 400 });

  // No ownership check needed here the way the vendor route has one —
  // admin can edit any product's images by design.
  const ext = (fileName?.split(".").pop() || "jpg").toLowerCase();
  const path = `product-images/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    ContentType: contentType || "image/jpeg",
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${CDN}/${path}`;

  return NextResponse.json({ uploadUrl, path, publicUrl });
}