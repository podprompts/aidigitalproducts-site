"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Post {
  id: string; slug: string; title: string; category: string; excerpt: string; body: string;
  status: "draft" | "published" | "discarded"; topic_type: string; created_at: string; published_at: string | null;
}

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  draft: { color: "#8a6d1a", bg: "#fff8e1" },
  published: { color: "#166534", bg: "#eaf6ec" },
  discarded: { color: "#555", bg: "#eee" },
};

function PostRow({ post, token, onChanged }: { post: Post; token: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [category, setCategory] = useState(post.category);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [body, setBody] = useState(post.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action: string, extra?: Record<string, string>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: adminHeaders(token),
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const st = STATUS_COLOR[post.status] ?? STATUS_COLOR.draft;
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: "13px", fontFamily: "inherit",
    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)", boxSizing: "border-box",
  };

  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--bg)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", gap: "16px" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{post.title}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginTop: "2px" }}>
            {post.category} · {post.topic_type} · {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: st.color, background: st.bg, flexShrink: 0 }}>
          {post.status}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--line-soft)", display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...inputStyle, marginTop: "6px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, marginTop: "6px" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Excerpt</label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} style={{ ...inputStyle, marginTop: "6px", resize: "vertical" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} style={{ ...inputStyle, marginTop: "6px", resize: "vertical" }} />
          </div>
          {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            <button
              type="button" className="btn btn-ghost btn-sm" disabled={busy}
              onClick={() => act("edit", { title, category, excerpt, postBody: body })}
            >
              Save Edits
            </button>
            {post.status === "draft" && (
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act("publish")}>
                Publish
              </button>
            )}
            {post.status !== "discarded" && (
              <button
                type="button" className="btn btn-ghost btn-sm" disabled={busy}
                onClick={() => { if (window.confirm("Discard this post?")) act("discard"); }}
              >
                Discard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BlogAdminContent() {
  const { token } = useAdmin();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/blog", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function generateNow() {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/admin/blog/generate", { method: "POST", headers: adminHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Generation failed.");
      load();
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const pendingDraft = posts.find((p) => p.status === "draft");

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
          {loading ? "Loading…" : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={generating || !!pendingDraft} onClick={generateNow}>
          {generating ? "Generating…" : pendingDraft ? "A draft is already pending" : "Generate New Draft Now"}
        </button>
      </div>
      {genError && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e", marginBottom: "12px" }}>{genError}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {loading ? (
          <p style={{ color: "var(--ink-faded)" }}>Loading…</p>
        ) : posts.length === 0 ? (
          <p style={{ color: "var(--ink-mute)" }}>No posts yet — generate one to get started.</p>
        ) : (
          posts.map((p) => <PostRow key={p.id} post={p} token={token} onChanged={load} />)
        )}
      </div>
    </div>
  );
}

export default function BlogAdminPage() {
  return <AdminShell title="Blog"><BlogAdminContent /></AdminShell>;
}