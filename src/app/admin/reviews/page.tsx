"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface AdminReview {
  id: string;
  product_id: string;
  product_name: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  vendor_response: string | null;
  vendor_response_at: string | null;
  is_hidden: boolean;
  created_at: string;
}

type Tab = "all" | "visible" | "hidden";

function stars(n: number): string {
  return "\u2605".repeat(n) + "\u2606".repeat(Math.max(0, 5 - n));
}

function ReviewsContent() {
  const { token } = useAdmin();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/reviews", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function toggle(r: AdminReview) {
    const hide = !r.is_hidden;
    let reason = "";
    if (hide) {
      const input = window.prompt(
        "Hide this review? It disappears from the public product page and no longer counts toward the product's rating.\n\nOptional: type a reason to include in the email to the seller, or leave blank."
      );
      if (input === null) return;
      reason = input.trim();
    } else {
      const ok = window.confirm(
        "Unhide this review? It returns to the public product page and counts toward the rating again."
      );
      if (!ok) return;
    }

    setActingId(r.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}`, {
        method: "PATCH",
        headers: adminHeaders(token),
        body: JSON.stringify({ hidden: hide, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update review");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function removeReply(r: AdminReview) {
    const input = window.prompt(
      "Remove the seller's reply? The review and rating stay as they are, and the seller can write a new reply.\n\nOptional: type a reason to include in the email to the seller, or leave blank."
    );
    if (input === null) return;
    const reason = input.trim();

    setActingId(r.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}/reply`, {
        method: "DELETE",
        headers: adminHeaders(token),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove reply");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  const counts = {
    all: reviews.length,
    visible: reviews.filter((r) => !r.is_hidden).length,
    hidden: reviews.filter((r) => r.is_hidden).length,
  };
  const shown = reviews.filter((r) => tab === "all" || (tab === "hidden" ? r.is_hidden : !r.is_hidden));

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid var(--line)" }}>
        {(["all", "visible", "hidden"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px", fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
              textTransform: "capitalize", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid var(--ink)" : "2px solid transparent",
              color: tab === t ? "var(--ink)" : "var(--ink-mute)", cursor: "pointer", marginBottom: "-1px",
            }}
          >
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!loading && shown.length === 0 && (
          <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No {tab === "all" ? "" : tab + " "}reviews.</p>
        )}
        {shown.map((r) => (
          <div key={r.id} style={{ border: "1px solid var(--line)", padding: "20px", opacity: r.is_hidden ? 0.75 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  {r.product_name}
                </div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>
                  {r.reviewer_name || "Anonymous"}{" "}
                  <span style={{ color: "#c7a24c", fontWeight: 700, marginLeft: "6px" }}>{stars(r.rating)}</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginTop: "4px" }}>
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              {r.is_hidden && (
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: "#c0392b", background: "#fdecea" }}>
                  Hidden
                </span>
              )}
            </div>

            {r.comment ? (
              <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6, marginBottom: "12px" }}>{r.comment}</p>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "12px" }}>(Rating only, no comment)</p>
            )}

            {r.vendor_response && (
              <div style={{ padding: "10px 14px", background: "var(--bg-alt)", border: "1px solid var(--line)", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                  Seller reply
                </div>
                <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                  {r.vendor_response}
                </p>
                <button
                  onClick={() => removeReply(r)}
                  disabled={actingId === r.id}
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: "10px", color: "#c0392b" }}
                >
                  {actingId === r.id ? "Working..." : "Remove reply"}
                </button>
              </div>
            )}

            <button
              onClick={() => toggle(r)}
              disabled={actingId === r.id}
              className="btn btn-ghost btn-sm"
              style={r.is_hidden ? undefined : { color: "#c0392b" }}
            >
              {actingId === r.id ? "Working..." : r.is_hidden ? "Unhide" : "Hide"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminShell title="Customer Reviews">
      <ReviewsContent />
    </AdminShell>
  );
}