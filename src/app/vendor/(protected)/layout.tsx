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
    .select("display_name, is_active, stripe_onboarding_complete, avatar_url, agreed_to_seller_agreement_at")
    .eq("id", user.id)
    .single();

  if (!vendorProfile || !vendorProfile.is_active) {
    redirect("/vendor/login");
  }

  // Hard gate — unlike Stripe Connect/avatar (which nag via a dismissable
  // modal), the Seller Agreement is a legal requirement. Applies to every
  // vendor, including those approved before this feature existed, since
  // the column is simply NULL for them until they explicitly accept.
  if (!vendorProfile.agreed_to_seller_agreement_at) {
    redirect("/vendor/agreement");
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-mute)", textDecoration: "none" }}>
            ← Home
          </a>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
            Vendor Portal — {vendorProfile.display_name}
          </div>
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
