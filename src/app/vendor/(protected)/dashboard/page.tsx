import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import AvatarUploader from "@/components/AvatarUploader";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  // The layout already redirects to /vendor/login when there's no user,
  // but guard here too rather than asserting non-null.
  if (!user) return null;

  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("business_name, display_name, email, avatar_url")
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

      <div style={{ marginBottom: "28px", paddingBottom: "28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
          Profile Picture
        </div>
        <AvatarUploader currentAvatarUrl={vendorProfile?.avatar_url ?? null} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--ink-faded)" }}>
        <p>Business: {vendorProfile?.business_name}</p>
        <p>Email: {vendorProfile?.email}</p>
        <p>Products linked to your account: {productCount ?? 0}</p>
      </div>
      <a
        href="/vendor/products"
        className="btn btn-primary"
        style={{ marginTop: "24px", display: "inline-block" }}
      >
        View & Manage Products
      </a>
    </div>
  );
}