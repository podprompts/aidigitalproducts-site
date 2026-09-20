import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { publicUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.publicUrl) {
    return NextResponse.json({ error: "Missing publicUrl" }, { status: 400 });
  }

  // Unlike product images, a profile picture is the vendor's own account
  // setting, not a listing edit — it goes live immediately, no admin
  // review needed.
  const { error } = await supabaseAdmin
    .from("vendor_profiles")
    .update({ avatar_url: body.publicUrl })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, avatar_url: body.publicUrl });
}