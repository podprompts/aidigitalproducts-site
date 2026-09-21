import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import OnboardingWelcomeModal from "@/components/OnboardingWelcomeModal";
import VendorHeader from "@/components/VendorHeader";

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
      <VendorHeader vendorName={vendorProfile.display_name ?? "there"} />
      <div style={{ padding: "32px" }}>{children}</div>
    </div>
  );
}
