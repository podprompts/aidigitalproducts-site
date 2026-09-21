"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";
import SupportThread, { type ThreadMessage } from "@/components/SupportThread";
import { REASON_LABELS } from "@/lib/support-constants";

interface AdminRequest {
  id: string;
  status: string;
  reason: string;
  escalation_reason: string | null;
  buyer_name: string;
  buyer_email: string;
  overdue: boolean;
  order_number: string;
  product_name: string;
  vendor_name: string;
  created_at: string;
  first_response_at: string | null;
  messages: ThreadMessage[];
}

type Tab = "attention" | "open" | "closed" | "all";

function SupportContent() {
  const { token } = useAdmin();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [tab, setTab] = useState<Tab>("attention");
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/support", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setItems(d.requests ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function act(r: AdminRequest, action: "reply" | "resolve" | "deny") {
    const message = (drafts[r.id] ?? "").trim();
    if ((action === "reply" || action === "deny") && !message) {
      setError(action === "deny" ? "Add a message explaining the decision." : "Type a message first.");
      return;
    }
    if (action !== "reply" && !window.confirm(action === "resolve" ? "Mark this request resolved?" : "Close this request without further action? The buyer is emailed your message.")) return;

    setActingId(r.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/support/${r.id}`, {
        method: "POST",
        headers: adminHeaders(token),
        body: JSON.stringify({ action, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDrafts((d) => ({ ...d, [r.id]: "" }));
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  const isClosed = (r: AdminRequest) => r.status === "resolved" || r.status === "denied";
  const counts = {
    attention: items.filter((r) => r.status === "escalated" || r.overdue).length,
    open: items.filter((r) => !isClosed(r)).length,
    closed: items.filter(isClosed).length,
    all: items.length,
  };
  const shown = items.filter((r) =>
    tab === "all" ? true : tab === "closed" ? isClosed(r) : tab === "open" ? !isClosed(r) : r.status === "escalated" || r.overdue
  );
  const tabLabel: Record<Tab, string> = { attention: "Needs attention", open: "Open", closed: "Closed", all: "All" };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        {(["attention", "open", "closed", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px", fontSize: "13px", fontWeight: 700, fontFamily: "inherit", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid var(--ink)" : "2px solid transparent",
              color: tab === t ? "var(--ink)" : "var(--ink-mute)", cursor: "pointer", marginBottom: "-1px",
            }}
          >
            {tabLabel[t]} ({counts[t]})
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!loading && shown.length === 0 && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Nothing here.</p>}
        {shown.map((r) => (
          <div key={r.id} style={{ border: "1px solid var(--line)", padding: "20px", opacity: isClosed(r) ? 0.75 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {r.product_name} &middot; {r.order_number}
                </div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)", marginTop: "6px" }}>
                  {r.buyer_name} <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>&middot; {r.buyer_email}</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginTop: "4px" }}>
                  Seller: {r.vendor_name} &middot; {REASON_LABELS[r.escalation_reason ?? r.reason] ?? r.reason} &middot; {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", flexWrap: "wrap" }}>
                {r.overdue && (
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: "#c0392b", background: "#fdecea" }}>Overdue</span>
                )}
                <span style={{
                  fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px",
                  color: r.status === "escalated" ? "#c0392b" : r.status === "resolved" ? "#166534" : r.status === "denied" ? "#555" : "#8a6d1a",
                  background: r.status === "escalated" ? "#fdecea" : r.status === "resolved" ? "#eaf6ec" : r.status === "denied" ? "#eee" : "#fff8e1",
                }}>
                  {r.status}
                </span>
              </div>
            </div>

            <SupportThread messages={r.messages} labels={{ buyer: r.buyer_name, seller: r.vendor_name, admin: "You (admin)" }} />

            {!isClosed(r) && (
              <div style={{ marginTop: "14px" }}>
                <textarea
                  value={drafts[r.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  rows={3}
                  maxLength={2000}
                  placeholder="Message to the buyer (emailed to them)"
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
                    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
                    resize: "vertical", boxSizing: "border-box", marginBottom: "10px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button className="btn btn-primary btn-sm" disabled={actingId === r.id} onClick={() => act(r, "reply")}>
                    {actingId === r.id ? "Working..." : "Reply"}
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={actingId === r.id} onClick={() => act(r, "resolve")}>
                    Resolve
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "#c0392b" }} disabled={actingId === r.id} onClick={() => act(r, "deny")}>
                    Deny
                  </button>
                  <a href="/admin/orders" className="btn btn-ghost btn-sm">Issue refund on Orders page</a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <AdminShell title="Support Requests">
      <SupportContent />
    </AdminShell>
  );
}