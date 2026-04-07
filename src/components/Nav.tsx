"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Sell",     href: "/sell"     },
  { label: "Pricing",  href: "/pricing"  },
  { label: "About",    href: "/about"    },
  { label: "Blog",     href: "/blog"     },
  { label: "Contact",  href: "/contact"  },
];

export default function Nav() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav className="nav">
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.02em",
            color: "var(--ink)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          AI
          <Dot />
          DIGITAL
          <Dot />
          PRODUCTS
        </Link>

        {/* Search */}
        <div className="nav-search-wrapper">
          <input
            className="nav-search"
            type="search"
            placeholder="Search products, categories, sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
        </div>

        {/* Desktop links */}
        <ul className="flex items-center gap-9 list-none" style={{ flexShrink: 0 }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <li key={link.href} className="nav-mobile-hide">
                <Link
                  href={link.href}
                  className={`nav-link${isActive ? " nav-link-active" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/sell" className="nav-cta-link">Get Started</Link>
          </li>
        </ul>

        {/* Hamburger (mobile only) */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <div className="nav-hamburger-bar" />
          <div className="nav-hamburger-bar" />
          <div className="nav-hamburger-bar" />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div className={`nav-overlay${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <button className="nav-overlay-close" onClick={close} aria-label="Close menu">
          ×
        </button>
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-overlay-link${isActive ? " nav-overlay-link-active" : ""}`}
              onClick={close}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/sell"
          className="btn btn-primary"
          style={{ marginTop: "8px" }}
          onClick={close}
        >
          Get Started
        </Link>
      </div>
    </>
  );
}

function Dot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "4px",
        height: "4px",
        background: "var(--ink)",
        borderRadius: "50%",
        margin: "0 3px 3px 2px",
        verticalAlign: "middle",
      }}
    />
  );
}
