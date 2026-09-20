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

  if (application.status !== "approved" || !application.vendor_id) {
    return NextResponse.json(
      { error: "This application hasn't been approved yet — nothing to resend" },
      { status: 400 }
    );
  }

  const email = application.email as string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";

  // A fresh link — the original one may have already been used, expired,
  // or (for anyone approved before the localhost/race-condition fixes)
  // never actually worked in the first place.
  const { data: linkResult, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/vendor/set-password` },
  });

  if (linkError || !linkResult?.properties?.action_link) {
    return NextResponse.json(
      { error: `Failed to generate a new link: ${linkError?.message ?? "Unknown error"}` },
      { status: 502 }
    );
  }

  try {
    await sendVendorWelcomeEmail({
      toEmail: email,
      toName: (application.name as string | null) ?? undefined,
      setPasswordUrl: linkResult.properties.action_link,
    });
  } catch (err) {
    console.error("[seller-applications/resend-welcome] Failed to send email", err);
    return NextResponse.json({
      ok: true,
      warning: "Link generated, but the email failed to send. Share this link with them manually:",
      setPasswordUrl: linkResult.properties.action_link,
    });
  }

  return NextResponse.json({ ok: true });
}