import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { productId?: string; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, fileName } = body;
  if (!productId) return NextResponse.json({ error: "No productId provided" }, { status: 400 });

  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = (fileName?.split(".").pop() || "zip").toLowerCase();
  const path = `products/${productId}/${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path });
}