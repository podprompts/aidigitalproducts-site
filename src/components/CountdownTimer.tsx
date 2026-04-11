"use client";
 
import { useEffect, useRef, useState } from "react";
 
interface Props {
  expiresAt: string;
  onExpire: () => void;
  productId: string;
}
 
const RESET_SECONDS = 4 * 60 * 60;
 
function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
 
function getInitialResetSeconds(expiresAt: string): number {
  const resetEnd = new Date(expiresAt).getTime() + RESET_SECONDS * 1000;
  return Math.max(0, Math.floor((resetEnd - Date.now()) / 1000));
}
 
export default function CountdownTimer({ expiresAt, onExpire, productId }: Props) {
  const expiry = new Date(expiresAt).getTime();
 
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((expiry - Date.now()) / 1000))
  );
 
  const alreadyExpired = expiry <= Date.now();
  const [expired, setExpired] = useState(alreadyExpired);
 
  const [resetSeconds, setResetSeconds] = useState(() =>
    alreadyExpired ? getInitialResetSeconds(expiresAt) : RESET_SECONDS
  );
 
  const [email, setEmail]           = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
 
  const onExpireRef      = useRef(onExpire);
  const resetIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  onExpireRef.current    = onExpire;
 
  // Main sale countdown
  useEffect(() => {
    if (alreadyExpired) return;
    const intervalRef = { id: 0 as unknown as ReturnType<typeof setInterval> };
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(intervalRef.id);
        setExpired(true);
        setResetSeconds(RESET_SECONDS);
        onExpireRef.current();
      }
    };
    tick();
    intervalRef.id = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.id);
  }, [expiry, alreadyExpired]);
 
  // 4-hour reset countdown — reloads the page when it hits zero
  useEffect(() => {
    if (!expired) return;
    if (resetIntervalRef.current) clearInterval(resetIntervalRef.current);
 
    resetIntervalRef.current = setInterval(() => {
      setResetSeconds((s) => {
        if (s <= 1) {
          if (resetIntervalRef.current) {
            clearInterval(resetIntervalRef.current);
            resetIntervalRef.current = null;
          }
          // Try the API first; reload regardless so the sale phase restarts
          fetch(`/api/timer?productId=${encodeURIComponent(productId)}`)
            .then((r) => r.json())
            .then(() => {
              window.location.reload();
            })
            .catch(() => {
              window.location.reload();
            });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
 
    return () => {
      if (resetIntervalRef.current) {
        clearInterval(resetIntervalRef.current);
        resetIntervalRef.current = null;
      }
    };
  }, [expired, productId]);
 
  async function handleSubmit() {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email.");
      return;
    }
    setEmailError("");
    setSubmitting(true);
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, productId }),
      });
      setSubmitted(true);
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
 
  // Still counting down
  if (!expired && secondsLeft > 0) {
    const isUrgent = secondsLeft <= 900;
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
        Sale expires in: {formatTime(secondsLeft)}
      </p>
    );
  }
 
  // Sale ended state
  return (
    <div
      style={{
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid var(--line)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#e53e3e",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#e53e3e",
            flexShrink: 0,
            animation: "timer-pulse 1.5s ease-in-out infinite",
          }}
        />
        Sale ended
      </p>
 
      {resetSeconds > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-faded)",
              marginBottom: "6px",
            }}
          >
            Next sale starts in
          </p>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            {formatTime(resetSeconds)}
          </p>
        </div>
      )}
 
      {submitted ? (
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--ink-faded)",
            letterSpacing: "0.04em",
            animation: "fadeUp 0.4s ease both",
          }}
        >
          You're on the list — we'll email you when the sale opens.
        </p>
      ) : (
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-faded)",
              marginBottom: "10px",
            }}
          >
            Get notified when it drops
          </p>
 
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                flex: "1 1 180px",
                background: "transparent",
                border: "1px solid var(--ink-soft)",
                borderRadius: 0,
                padding: "10px 14px",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--ink)",
                fontFamily: "inherit",
                outline: "none",
                minWidth: 0,
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: "0 0 auto",
                background: "var(--ink)",
                color: "var(--bg)",
                border: "1px solid var(--ink)",
                borderRadius: 0,
                padding: "10px 18px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: submitting ? 0.6 : 1,
                transition: "opacity 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "Saving..." : "Notify me"}
            </button>
          </div>
 
          {emailError && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "11px",
                color: "#e53e3e",
                fontWeight: 600,
              }}
            >
              {emailError}
            </p>
          )}
 
          <p
            style={{
              marginTop: "10px",
              fontSize: "11px",
              color: "var(--ink-mute)",
              fontWeight: 500,
            }}
          >
            No spam. One email when the sale opens.
          </p>
        </div>
      )}
    </div>
  );
}