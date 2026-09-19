import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { productId?: string; path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, path } = body;
  if (!productId || !path) {
    return NextResponse.json({ error: "Missing productId or path" }, { status: 400 });
  }

  // Ownership check only — no longer writes download_url live. The main
  // product PUT route stages this path into pending_changes instead, so
  // it doesn't take effect until an admin approves it.
  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("vendor_id", user.id)
    .single();

  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ path });
}