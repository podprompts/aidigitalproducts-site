"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  productId: string;
  onExpire: () => void;
}

export default function CountdownTimer({ productId, onExpire }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function init() {
      try {
        const res = await fetch(`/api/timer?productId=${encodeURIComponent(productId)}`);
        if (!res.ok) return;
        const { expiresAt } = await res.json();
        const expiry = new Date(expiresAt).getTime();

        const tick = () => {
          const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
          setSecondsLeft(remaining);
          if (remaining === 0) {
            clearInterval(interval);
            onExpireRef.current();
          }
        };

        tick();
        interval = setInterval(tick, 1000);
      } catch {
        // Don't break the product page if the timer API fails
      }
    }

    init();
    return () => clearInterval(interval);
  }, [productId]);

  if (secondsLeft === null || secondsLeft === 0) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = secondsLeft <= 900; // 15 minutes

  return (
    <p
      style={{
        marginTop: "8px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: isUrgent ? "#e53e3e" : "var(--ink-faded)",
        animation: isUrgent ? "timer-pulse 1.5s ease-in-out infinite" : "none",
      }}
    >
      Sale expires in: {display}
    </p>
  );
}
