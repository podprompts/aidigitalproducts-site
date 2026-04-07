"use client";

import { useEffect, useState } from "react";

export default function StickyBuyBar({ price }: { price: number }) {
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
      <a href="#" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "13px" }}>
        Buy Now
      </a>
    </div>
  );
}
