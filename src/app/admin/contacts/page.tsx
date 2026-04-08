"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Contact { id: string; name: string; email: string; subject: string; message: string; created_at: string; }

function ContactsContent() {
  const { token } = useAdmin();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/contacts", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "8px" }}>
        {loading ? "Loading…" : `${contacts.length} message${contacts.length !== 1 ? "s" : ""}`}
      </div>
      {loading ? (
        <p style={{ color: "var(--ink-faded)" }}>Loading…</p>
      ) : contacts.length === 0 ? (
        <p style={{ color: "var(--ink-mute)" }}>No messages yet.</p>
      ) : contacts.map((c) => (
        <div key={c.id} style={{ border: "1px solid var(--line)", background: "var(--bg)" }}>
          <button
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{c.subject}</div>
              <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginTop: "2px" }}>
                {c.name} · {c.email} · {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
            <span style={{ color: "var(--ink-mute)", flexShrink: 0 }}>{expanded === c.id ? "▲" : "▼"}</span>
          </button>
          {expanded === c.id && (
            <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--line-soft)" }}>
              <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.7, marginTop: "16px", whiteSpace: "pre-wrap" }}>{c.message}</p>
              <a
                href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject)}`}
                className="btn btn-ghost btn-sm"
                style={{ display: "inline-block", marginTop: "16px" }}
              >
                Reply via Email
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ContactsPage() {
  return <AdminShell title="Contact Submissions"><ContactsContent /></AdminShell>;
}
