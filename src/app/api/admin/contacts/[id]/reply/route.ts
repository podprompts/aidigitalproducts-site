import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendSupportNotification } from "@/lib/email";
import { firstName } from "@/lib/support-constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REPLY = 4000;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { reply?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const reply = (body.reply ?? "").trim();
  if (!reply) return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });
  if (reply.length > MAX_REPLY) {
    return NextResponse.json({ error: `Reply must be ${MAX_REPLY} characters or fewer.` }, { status: 400 });
  }

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from("contact_submissions")
    .select("id, name, email, subject")
    .eq("id", id)
    .single();
  if (fetchError || !submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  // Send before saving: never record a reply that was never actually delivered.
  try {
    await sendSupportNotification({
      toEmail: submission.email,
      subject: `Re: ${submission.subject}`,
      label: "Reply From Our Team",
      heading: "We replied to your message.",
      paragraphs: [`Hi ${firstName(submission.name)},`, reply],
    });
  } catch (err) {
    console.error("[admin/contacts/reply] failed to send email", err);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 502 });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("contact_submissions")
    .update({ admin_reply: reply, replied_at: new Date().toISOString(), is_read: true })
    .eq("id", id)
    .select()
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ contact: updated });
}