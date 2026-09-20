"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Application {
  id: string;
  email: string;
  name: string | null;
  business_name: string | null;
  portfolio_url: string | null;
  product_types: string[] | null;
  message: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

function SellerApplicationsContent() {
  const { token } = useAdmin();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/seller-applications", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setApplications(d.applications ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleApprove(app: Application) {
    const confirmed = window.confirm(
      `Approve ${app.name ?? app.email}? This creates a real vendor account and emails them a link to set their password.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/approve`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      }
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  function startReject(app: Application) {
    setRejectingId(app.id);
    setRejectReason("");
    setError("");
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectReason("");
  }

  async function submitReject(app: Application) {
    if (!rejectReason.trim()) {
      setError("A rejection reason is required — it's sent directly to the applicant.");
      return;
    }

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/reject`, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      if (data.warning) {
        setNotice(data.warning);
      } else {
        setNotice(`Rejection sent to ${app.email}.`);
      }
      setRejectingId(null);
      setRejectReason("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleResend(app: Application) {
    const confirmed = window.confirm(
      `Send a fresh set-password link to ${app.name ?? app.email}? This replaces any earlier link they may have.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/resend-welcome`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resend");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      } else {
        setNotice(`Sent a fresh link to ${app.email}.`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${applications.length} application${applications.length !== 1 ? "s" : ""}`}
      </div>

      {notice && (
        <p style={{ fontSize: "13px", color: "#166534", marginBottom: "16px", wordBreak: "break-all" }}>{notice}</p>
      )}
      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!loading && applications.length === 0 && (
          <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No applications yet.</p>
        )}
        {applications.map((app) => (
          <div key={app.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>
                  {app.name ?? "(no name given)"} {app.business_name && <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>· {app.business_name}</span>}
                </div>
                <div style={{ fontSize: "13px", color: "var(--ink-faded)" }}>{app.email}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginTop: "4px" }}>
                  Applied {new Date(app.created_at).toLocaleString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px",
                  color: app.status === "approved" ? "#166534" : app.status === "rejected" ? "#c0392b" : "#8a6d1a",
                  background: app.status === "approved" ? "#eaf6ec" : app.status === "rejected" ? "#fdecea" : "#fff8e1",
                }}
              >
                {app.status}
              </span>
            </div>

            {app.product_types && app.product_types.length > 0 && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "8px" }}>
                <strong style={{ color: "var(--ink)" }}>Sells:</strong> {app.product_types.join(", ")}
              </div>
            )}
            {app.portfolio_url && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "8px" }}>
                <strong style={{ color: "var(--ink)" }}>Portfolio:</strong>{" "}
                <a href={app.portfolio_url} target="_blank" rel="noreferrer" style={{ color: "var(--ink)" }}>
                  {app.portfolio_url}
                </a>
              </div>
            )}
            {app.message && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "12px" }}>
                <strong style={{ color: "var(--ink)" }}>Message:</strong> {app.message}
              </div>
            )}
            {app.status === "rejected" && app.rejection_reason && (
              <div style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px", background: "#fdecea", padding: "10px 14px" }}>
                <strong>Rejection reason sent:</strong> {app.rejection_reason}
              </div>
            )}

            {app.status === "pending" && rejectingId !== app.id && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleApprove(app)}
                  disabled={actingId === app.id}
                  className="btn btn-primary btn-sm"
                >
                  {actingId === app.id ? "Working…" : "Approve"}
                </button>
                <button
                  onClick={() => startReject(app)}
                  disabled={actingId === app.id}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#c0392b" }}
                >
                  Reject
                </button>
              </div>
            )}

            {app.status === "pending" && rejectingId === app.id && (
              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Rejection reason — this is emailed directly to the applicant
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. We're not currently accepting products in this category, or your samples didn't meet our quality guidelines. Be specific about what they'd need to change to reapply successfully."
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
                    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
                    resize: "vertical", boxSizing: "border-box", marginBottom: "10px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => submitReject(app)}
                    disabled={actingId === app.id}
                    className="btn btn-primary btn-sm"
                    style={{ background: "#c0392b", borderColor: "#c0392b" }}
                  >
                    {actingId === app.id ? "Sending…" : "Send Rejection"}
                  </button>
                  <button onClick={cancelReject} disabled={actingId === app.id} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {app.status === "approved" && (
              <button
                onClick={() => handleResend(app)}
                disabled={actingId === app.id}
                className="btn btn-ghost btn-sm"
              >
                {actingId === app.id ? "Sending…" : "Resend Welcome Email"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellerApplicationsPage() {
  return (
    <AdminShell title="Seller Applications">
      <SellerApplicationsContent />
    </AdminShell>
  );
}