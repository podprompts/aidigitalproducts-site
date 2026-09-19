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
  vendor_id: string | null;
  platform_fee_cents: number | null;
  vendor_payout_cents: number | null;
  dispute_status: string | null;
  disputed_at: string | null;
}

function OrdersContent() {
  const { token } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/orders", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleRefund(order: Order) {
    const confirmed = window.confirm(
      `Refund this $${((order.amount_cents ?? 0) / 100).toFixed(2)} order for ${order.email ?? "this customer"}? ` +
      `This cannot be undone.` +
      (order.vendor_id ? ` The vendor's payout for this order will also be reversed.` : "")
    );
    if (!confirmed) return;

    setRefundingId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
      </div>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ border: "1px solid var(--line)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
              {["Email", "Amount", "Status", "Date", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>No orders yet.</td></tr>
            ) : orders.map((o, i) => {
              const isRefunded = o.status === "refunded";
              const isDisputed = !!o.dispute_status;
              const hasSplit = !!o.vendor_id && o.platform_fee_cents != null;

              return (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--line-soft)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)" }}>
                  <td style={{ padding: "10px 14px", color: "var(--ink)" }}>{o.email ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--ink)" }}>
                    {o.amount_cents != null ? `$${(o.amount_cents / 100).toFixed(2)}` : "—"}
                    {hasSplit && (
                      <div style={{ fontSize: "11px", fontWeight: 400, color: "var(--ink-mute)", marginTop: "2px" }}>
                        Fee: ${((o.platform_fee_cents ?? 0) / 100).toFixed(2)} · Vendor: ${((o.vendor_payout_cents ?? 0) / 100).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: isRefunded ? "#8a6d1a" : o.status === "paid" ? "#16a34a" : "var(--ink-mute)", textTransform: "uppercase" }}>
                      {o.status ?? "—"}
                    </span>
                    {isDisputed && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#c0392b", textTransform: "uppercase", marginTop: "2px" }}>
                        Disputed: {o.dispute_status}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {!isRefunded && (
                      <button
                        onClick={() => handleRefund(o)}
                        disabled={refundingId === o.id}
                        className="btn btn-ghost btn-sm"
                        style={{ color: "#c0392b", opacity: refundingId === o.id ? 0.6 : 1 }}
                      >
                        {refundingId === o.id ? "Refunding…" : "Refund"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
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