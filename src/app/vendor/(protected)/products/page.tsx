import Link from "next/link";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, sale_price_cents, purchases, is_active")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  const list = products ?? [];
  const totalRevenueCents = list.reduce(
    (sum, p) => sum + (p.sale_price_cents ?? 0) * (p.purchases ?? 0),
    0
  );

  return (
    <div>
      <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "8px" }}>
        Your Products
      </h1>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", maxWidth: "560px" }}>
        Estimated revenue: <strong>${(totalRevenueCents / 100).toFixed(2)}</strong> — based on
        current price × total purchases. This is an estimate, not a precise historical figure,
        since it doesn't account for past price changes or license type.
      </p>

      <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--line)" }}>
        {list.length === 0 && (
          <div style={{ padding: "20px", fontSize: "14px", color: "var(--ink-faded)" }}>
            No products linked to your account yet.
          </div>
        )}
        {list.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid var(--line)",
              fontSize: "14px",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{p.name}</div>
              <div style={{ color: "var(--ink-mute)", fontSize: "12px", marginTop: "2px" }}>
                ${((p.sale_price_cents ?? 0) / 100).toFixed(2)} · {p.purchases ?? 0} purchases ·{" "}
                {p.is_active ? "Active" : "Inactive"}
              </div>
            </div>
            <Link href={`/vendor/products/${p.id}/edit`} className="btn btn-ghost btn-sm">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}