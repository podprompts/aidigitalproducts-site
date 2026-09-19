# Fixes the missing business_name field (root cause of the failure) and
# makes the whole approval flow safely retryable end to end.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendVendorWelcomeEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Creates the Auth user for this email, or — if one already exists (most
 * commonly because a PREVIOUS approval attempt got this far before failing
 * at a later step) — finds and reuses that existing account instead of
 * treating it as a hard failure. This is what makes the whole approval
 * flow safely retryable rather than getting permanently stuck the moment
 * any later step fails once.
 */
async function getOrCreateAuthUser(email: string): Promise<{ userId: string } | { error: string }> {
  const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (!authError && authResult?.user) {
    return { userId: authResult.user.id };
  }

  const { data: listResult, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (!listError && listResult?.users) {
    const existing = listResult.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (existing) return { userId: existing.id };
  }

  return { error: authError?.message ?? "Unknown error creating account" };
}

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
  const businessName = (application.business_name as string | null) || (application.name as string | null) || email;
  const displayName = businessName;

  // Create the real Supabase Auth account. No password is set here — the
  // vendor sets their own via the recovery link sent below, so no
  // plaintext password ever passes through our hands.
  const userResult = await getOrCreateAuthUser(email);
  if ("error" in userResult) {
    return NextResponse.json({ error: `Failed to create account: ${userResult.error}` }, { status: 502 });
  }
  const newUserId = userResult.userId;

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

  // Upsert, not insert — safe to retry even if a previous attempt already
  // got this far. business_name is required by the table and was the
  // actual root cause of the original failure.
  const { error: profileError } = await supabaseAdmin.from("vendor_profiles").upsert({
    id: newUserId,
    display_name: displayName,
    business_name: businessName,
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
'@
Set-Content -LiteralPath "src\app\api\admin\seller-applications\[id]\approve\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\admin\seller-applications\[id]\approve\route.ts" -ForegroundColor Green
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan