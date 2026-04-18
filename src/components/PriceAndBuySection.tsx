"use client";

import { useEffect, useState } from "react";
import BuyButton from "@/components/BuyButton";
import CountdownTimer from "@/components/CountdownTimer";
import UrgencyBar from "@/components/UrgencyBar";
import ProductMeta from "@/components/ProductMeta";

interface Props {
  productId: string;
  productName: string;
  salePrice: number;
  salePriceId?: string;
  regularPrice?: number;
  regularPriceId?: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  purchases?: number;
}

interface TimerState {
  saleActive: boolean;
  expiresAt: string | null;
}

function broadcastPrice(price: number, priceId: string | undefined) {
  window.dispatchEvent(
    new CustomEvent("activePriceChange", { detail: { price, priceId } })
  );
}

export default function PriceAndBuySection({
  productId,
  productName,
  salePrice,
  salePriceId,
  regularPrice,
  regularPriceId,
  description,
  rating,
  reviewCount,
  purchases,
}: Props) {
  const hasSale = !!(regularPrice && salePriceId && regularPriceId);

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
        setTimerState({ saleActive: false, expiresAt: null });
      });
  }, [productId, hasSale]);

  const saleActive    = timerState?.saleActive ?? false;
  const activePriceId = hasSale && !saleActive ? regularPriceId : salePriceId;
  const activePrice   = hasSale && !saleActive ? regularPrice!  : salePrice;

  useEffect(() => {
    if (timerState === null) return;
    broadcastPrice(activePrice, activePriceId);
  }, [activePrice, activePriceId, timerState]);

  return (
    <>
      {/* ── Review / price / purchases meta row ── */}
      <div style={{ marginTop: "24px" }}>
        <ProductMeta
          rating={rating}
          reviewCount={reviewCount}
          price={timerState === null ? salePrice : activePrice}
          purchases={purchases}
        />
      </div>

      {/* ── Price block ── */}
      <div style={{ marginTop: "12px" }}>
        {timerState === null ? (
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

            {timerState.expiresAt && (
              <CountdownTimer
                expiresAt={timerState.expiresAt}
                onExpire={() =>
                  setTimerState((prev) =>
                    prev ? { ...prev, saleActive: false } : prev
                  )
                }
                productId={productId}
                productName={productName}
                salePrice={`$${salePrice.toFixed(2)}`}
                wasPrice={regularPrice ? `$${regularPrice.toFixed(2)}` : ""}
              />
            )}
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

      {/* ── Urgency bar — only on purchasable products ── */}
      {timerState !== null && activePriceId && (
        <UrgencyBar
          productId={productId}
          salePrice={salePrice}
          regularPrice={regularPrice}
          saleActive={saleActive}
        />
      )}

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