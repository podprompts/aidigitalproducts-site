import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("review_status")
    .eq("id", id)
    .single();

  if (!product || product.review_status !== "pending") {
    return NextResponse.json(
      { error: "This product has no pending submission to reject" },
      { status: 400 }
    );
  }

  // Deliberately leaves pending_changes and the live listing untouched —
  // rejecting never changes what's actually shown on the site.
  const { data: updated, error } = await supabaseAdmin
    .from("products")
    .update({
      review_status: "rejected",
      review_rejected_reason: body.reason || "No reason given",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: updated });
}