import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const adminUser = await getAdminUser(req);
  if (!adminUser?.sub) {
    return NextResponse.json({ error: "Could not identify admin user" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("admin_profiles")
    .select("display_name, email, avatar_url")
    .eq("id", adminUser.sub)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}