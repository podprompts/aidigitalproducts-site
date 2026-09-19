# Fixes the AdminContext hierarchy bug in the pending-reviews page.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
"use client";

import { useState, useEffect, useContext } from "react";
import AdminShell from "../AdminShell";
import { AdminContext } from "../AdminContext";

interface PendingProduct {
  id: string;
  name: string;
  slug: string;
  vendor_name: string;
  pending_changes: Record<string, unknown>;
  review_submitted_at: string;
}

export default function PendingReviewsPage() {
  return (
    <AdminShell title="Pending Reviews">
      <PendingReviewsContent />
    </AdminShell>
  );
}

function PendingReviewsContent() {
  const { token } = useContext(AdminContext);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/pending", {
        headers: { "x-admin-key": token ?? "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setProducts(data.products ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(id: string) {
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}/approve`, {
        method: "POST",
        headers: { "x-admin-key": token ?? "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}/reject`, {
        method: "POST",
        headers: { "x-admin-key": token ?? "", "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      setRejectingId(null);
      setRejectReason("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", maxWidth: "640px" }}>
        Vendor edits wait here until approved. The live site keeps showing each product&apos;s
        previously approved version until you act on its submission — approving or rejecting
        never causes a listing to disappear.
      </p>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      {loading && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Loading…</p>}

      {!loading && !error && products.length === 0 && (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Nothing pending review right now.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
                  Vendor: {p.vendor_name} · Submitted {new Date(p.review_submitted_at).toLocaleString()}
                </div>
              </div>
              <a
                href={`/products/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "12px", color: "var(--ink-faded)" }}
              >
                View live listing ↗
              </a>
            </div>

            <div
              style={{
                background: "var(--bg-alt)",
                border: "1px solid var(--line)",
                padding: "12px 16px",
                fontSize: "13px",
                marginBottom: "16px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace", fontSize: "12px" }}>
                {JSON.stringify(p.pending_changes, null, 2)}
              </pre>
            </div>

            {rejectingId === p.id ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--ink-soft)", fontSize: "13px" }}
                />
                <button
                  onClick={() => handleReject(p.id)}
                  disabled={actingId === p.id}
                  className="btn btn-primary btn-sm"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => { setRejectingId(null); setRejectReason(""); }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleApprove(p.id)}
                  disabled={actingId === p.id}
                  className="btn btn-primary btn-sm"
                >
                  {actingId === p.id ? "Working…" : "Approve"}
                </button>
                <button onClick={() => setRejectingId(p.id)} className="btn btn-ghost btn-sm">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\pending-reviews\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\pending-reviews\page.tsx" -ForegroundColor Green
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan