import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const { data: application } = await supabaseAdmin
    .from("seller_waitlist")
    .select("status")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (application.status === "approved") {
    return NextResponse.json({ error: "This application was already approved" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("seller_waitlist")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}