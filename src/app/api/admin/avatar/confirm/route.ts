import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const adminUser = await getAdminUser(req);
  if (!adminUser?.sub) {
    return NextResponse.json({ error: "Could not identify admin user" }, { status: 401 });
  }

  let body: { publicUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.publicUrl) {
    return NextResponse.json({ error: "Missing publicUrl" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("admin_profiles")
    .update({ avatar_url: body.publicUrl })
    .eq("id", adminUser.sub);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, avatar_url: body.publicUrl });
}