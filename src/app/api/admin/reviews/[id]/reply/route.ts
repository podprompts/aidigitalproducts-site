import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Clears only the seller's reply. The review, its rating and its
// hidden/visible state are left exactly as they are.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid review id" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("product_reviews")
    .update({ vendor_response: null, vendor_response_at: null })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Review not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}