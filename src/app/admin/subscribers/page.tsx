"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Sub { id: string; email: string; source_page: string | null; created_at: string; }

function SubsContent() {
  const { token } = useAdmin();
  const [subs,    setSubs]    = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscribers", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setSubs(d.subscribers ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "24px" }}>
        {loading ? "Loading…" : `${subs.length} subscriber${subs.length !== 1 ? "s" : ""}`}
      </div>
      <div style={{ border: "1px solid var(--line)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
              {["Email", "Source", "Date"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>Loading…</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>No subscribers yet.</td></tr>
            ) : subs.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--line-soft)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--ink)" }}>{s.email}</td>
                <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>{s.source_page ?? "—"}</td>
                <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SubscribersPage() {
  return <AdminShell title="Newsletter Subscribers"><SubsContent /></AdminShell>;
}
