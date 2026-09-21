import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notifyVendorOfModeration } from "@/lib/review-notifications";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Clears only the seller's reply. The review, its rating and its
// hidden/visible state are left exactly as they are.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid review id" }, { status: 400 });

  // Optional reason from the admin popup (body may be empty).
  let reason = "";
  try {
    const b = await req.json();
    if (typeof b?.reason === "string") reason = b.reason.trim().slice(0, 500);
  } catch {
    // no body - fine
  }

  const { data: existing } = await supabaseAdmin
    .from("product_reviews")
    .select("vendor_response")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("product_reviews")
    .update({ vendor_response: null, vendor_response_at: null })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing.vendor_response) {
    await notifyVendorOfModeration(id, "reply_removed", reason);
  }

  return NextResponse.json({ ok: true });
}