"use client";

import { useEffect, useState } from "react";
import BuyButton from "@/components/BuyButton";

interface StickyBuyBarProps {
  price: number;
  priceId?: string;
  productId?: string;
  productName?: string;
}

export default function StickyBuyBar({ price, priceId, productId, productName }: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`sticky-buy-bar${visible ? " sticky-buy-bar--visible" : ""}`}>
      <span
        style={{
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        ${price}
      </span>

      {priceId ? (
        <BuyButton
          priceId={priceId}
          productId={productId}
          productName={productName}
          productPrice={price}
          label="Buy Now"
          className="btn btn-primary"
        />
      ) : (
        <span
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "13px", opacity: 0.45, cursor: "not-allowed" }}
        >
          Coming Soon
        </span>
      )}
    </div>
  );
}
