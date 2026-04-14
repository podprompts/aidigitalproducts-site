"use client";

import { useState, useEffect } from "react";

interface Props {
  productId: string;
  salePrice?: number;
  regularPrice?: number;
  saleActive?: boolean;
}

export default function UrgencyBar({ productId, salePrice, regularPrice, saleActive }: Props) {
  const [stock, setStock] = useState<number | null>(null);
  const [cart, setCart]   = useState<number | null>(null);

  useEffect(() => {
    const stockKey = `stock_${productId}`;
    const cartKey  = `cart_${productId}`;

    const storedStock = sessionStorage.getItem(stockKey);
    const storedCart  = sessionStorage.getItem(cartKey);

    const s = storedStock ? parseInt(storedStock, 10) : Math.floor(Math.random() * 10) + 1;
    const c = storedCart  ? parseInt(storedCart,  10) : Math.floor(Math.random() * 25) + 1;

    if (!storedStock) sessionStorage.setItem(stockKey, String(s));
    if (!storedCart)  sessionStorage.setItem(cartKey,  String(c));

    setStock(s);
    setCart(c);
  }, [productId]);

  const discountPct =
    saleActive && salePrice && regularPrice && regularPrice > salePrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : null;

  if (stock === null) return null;

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px 16px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "2px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.4 }}>
        <span style={{ color: "#dc2626" }}>Only {stock} left</span>
        <span style={{ color: "#6b7280" }}> · in </span>
        <span style={{ color: "#d97706" }}>{cart} cart{cart !== 1 ? "s" : ""}</span>
      </div>
      {discountPct && (
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a" }}>
          {discountPct}% off · Limited time sale
        </div>
      )}
    </div>
  );
}