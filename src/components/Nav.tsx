"use client";

import { useState } from "react";
import Link from "next/link";

export default function Nav() {
  const [search, setSearch] = useState("");

  return (
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

      {/* Links */}
      <ul className="flex items-center gap-9 list-none" style={{ flexShrink: 0 }}>
        <li className="nav-mobile-hide">
          <Link href="/products" className="nav-link">Products</Link>
        </li>
        <li className="nav-mobile-hide">
          <Link href="/sell" className="nav-link">Sell</Link>
        </li>
        <li className="nav-mobile-hide">
          <Link href="/pricing" className="nav-link">Pricing</Link>
        </li>
        <li className="nav-mobile-hide">
          <Link href="/about" className="nav-link">About</Link>
        </li>
        <li className="nav-mobile-hide">
          <Link href="/blog" className="nav-link">Blog</Link>
        </li>
        <li className="nav-mobile-hide">
          <Link href="/contact" className="nav-link">Contact</Link>
        </li>
        <li>
          <Link href="/sell" className="nav-cta-link">Get Started</Link>
        </li>
      </ul>
    </nav>
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
