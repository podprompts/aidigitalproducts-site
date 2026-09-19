import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();

  // The layout already redirects to /vendor/login when there's no user,
  // but guard here too rather than asserting non-null — safer, and avoids
  // the exact crash that broke the build (prerendering with no real session).
  if (!user) return null;

  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("business_name, display_name, email")
    .eq("id", user.id)
    .single();

  const { count: productCount } = await supabaseAdmin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", user.id);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", marginBottom: "24px" }}>
        Welcome back.
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--ink-faded)" }}>
        <p>Business: {vendorProfile?.business_name}</p>
        <p>Email: {vendorProfile?.email}</p>
        <p>Products linked to your account: {productCount ?? 0}</p>
      </div>
    </div>
  );
}