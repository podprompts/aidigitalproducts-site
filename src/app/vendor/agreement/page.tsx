import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import VendorAgreementPage from "./VendorAgreementPage";

export const dynamic = "force-dynamic";

export default async function VendorAgreementRoute() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/vendor/login");
  }

  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("display_name, agreed_to_seller_agreement_at, is_active")
    .eq("id", user.id)
    .single();

  if (!vendorProfile || !vendorProfile.is_active) {
    redirect("/vendor/login");
  }

  return (
    <VendorAgreementPage
      alreadyAgreedAt={vendorProfile.agreed_to_seller_agreement_at ?? null}
      vendorName={vendorProfile.display_name ?? "there"}
    />
  );
}
