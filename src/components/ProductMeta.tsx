import React from "react";

interface Props {
  rating?: number;
  reviewCount?: number;
  price: number;
  purchases?: number;
}

export default function ProductMeta({ rating, reviewCount, price, purchases }: Props) {
  const showRating = typeof rating === "number" && rating > 0;
  const showPurchases = typeof purchases === "number" && purchases > 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
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
            fontSize: "11px",
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
        <span style={{ fontSize: "9px", color: "var(--ink-soft)", lineHeight: 1 }}>·</span>
      )}

      {/* Price — slightly larger than surrounding meta text */}
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

      {/* Dot separator between price and purchase count */}
      {showPurchases && (
        <span style={{ fontSize: "9px", color: "var(--ink-soft)", lineHeight: 1 }}>·</span>
      )}

      {/* Purchase count in parentheses */}
      {showPurchases && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--ink-faded)",
            letterSpacing: "0.04em",
          }}
        >
          ({purchases})
        </span>
      )}
    </div>
  );
}