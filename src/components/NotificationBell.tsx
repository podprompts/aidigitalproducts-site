"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Breakdown {
  [key: string]: number;
}

interface Props {
  countUrl: string;
  headers?: Record<string, string>;
  links: { key: string; label: string; href: string }[];
  pollMs?: number;
}

// Shared by both the admin and vendor headers. Polls a count endpoint and
// shows a red badge with the total; clicking opens a small dropdown listing
// each category with its own count and a link to the relevant page. The
// count reflects current pending state — it clears when the underlying
// item is actually resolved, not on "read."
export default function NotificationBell({ countUrl, headers, links, pollMs = 45000 }: Props) {
  const [total, setTotal] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(countUrl, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setTotal(data.total ?? 0);
          setBreakdown(data.breakdown ?? {});
        }
      } catch {
        // Silent — a failed poll just leaves the last known count showing.
      }
    }
    load();
    const id = setInterval(load, pollMs);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countUrl]);

  const hasNotifications = (total ?? 0) > 0;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={hasNotifications ? `${total} items need attention` : "No pending notifications"}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          color: "var(--ink-faded)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {hasNotifications && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              minWidth: "16px",
              height: "16px",
              padding: "0 4px",
              borderRadius: "999px",
              background: "#e53e3e",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {total! > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "260px",
              background: "var(--bg)",
              border: "1px solid var(--line)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100,
            }}
          >
            {!hasNotifications ? (
              <div style={{ padding: "16px", fontSize: "13px", color: "var(--ink-mute)" }}>Nothing needs attention.</div>
            ) : (
              links
                .filter((l) => (breakdown[l.key] ?? 0) > 0)
                .map((l) => (
                  <Link
                    key={l.key}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--line-soft)",
                      textDecoration: "none",
                      fontSize: "13px",
                      color: "var(--ink)",
                    }}
                  >
                    <span>{l.label}</span>
                    <span style={{ fontWeight: 700, color: "#e53e3e" }}>{breakdown[l.key]}</span>
                  </Link>
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}