"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  expiresAt: string;
  onExpire: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: Props) {
  const expiry = new Date(expiresAt).getTime();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((expiry - Date.now()) / 1000))
  );
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiry]);

  if (secondsLeft === 0) return null;

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
