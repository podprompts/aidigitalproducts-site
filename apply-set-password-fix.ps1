# Fixes the localhost redirect issue: new set-password page, and the
# approve route now explicitly points the recovery link at it.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\vendor\set-password" | Out-Null

$content = @'
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function VendorSetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // The recovery link authenticates the browser via a session encoded in
    // the URL itself — the Supabase client picks this up automatically on
    // load. We just confirm it actually landed before showing the form.
    supabase.auth.getUser().then(({ data }) => {
      setSessionValid(!!data.user);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/vendor/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Checking your link…</p>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px" }}>
        <div style={{ maxWidth: "360px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>
            This link has expired or already been used.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
            Contact us at{" "}
            <a href="mailto:support@aidigitalproducts.com" style={{ color: "var(--ink)" }}>
              support@aidigitalproducts.com
            </a>{" "}
            for a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", textAlign: "center", marginBottom: "12px" }}>
          Set your password.
        </h1>
        <p style={{ fontSize: "13px", color: "var(--ink-faded)", textAlign: "center", marginBottom: "36px" }}>
          Choose a password for your new seller account.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
              New Password
            </label>
            <PasswordInput id="new-password" value={password} onChange={setPassword} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
              Confirm Password
            </label>
            <PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} required />
          </div>
          {error && <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\set-password\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\vendor\set-password\page.tsx" -ForegroundColor Green

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
  // redirectTo is explicit here — without it, this falls back to whatever
  // your Supabase project's default Site URL is set to, which may still be
  // a leftover localhost value from local development.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const { data: linkResult, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/vendor/set-password` },
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

Write-Host "`nAll 2 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan