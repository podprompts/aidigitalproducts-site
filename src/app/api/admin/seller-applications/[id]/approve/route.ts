import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendVendorWelcomeEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const { data: application, error: fetchError } = await supabaseAdmin
    .from("seller_waitlist")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status === "approved") {
    return NextResponse.json({ error: "This application was already approved" }, { status: 400 });
  }

  const email = application.email as string;
  const displayName = (application.business_name as string | null) || (application.name as string | null) || email;

  // Create the real Supabase Auth account. No password is set here — the
  // vendor sets their own via the recovery link sent below, so no
  // plaintext password ever passes through our hands.
  const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (authError || !authResult?.user) {
    return NextResponse.json(
      { error: `Failed to create account: ${authError?.message ?? "Unknown error"}` },
      { status: 502 }
    );
  }

  const newUserId = authResult.user.id;

  // Generate a one-time link the vendor uses to set their own password.
  const { data: linkResult, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (linkError || !linkResult?.properties?.action_link) {
    return NextResponse.json(
      { error: `Account created, but failed to generate a set-password link: ${linkError?.message ?? "Unknown error"}` },
      { status: 502 }
    );
  }

  const setPasswordUrl = linkResult.properties.action_link;

  const { error: profileError } = await supabaseAdmin.from("vendor_profiles").insert({
    id: newUserId,
    display_name: displayName,
    email,
    is_active: true,
  });

  if (profileError) {
    return NextResponse.json(
      { error: `Account created, but failed to set up their vendor profile: ${profileError.message}` },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("seller_waitlist")
    .update({ status: "approved", approved_at: new Date().toISOString(), vendor_id: newUserId })
    .eq("id", id);

  if (updateError) {
    console.error("[seller-applications/approve] Failed to update waitlist status (non-fatal)", updateError);
  }

  try {
    await sendVendorWelcomeEmail({
      toEmail: email,
      toName: (application.name as string | null) ?? undefined,
      setPasswordUrl,
    });
  } catch (err) {
    // The account and vendor profile are already created successfully —
    // a failed email shouldn't undo that. Surface it so the admin knows
    // to follow up manually with the link.
    console.error("[seller-applications/approve] Failed to send welcome email", err);
    return NextResponse.json({
      ok: true,
      warning: "Account created, but the welcome email failed to send. Share this link with them manually:",
      setPasswordUrl,
    });
  }

  return NextResponse.json({ ok: true });
}