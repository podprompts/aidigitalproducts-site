"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";
import VendorAvatarBadge from "@/components/VendorAvatarBadge";

interface Vendor {
  id: string;
  display_name: string | null;
  business_name: string | null;
  email: string | null;
  is_active: boolean;
  stripe_account_id: string | null;
  avatar_url: string | null;
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  retrieveFailed?: boolean;
}

function VendorsContent() {
  const { token } = useAdmin();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/vendors-connect-status", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function handleOpenStripe(vendor: Vendor) {
    setOpeningId(vendor.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/vendors-connect-status/${vendor.id}/login-link`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open Stripe");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOpeningId(null);
    }
  }

  function statusBadge(v: Vendor) {
    if (!v.connected) {
      return <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase" }}>Not connected</span>;
    }
    if (v.retrieveFailed) {
      return <span style={{ fontSize: "11px", fontWeight: 700, color: "#c0392b", textTransform: "uppercase" }}>Error checking status</span>;
    }
    if (v.chargesEnabled && v.payoutsEnabled) {
      return <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Fully connected</span>;
    }
    return <span style={{ fontSize: "11px", fontWeight: 700, color: "#8a6d1a", textTransform: "uppercase" }}>Onboarding incomplete</span>;
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
      </div>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ border: "1px solid var(--line)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
              {["Vendor", "Email", "Stripe Connect Status", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>Loading…</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)" }}>No vendors yet.</td></tr>
            ) : vendors.map((v, i) => (
              <tr key={v.id} style={{ borderBottom: "1px solid var(--line-soft)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)" }}>
                <td style={{ padding: "10px 14px", color: "var(--ink)", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <VendorAvatarBadge url={v.avatar_url} size={28} alt={v.business_name || v.display_name || "Vendor"} />
                    <span>
                      {v.business_name || v.display_name || "—"}
                      {!v.is_active && <span style={{ marginLeft: "6px", fontSize: "10px", color: "var(--ink-mute)" }}>(inactive)</span>}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--ink-faded)" }}>{v.email ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>{statusBadge(v)}</td>
                <td style={{ padding: "10px 14px" }}>
                  {v.connected && (
                    <button
                      onClick={() => handleOpenStripe(v)}
                      disabled={openingId === v.id}
                      className="btn btn-ghost btn-sm"
                    >
                      {openingId === v.id ? "Opening…" : "View in Stripe →"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <AdminShell title="Vendors">
      <VendorsContent />
    </AdminShell>
  );
}
