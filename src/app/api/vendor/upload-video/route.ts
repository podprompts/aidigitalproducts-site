import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { productId?: string; publicUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, publicUrl } = body;
  if (!productId || !publicUrl) {
    return NextResponse.json({ error: "Missing productId or publicUrl" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({ video_url: publicUrl })
    .eq("id", productId)
    .eq("vendor_id", user.id) // ownership enforced directly in the filter
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ url: publicUrl });
}