import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

const footerGroups = [
  {
    label: "Marketplace",
    links: [
      { label: "Products",   href: "/products"   },
      { label: "Categories", href: "/categories" },
      { label: "Sell",       href: "/sell"        },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About",   href: "/about"   },
      { label: "Blog",    href: "/blog"    },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Terms",   href: "/terms"   },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        background: "var(--bg)",
      }}
    >
      {/* Newsletter */}
      <NewsletterSignup />

      {/* Columns */}
      <div
        style={{
          padding: "64px clamp(24px, 5vw, 64px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "48px",
        }}
      >
        {/* Left — brand + copy */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link
            href="/"
            style={{
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.02em",
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
            AI Digital Products
          </Link>
          <div
            style={{
              fontSize: "11px",
              color: "var(--ink-mute)",
              fontWeight: 600,
            }}
          >
            © 2026 AI Digital Products — All rights reserved.
          </div>
        </div>

        {/* Right — grouped links */}
        <div className="footer-cols">
          {footerGroups.map((group) => (
            <div
              key={group.label}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {group.label}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
