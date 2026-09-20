import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import NavClient, { type VendorNavInfo } from "./NavClient";

export default async function Nav() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  let vendorInfo: VendorNavInfo | null = null;

  if (user) {
    const { data: vendorProfile } = await supabaseAdmin
      .from("vendor_profiles")
      .select("display_name, avatar_url, is_active")
      .eq("id", user.id)
      .single();

    if (vendorProfile?.is_active) {
      vendorInfo = {
        displayName: vendorProfile.display_name ?? "Vendor",
        avatarUrl: vendorProfile.avatar_url ?? null,
      };
    }
  }

  return <NavClient vendorInfo={vendorInfo} />;
}
