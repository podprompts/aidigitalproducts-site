"use client";

import { useState } from "react";
import Link from "next/link";
import { mockProducts, mockBlogPosts, mockTrendingSearches } from "@/lib/mock-data";

interface TickerItem {
  label: string;
  text: string;
  href: string;
}

function buildItems(): TickerItem[] {
  const items: TickerItem[] = [];
  const max = Math.max(
    mockProducts.length,
    mockBlogPosts.length,
    mockTrendingSearches.length
  );
  for (let i = 0; i < max; i++) {
    if (mockProducts[i]) {
      items.push({
        label: "NEW",
        text: `${mockProducts[i].title} — $${mockProducts[i].price}`,
        href: `/products/${mockProducts[i].slug}`,
      });
    }
    if (mockBlogPosts[i]) {
      items.push({
        label: "POST",
        text: mockBlogPosts[i].title,
        href: `/blog/${mockBlogPosts[i].slug}`,
      });
    }
    if (mockTrendingSearches[i]) {
      items.push({
        label: "TRENDING",
        text: mockTrendingSearches[i],
        href: `/products?q=${encodeURIComponent(mockTrendingSearches[i])}`,
      });
    }
  }
  return items;
}

const items = buildItems();

export default function Ticker() {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`ticker-bar${paused ? " paused" : ""}`}
      aria-hidden="true"
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      <div className="ticker-track">
        {[...items, ...items].map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="ticker-item"
          >
            <span className="ticker-label">{item.label}</span>
            <span className="ticker-text">{item.text}</span>
            <span className="ticker-sep">│</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
