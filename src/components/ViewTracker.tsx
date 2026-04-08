"use client";

import { useEffect, useRef } from "react";

export default function ViewTracker({ productId }: { productId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    fetch("/api/products/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch(() => {
      // fire-and-forget — tracking failures are non-fatal
    });
  }, [productId]);

  return null;
}
