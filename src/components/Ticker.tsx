"use client";

import { mockProducts, mockBlogPosts, mockTrendingSearches } from "@/lib/mock-data";

interface TickerItem {
  label: string;
  text: string;
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
      });
    }
    if (mockBlogPosts[i]) {
      items.push({ label: "POST", text: mockBlogPosts[i].title });
    }
    if (mockTrendingSearches[i]) {
      items.push({ label: "TRENDING", text: mockTrendingSearches[i] });
    }
  }
  return items;
}

const items = buildItems();

export default function Ticker() {
  return (
    <div className="ticker-bar" aria-hidden="true">
      <div className="ticker-track">
        {/* Content duplicated to create a seamless loop */}
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 24px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--bg)",
            }}
          >
            <span style={{ opacity: 0.45, fontSize: "10px" }}>{item.label}</span>
            {item.text}
            <span
              style={{
                marginLeft: "16px",
                color: "rgba(244,244,242,0.25)",
                fontWeight: 300,
              }}
            >
              │
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
