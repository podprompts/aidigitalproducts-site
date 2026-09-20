import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendApplicationRejectionEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const { data: application } = await supabaseAdmin
    .from("seller_waitlist")
    .select("email, name, status")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (application.status === "approved") {
    return NextResponse.json({ error: "This application was already approved" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("seller_waitlist")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await sendApplicationRejectionEmail({
      toEmail: application.email as string,
      toName: (application.name as string | null) ?? undefined,
      reason,
    });
  } catch (err) {
    console.error("[seller-applications/reject] Failed to send rejection email", err);
    return NextResponse.json({
      ok: true,
      warning: "Application rejected, but the notification email failed to send.",
    });
  }

  return NextResponse.json({ ok: true });
}