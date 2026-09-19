import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("vendor_profiles")
    .select("id, display_name")
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vendors: data ?? [] });
}