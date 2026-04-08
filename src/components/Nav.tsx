"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
  { label: "Browse Products", href: "/products" },
  { label: "Start Selling",   href: "/sell"     },
];

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  sale_price_cents: number;
}

export default function Nav() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false);
    setSearch("");
    setResults([]);
  }, [pathname]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    setOpen(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, doSearch]);

  const handleResultClick = (slug: string) => {
    setOpen(false);
    setSearch("");
    setResults([]);
    router.push(`/products/${slug}`);
  };

  const close = () => setMenuOpen(false);
  const showDropdown = open && search.length >= 2;

  return (
    <>
      <nav className="nav" style={{ top: pathname === "/" ? "36px" : 0 }}>
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
        <div
          ref={wrapperRef}
          className="nav-search-wrapper"
          style={{ position: "relative" }}
        >
          {/* Input + icon row */}
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              className="nav-search"
              type="search"
              placeholder="Search products, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (results.length > 0 || search.length >= 2) setOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
              }}
              aria-label="Search"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              style={{ paddingRight: "36px" }}
            />
            {/* Magnifying glass icon */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => inputRef.current?.focus()}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: "var(--ink-mute)",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-mute)")}
            >
              <SearchIcon />
            </button>
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              role="listbox"
              className="search-dropdown"
            >
              {searching && (
                <div className="search-dropdown-status">Searching…</div>
              )}

              {!searching && results.length === 0 && (
                <div className="search-dropdown-status">No products found</div>
              )}

              {!searching && results.map((r) => (
                <button
                  key={r.id}
                  role="option"
                  type="button"
                  className="search-result-item"
                  onClick={() => handleResultClick(r.slug)}
                >
                  <span className="search-result-meta">{r.category}</span>
                  <span className="search-result-name">{r.name}</span>
                  <span className="search-result-price">
                    ${(r.sale_price_cents / 100).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
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

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
