"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Contact { id: string; name: string; email: string; subject: string; message: string; created_at: string; admin_reply: string | null; replied_at: string | null; }

function ContactsContent() {
  const { token } = useAdmin();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    fetch("/api/admin/contacts", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => { setContacts(d.contacts ?? []); setPage(1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const totalPages = Math.max(1, Math.ceil(contacts.length / PAGE_SIZE));
  const pageContacts = contacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "8px" }}>
        {loading ? "Loading…" : `${contacts.length} message${contacts.length !== 1 ? "s" : ""}`}
      </div>
      {loading ? (
        <p style={{ color: "var(--ink-faded)" }}>Loading…</p>
      ) : contacts.length === 0 ? (
        <p style={{ color: "var(--ink-mute)" }}>No messages yet.</p>
      ) : pageContacts.map((c) => (
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
<ContactReplyBox
                contact={c}
                token={token}
                onSent={(updated) => setContacts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
              />
            </div>
          )}
        </div>
      ))}
      {!loading && contacts.length > PAGE_SIZE && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ContactReplyBox({
  contact,
  token,
  onSent,
}: {
  contact: Contact;
  token: string;
  onSent: (updated: Contact) => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/contacts/${contact.id}/reply`, {
        method: "POST",
        headers: adminHeaders(token),
        body: JSON.stringify({ reply: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send reply.");
      onSent(data.contact);
      setText("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (contact.replied_at) {
    return (
      <div style={{ marginTop: "16px", padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
          Your reply, sent {new Date(contact.replied_at).toLocaleString()}
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
          {contact.admin_reply}
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="Write a reply..."
        style={{ width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit", border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)", boxSizing: "border-box", resize: "vertical", marginBottom: "10px" }}
      />
      {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e", marginBottom: "10px" }}>{error}</p>}
      <button type="button" className="btn btn-primary btn-sm" disabled={sending || !text.trim()} onClick={send}>
        {sending ? "Sending..." : "Send Reply"}
      </button>
    </div>
  );
}

export default function ContactsPage() {
  return <AdminShell title="Contact Submissions"><ContactsContent /></AdminShell>;
}
