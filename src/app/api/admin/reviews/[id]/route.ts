import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { recalculateProductRating } from "@/lib/reviews";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid review id" }, { status: 400 });

  let body: { hidden?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "hidden must be true or false" }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("product_reviews")
    .update({ is_hidden: body.hidden })
    .eq("id", id)
    .select("product_id")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Review not found" }, { status: 404 });
  }

  await recalculateProductRating(updated.product_id);
  return NextResponse.json({ ok: true, hidden: body.hidden });
}