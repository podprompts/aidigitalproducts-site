"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Order {
  id: string;
  email: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
  metadata: { product_id?: string } | null;
}

function OrdersContent() {
  const { token } = useAdmin();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "24px" }}>
        {loading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
      </div>
      <div style={{ border: "1px solid var(--line)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
              {["Email", "Amount", "Status", "Date"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>No orders yet.</td></tr>
            ) : orders.map((o, i) => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--line-soft)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)" }}>
                <td style={{ padding: "10px 14px", color: "var(--ink)" }}>{o.email ?? "—"}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--ink)" }}>
                  {o.amount_cents != null ? `$${(o.amount_cents / 100).toFixed(2)}` : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: o.status === "paid" ? "#16a34a" : "var(--ink-mute)", textTransform: "uppercase" }}>
                    {o.status ?? "—"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AdminShell title="Orders">
      <OrdersContent />
    </AdminShell>
  );
}
