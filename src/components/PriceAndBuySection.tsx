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
  // PLR fields — new
  plrPrice?: number;
  plrPriceId?: string;
  isPlrAvailable?: boolean;
}

interface TimerState {
  saleActive: boolean;
  expiresAt: string | null;
}

type LicenseType = "personal" | "plr";

function broadcastPrice(price: number, priceId: string | undefined, licenseType: LicenseType) {
  window.dispatchEvent(
    new CustomEvent("activePriceChange", { detail: { price, priceId, licenseType } })
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
  plrPrice,
  plrPriceId,
  isPlrAvailable,
}: Props) {
  const hasSale = !!(regularPrice && salePriceId && regularPriceId);
  const plrAvailable = !!(isPlrAvailable && plrPriceId && plrPrice);

  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [licenseType, setLicenseType] = useState<LicenseType>("personal");
  const [plrAgreed, setPlrAgreed] = useState(false);

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

  const saleActive = timerState?.saleActive ?? false;

  // PLR is a fixed price tier — it never participates in the countdown/urgency
  // system. Personal-license pricing keeps all existing sale/regular behavior.
  const activePriceId =
    licenseType === "plr"
      ? plrPriceId
      : hasSale && !saleActive
      ? regularPriceId
      : salePriceId;

  const activePrice =
    licenseType === "plr"
      ? plrPrice!
      : hasSale && !saleActive
      ? regularPrice!
      : salePrice;

  useEffect(() => {
    if (timerState === null) return;
    broadcastPrice(activePrice, activePriceId, licenseType);
  }, [activePrice, activePriceId, licenseType, timerState]);

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

      {/* ── License toggle — only shown when this product offers PLR ── */}
      {plrAvailable && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            title="For your own use only — not for resale."
            aria-label="Personal License: for your own use only, not for resale"
            onClick={() => { setLicenseType("personal"); setPlrAgreed(false); }}
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              border: `1px solid ${licenseType === "personal" ? "var(--ink)" : "var(--ink-faded)"}`,
              background: licenseType === "personal" ? "var(--ink)" : "transparent",
              color: licenseType === "personal" ? "#fff" : "var(--ink-faded)",
              cursor: "pointer",
            }}
          >
            Personal License
          </button>
          <button
            type="button"
            title="Rebrand and resell as your own product."
            aria-label="PLR License: rebrand and resell as your own product"
            onClick={() => { setLicenseType("plr"); setPlrAgreed(false); }}
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              border: `1px solid ${licenseType === "plr" ? "var(--ink)" : "var(--ink-faded)"}`,
              background: licenseType === "plr" ? "var(--ink)" : "transparent",
              color: licenseType === "plr" ? "#fff" : "var(--ink-faded)",
              cursor: "pointer",
            }}
          >
            PLR License
          </button>
        </div>
      )}

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
        ) : licenseType === "plr" ? (
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            ${plrPrice!.toFixed(2)}
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

      {/* ── Urgency bar — personal-license only; PLR is a fixed price, no urgency mechanic ── */}
      {timerState !== null && activePriceId && licenseType === "personal" && (
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

      {licenseType === "plr" && (
        <div style={{ marginTop: "8px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--ink-faded)",
              marginBottom: "10px",
            }}
          >
            Includes PLR rights — rebrand and resell as your own.{" "}
            <a href="/plr-license" style={{ textDecoration: "underline" }}>
              View license terms
            </a>
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={plrAgreed}
              onChange={(e) => setPlrAgreed(e.target.checked)}
              style={{ marginTop: "3px", width: "15px", height: "15px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>
              I have read and agree to the PLR license terms.
            </span>
          </label>
        </div>
      )}

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
          licenseType === "plr" && !plrAgreed ? (
            <span
              className="btn btn-primary"
              style={{ opacity: 0.45, cursor: "not-allowed" }}
            >
              Check the box above to continue
            </span>
          ) : (
            <BuyButton
              priceId={activePriceId}
              productId={productId}
              productName={productName}
              productPrice={activePrice}
              licenseType={licenseType}
              label={
                licenseType === "plr"
                  ? `Buy PLR License — $${activePrice.toFixed(2)}`
                  : `Buy Now — $${activePrice.toFixed(2)}`
              }
            />
          )
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