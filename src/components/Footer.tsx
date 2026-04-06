"use client";

import { footerLinks } from "@/lib/content";

export default function Footer() {
  return (
    <footer
      style={{
        padding: "48px clamp(24px, 5vw, 64px)",
        borderTop: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "var(--ink-mute)",
          fontWeight: 600,
        }}
      >
        © 2026 AI Digital Products — All rights reserved.
      </div>

      <ul
        style={{
          display: "flex",
          gap: "28px",
          listStyle: "none",
        }}
      >
        {footerLinks.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              style={{
                fontSize: "11px",
                color: "var(--ink-faded)",
                textDecoration: "none",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "color 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-faded)";
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
