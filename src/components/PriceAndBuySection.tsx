"use client";
 
import { useState, useEffect } from "react";
import BuyButton from "@/components/BuyButton";
import CountdownTimer from "@/components/CountdownTimer";
 
interface Props {
  productId: string;
  productName: string;
  /** The sale / current price in dollars */
  salePrice: number;
  /** Stripe Price ID for the sale price */
  salePriceId?: string;
  /** Regular price in dollars — if present, activates sale UI + timer */
  regularPrice?: number;
  /** Stripe Price ID used after the timer expires */
  regularPriceId?: string;
  description: string;
}
 
interface TimerState {
  saleActive: boolean;
  expiresAt: string | null;
}
 
export default function PriceAndBuySection({
  productId,
  productName,
  salePrice,
  salePriceId,
  regularPrice,
  regularPriceId,
  description,
}: Props) {
  const hasSale = !!(regularPrice && salePriceId && regularPriceId);
 
  // null = loading (server hasn't told us yet)
  const [timerState, setTimerState] = useState<TimerState | null>(null);
 
  useEffect(() => {
    if (!hasSale) {
      setTimerState({ saleActive: false, expiresAt: null });
      return;
    }
    fetch(`/api/timer?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data) => {
        setTimerState({
          saleActive: !!data.saleActive,
          expiresAt: data.expiresAt ?? null,
        });
      })
      .catch(() => {
        // On error, default to regular price (safer than falsely showing sale)
        setTimerState({ saleActive: false, expiresAt: null });
      });
  }, [productId, hasSale]);
 
  const saleActive = timerState?.saleActive ?? false;
 
  const activePriceId = hasSale && !saleActive ? regularPriceId : salePriceId;
  const activePrice = hasSale && !saleActive ? regularPrice! : salePrice;
 
  return (
    <>
      {/* ── Price block ── */}
      <div style={{ marginTop: "24px" }}>
        {timerState === null ? (
          // Loading — avoid flashing wrong price
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ink-faded)",
              lineHeight: 1,
            }}
          >
            —
          </div>
        ) : hasSale ? (
          <>
            {saleActive && (
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ink-faded)",
                  textDecoration: "line-through",
                  letterSpacing: "0.02em",
                  marginBottom: "4px",
                }}
              >
                Was ${regularPrice!.toFixed(2)}
              </p>
            )}
            <div
              style={{
                fontSize: "48px",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              ${activePrice.toFixed(2)}
            </div>
 
            {/* CountdownTimer stays mounted for the full sale + expired flow */}
            {timerState.expiresAt ? (
              <CountdownTimer
                expiresAt={timerState.expiresAt}
                onExpire={() =>
                  setTimerState({ saleActive: false, expiresAt: null })
                }
                productId={productId}
              />
            ) : null}
          </>
        ) : (
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            ${salePrice.toFixed(2)}
          </div>
        )}
      </div>
 
      {/* ── Description ── */}
      <p
        style={{
          marginTop: "20px",
          fontSize: "15px",
          fontWeight: 500,
          color: "var(--ink-faded)",
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>
 
      {/* ── Buy button ── */}
      <div
        style={{
          marginTop: "36px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {timerState === null ? null : activePriceId ? (
          <BuyButton
            priceId={activePriceId}
            productId={productId}
            productName={productName}
            productPrice={activePrice}
            label={`Buy Now — $${activePrice.toFixed(2)}`}
          />
        ) : (
          <span
            className="btn btn-primary"
            style={{ opacity: 0.45, cursor: "not-allowed" }}
          >
            Coming Soon
          </span>
        )}
      </div>
    </>
  );
}