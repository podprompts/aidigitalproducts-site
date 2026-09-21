import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import AvatarUploader from "@/components/AvatarUploader";

export const dynamic = "force-dynamic";

interface VendorOrder {
  id: string;
  amount_cents: number | null;
  vendor_payout_cents: number | null;
  status: string | null;
  created_at: string;
  metadata: { product_id?: string } | null;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

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

  // Sales data — filtered to this vendor's own orders only. Note: this
  // sums every order's vendor_payout_cents regardless of any later refund;
  // getting refund-adjusted totals exactly right would need clarifying how
  // a refund updates (or doesn't update) this row, which hasn't been
  // confirmed — flagged here rather than guessed at.
  const { data: ordersData } = await supabaseAdmin
    .from("orders")
    .select("id, amount_cents, vendor_payout_cents, status, created_at, metadata")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  const allOrders: VendorOrder[] = ordersData ?? [];
  // Refunded orders are excluded from all totals; they still appear in Recent Sales, marked as refunded.
  const orders = allOrders.filter((o) => o.status !== "refunded");

  const totalOrders = orders.length;
  const totalPayoutCents = orders.reduce((sum, o) => sum + (o.vendor_payout_cents ?? 0), 0);
  const avgOrderCents = totalOrders > 0
    ? orders.reduce((sum, o) => sum + (o.amount_cents ?? 0), 0) / totalOrders
    : 0;

  // Per-product breakdown — grouped by the product_id tucked inside metadata.
  const productIds = [...new Set(allOrders.map((o) => o.metadata?.product_id).filter(Boolean))] as string[];
  const { data: productsData } = productIds.length > 0
    ? await supabaseAdmin.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const productNameMap = new Map((productsData ?? []).map((p) => [p.id, p.name]));

  const productBreakdown = new Map<string, { name: string; units: number; payoutCents: number }>();
  for (const o of orders) {
    const pid = o.metadata?.product_id;
    if (!pid) continue;
    const existing = productBreakdown.get(pid) ?? {
      name: productNameMap.get(pid) ?? "Unknown product",
      units: 0,
      payoutCents: 0,
    };
    existing.units += 1;
    existing.payoutCents += o.vendor_payout_cents ?? 0;
    productBreakdown.set(pid, existing);
  }
  const productBreakdownList = [...productBreakdown.values()].sort((a, b) => b.payoutCents - a.payoutCents);

  const recentOrders = allOrders.slice(0, 10);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", marginBottom: "24px" }}>
        Welcome back.
      </h1>

      {/* Sales stats */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "16px" }}>
          Your Sales
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1px", background: "var(--line)" }}>
          <StatCard label="Total Orders" value={String(totalOrders)} />
          <StatCard label="Total Payout" value={formatCents(totalPayoutCents)} />
          <StatCard label="Avg Order Value" value={formatCents(avgOrderCents)} />
        </div>
      </div>

      {/* Per-product breakdown */}
      {productBreakdownList.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "16px" }}>
            Sales By Product
          </div>
          <div style={{ border: "1px solid var(--line)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Product</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Units Sold</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Payout</th>
                </tr>
              </thead>
              <tbody>
                {productBreakdownList.map((p, i) => (
                  <tr key={p.name + i} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--ink)" }}>{p.name}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "var(--ink-faded)" }}>{p.units}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "var(--ink)" }}>{formatCents(p.payoutCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent sales */}
      {recentOrders.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "16px" }}>
            Recent Sales
          </div>
          <div style={{ border: "1px solid var(--line)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Product</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Payout</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--line-soft)", opacity: o.status === "refunded" ? 0.5 : 1 }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--ink)" }}>
                      {productNameMap.get(o.metadata?.product_id ?? "") ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>
                      {new Date(o.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "var(--ink-faded)" }}>
                      {formatCents(o.amount_cents ?? 0)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "var(--ink)" }}>
                      {o.status === "refunded" ? "Refunded" : formatCents(o.vendor_payout_cents ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
