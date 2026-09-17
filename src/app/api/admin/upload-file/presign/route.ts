import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  let body: { productId?: string; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fileName } = body;
  if (!productId) {
    return NextResponse.json({ error: "No productId provided" }, { status: 400 });
  }

  const ext  = (fileName?.split(".").pop() || "zip").toLowerCase();
  const path = `products/${productId}/${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[upload-file/presign]", error);
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token:     data.token,
    path:      data.path,
  });
}