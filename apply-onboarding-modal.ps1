# Adds a prominent onboarding welcome modal prompting vendors to complete
# Stripe Connect setup, shown on every vendor page until they do.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
"use client";

import { useState } from "react";

interface Props {
  showByDefault: boolean;
  vendorName: string;
}

export default function OnboardingWelcomeModal({ showByDefault, vendorName }: Props) {
  const [open, setOpen] = useState(showByDefault);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 20, 20, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--line)",
          maxWidth: "480px",
          width: "100%",
          padding: "36px",
          position: "relative",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Remind me later"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: "var(--ink-faded)",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ×
        </button>

        <div
          style={{
            fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)",
            textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: "16px",
          }}
        >
          Welcome, {vendorName}
        </div>

        <h2 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px", lineHeight: 1.2 }}>
          One step left before you can get paid.
        </h2>

        <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.65, marginBottom: "20px" }}>
          You&apos;re fully set up to list and manage products. But to actually receive your share
          of each sale, you need to connect a Stripe account. Until this is done, sales are still
          recorded normally — your payouts just can&apos;t be sent to you yet.
        </p>

        <div style={{ border: "1px solid var(--line)", padding: "18px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            How it works
          </div>
          <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
              Click <strong style={{ color: "var(--ink)" }}>Connect Stripe Account</strong> below
            </li>
            <li style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
              Complete Stripe&apos;s short setup form — your business details and bank account
            </li>
            <li style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
              Once approved, payouts happen automatically on every future sale — no further action needed
            </li>
          </ol>
        </div>

        <p style={{ fontSize: "12px", color: "var(--ink-mute)", lineHeight: 1.6, marginBottom: "28px" }}>
          The platform keeps a 20% commission on each sale; the rest is transferred directly to
          your connected account by Stripe.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href="/vendor/connect" className="btn btn-primary">
            Connect Stripe Account
          </a>
          <button onClick={() => setOpen(false)} className="btn btn-ghost">
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\components\OnboardingWelcomeModal.tsx" -Value $content -NoNewline
Write-Host "NEW: src\components\OnboardingWelcomeModal.tsx" -ForegroundColor Green

$content = @'
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signOutAction } from "../actions";
import OnboardingWelcomeModal from "@/components/OnboardingWelcomeModal";

export const dynamic = "force-dynamic";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/vendor/login");
  }

  // Confirm this logged-in user actually has a vendor_profiles row —
  // being a valid Supabase Auth user isn't enough on its own; only
  // real vendors should get past this point.
  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("display_name, is_active, stripe_onboarding_complete")
    .eq("id", user.id)
    .single();

  if (!vendorProfile || !vendorProfile.is_active) {
    redirect("/vendor/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <OnboardingWelcomeModal
        showByDefault={!vendorProfile.stripe_onboarding_complete}
        vendorName={vendorProfile.display_name ?? "there"}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
          Vendor Portal — {vendorProfile.display_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="/vendor/products" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Products
          </a>
          <a href="/vendor/connect" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Payouts
          </a>
          <a href="/vendor/history" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            History
          </a>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign Out
            </button>
          </form>
        </div>
      </div>
      <div style={{ padding: "32px" }}>{children}</div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\layout.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\layout.tsx" -ForegroundColor Green

Write-Host "`nAll 2 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan