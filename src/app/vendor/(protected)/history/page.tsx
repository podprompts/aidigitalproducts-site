import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ApprovedChange { label: string; oldValue: string; newValue: string }

export default async function VendorHistoryPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: logs } = await supabaseAdmin
    .from("product_review_log")
    .select("id, product_id, approved_changes, rejected_reason, rejected_fields, created_at")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const productIds = [...new Set((logs ?? []).map((l) => l.product_id).filter(Boolean))];
  let productNames: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabaseAdmin.from("products").select("id, name").in("id", productIds);
    productNames = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "8px" }}>
        Review History
      </h1>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px" }}>
        A permanent record of every decision made on your submitted edits — this stays here even
        after the notice at the top of the edit page has cleared.
      </p>

      {(!logs || logs.length === 0) && (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No review history yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {(logs ?? []).map((log) => {
          const approved = (log.approved_changes as ApprovedChange[] | null) ?? [];
          const rejectedFields = (log.rejected_fields as string[] | null) ?? [];
          return (
            <div key={log.id} style={{ border: "1px solid var(--line)", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>
                  {productNames[log.product_id] ?? "Unknown product"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>

              {approved.length > 0 && (
                <div
                  style={{
                    background: "#eaf6ec", border: "1px solid #9dd6a8", padding: "10px 14px",
                    fontSize: "13px", color: "#1e5e2f", marginBottom: log.rejected_reason ? "8px" : 0,
                  }}
                >
                  <strong>Approved:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                    {approved.map((c, i) => (
                      <li key={i}>{c.label}: {c.oldValue} → {c.newValue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {log.rejected_reason && (
                <div style={{ background: "#fdecea", border: "1px solid #e5a19a", padding: "10px 14px", fontSize: "13px", color: "#7a2e26" }}>
                  <strong>Declined:</strong> {rejectedFields.join(", ") || "—"}
                  <br />
                  Reason: {log.rejected_reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}