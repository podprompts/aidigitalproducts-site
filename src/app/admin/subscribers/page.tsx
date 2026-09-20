"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Sub { id: string; email: string; source_page: string | null; subscribed_at: string; }

const PAGE_SIZE = 20;

function escapeCsvField(value: string): string {
  // Wrap in quotes and escape any internal quotes by doubling them —
  // standard CSV quoting, handles commas/quotes in source_page safely.
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(subs: Sub[]) {
  const header = ["Email", "Source", "Subscribed Date"];
  const rows = subs.map((s) => [
    s.email,
    s.source_page ?? "",
    new Date(s.subscribed_at).toLocaleDateString(),
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SubsContent() {
  const { token } = useAdmin();
  const [subs,    setSubs]    = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    fetch("/api/admin/subscribers", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setSubs(d.subscribers ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const totalPages = Math.max(1, Math.ceil(subs.length / PAGE_SIZE));
  const pageSubs = subs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
          {loading ? "Loading…" : `${subs.length} subscriber${subs.length !== 1 ? "s" : ""}`}
        </div>
        {!loading && subs.length > 0 && (
          <button
            onClick={() => downloadCsv(subs)}
            className="btn btn-ghost btn-sm"
          >
            Download / Export CSV
          </button>
        )}
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
            ) : pageSubs.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--line-soft)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--ink)" }}>{s.email}</td>
                <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>{s.source_page ?? "—"}</td>
                <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>{new Date(s.subscribed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && subs.length > PAGE_SIZE && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-ghost btn-sm"
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-ghost btn-sm"
            style={{ opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function SubscribersPage() {
  return <AdminShell title="Newsletter Subscribers"><SubsContent /></AdminShell>;
}
