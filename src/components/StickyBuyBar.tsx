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

  // Start with the static props passed from the server page.
  // PriceAndBuySection will broadcast the real active price once
  // the timer resolves, and we update from there.
  const [activePrice, setActivePrice] = useState(price);
  const [activePriceId, setActivePriceId] = useState(priceId);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Listen for price changes broadcast by PriceAndBuySection
  useEffect(() => {
    const handler = (e: Event) => {
      const { price: newPrice, priceId: newPriceId } = (e as CustomEvent).detail;
      setActivePrice(newPrice);
      setActivePriceId(newPriceId);
    };
    window.addEventListener("activePriceChange", handler);
    return () => window.removeEventListener("activePriceChange", handler);
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
        ${activePrice.toFixed(2)}
      </span>

      {activePriceId ? (
        <BuyButton
          priceId={activePriceId}
          productId={productId}
          productName={productName}
          productPrice={activePrice}
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