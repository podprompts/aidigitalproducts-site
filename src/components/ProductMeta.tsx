import React from "react";

interface Props {
  rating?: number;
  reviewCount?: number;
  price: number;
  purchases?: number;
}

function formatPurchases(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return `${n}`;
}

export default function ProductMeta({ rating, reviewCount, price, purchases }: Props) {
  const showRating = typeof rating === "number" && rating > 0;
  const showPurchases = typeof purchases === "number" && purchases > 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap",
        marginTop: "4px",
        lineHeight: 1,
      }}
    >
      {/* ★ 4.9 — star icon + rating number only, no review count, no label */}
      {showRating && (
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--ink-faded)",
            letterSpacing: "0.04em",
          }}
        >
          ★ {rating!.toFixed(1)}
        </span>
      )}

      {/* Dot separator between rating and price */}
      {showRating && (
        <span style={{ fontSize: "11px", color: "var(--ink-soft)", lineHeight: 1 }}>·</span>
      )}

      {/* Price */}
      <span
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        ${price.toFixed(2)}
      </span>

      {/* Purchase count in parentheses — same size as price */}
      {showPurchases && (
        <span
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--ink-faded)",
            letterSpacing: "-0.01em",
          }}
        >
          ({formatPurchases(purchases!)})
        </span>
      )}
    </div>
  );
}