import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";

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

const MAX_BYTES = 3 * 1024 * 1024; // 3MB cap

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { fileName?: string; contentType?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fileName, contentType, fileSize } = body;

  if (typeof fileSize === "number" && fileSize > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 3MB" }, { status: 400 });
  }

  // No product/ownership check needed — this is always scoped to the
  // authenticated vendor's own avatar, keyed by their own user id.
  const ext = (fileName?.split(".").pop() || "jpg").toLowerCase();
  const path = `avatars/${user.id}/${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    ContentType: contentType || "image/jpeg",
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${CDN}/${path}`;

  return NextResponse.json({ uploadUrl, path, publicUrl });
}