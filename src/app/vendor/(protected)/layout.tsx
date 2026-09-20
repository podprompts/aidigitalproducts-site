import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signOutAction } from "../actions";
import OnboardingWelcomeModal from "@/components/OnboardingWelcomeModal";

export default async function VendorProtectedLayout({ children }: { children: React.ReactNode }) {
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
    .select("display_name, is_active, stripe_onboarding_complete, avatar_url")
    .eq("id", user.id)
    .single();

  if (!vendorProfile || !vendorProfile.is_active) {
    redirect("/vendor/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <OnboardingWelcomeModal
        stripeConnected={!!vendorProfile.stripe_onboarding_complete}
        avatarUrl={vendorProfile.avatar_url ?? null}
        vendorName={vendorProfile.display_name ?? "there"}
      />
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <nav
          style={{
            display: "flex",
            gap: "24px",
            marginBottom: "32px",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <a href="/vendor/products" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>Products</a>
          <a href="/vendor/connect" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>Payouts</a>
          <a href="/vendor/history" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>History</a>
          <form action={signOutAction} style={{ marginLeft: "auto" }}>
            <button type="submit" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Sign Out
            </button>
          </form>
        </nav>
        {children}
      </div>
    </div>
  );
}