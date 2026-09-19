import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: {
    productId?: string;
    publicUrl?: string;
    path?: string;
    isPrimary?: boolean;
    displayOrder?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, publicUrl, path, isPrimary, displayOrder } = body;
  if (!productId || !publicUrl) {
    return NextResponse.json({ error: "Missing productId or publicUrl" }, { status: 400 });
  }

  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl,
      is_primary: !!isPrimary,
      display_order: displayOrder ?? 0,
      storage_path: path ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isPrimary) {
    await supabaseAdmin.from("products").update({ thumbnail_url: publicUrl }).eq("id", productId);
  }

  return NextResponse.json({ image: data });
}