"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

function SuccessContent() {
  const searchParams  = useSearchParams();
  const sessionId     = searchParams.get("session_id");
  const [token,    setToken]    = useState<string | null>(null);
  const [polling,  setPolling]  = useState(!!sessionId);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      attempts.current += 1;
      try {
        const res  = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          setPolling(false);
          clearInterval(interval);
        }
      } catch {
        // ignore, keep polling
      }
      // Stop polling after ~30 seconds (15 attempts × 2s)
      if (attempts.current >= 15) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="page-hero">
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
              }}
            >
              — Order Confirmed —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(40px, 6vw, 80px)",
                lineHeight: 0.94,
                color: "var(--ink)",
              }}
            >
              You&apos;re all set.
            </h1>
            <p
              style={{
                marginTop: "28px",
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.6,
              }}
            >
              Your purchase is confirmed. Download your file below, or check your
              inbox — a link is on its way too.
            </p>

            {/* Download button area */}
            {sessionId && (
              <div
                style={{
                  marginTop: "40px",
                  padding: "28px 32px",
                  border: "1px solid var(--line)",
                  background: "var(--bg-alt)",
                  display: "inline-block",
                  minWidth: "300px",
                }}
              >
                {token ? (
                  <>
                    <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "16px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Your Download
                    </div>
                    <a
                      href={`/api/download/${token}`}
                      className="btn btn-primary"
                      style={{ display: "inline-block" }}
                    >
                      Download Your File
                    </a>
                    <p style={{ marginTop: "14px", fontSize: "12px", color: "var(--ink-mute)" }}>
                      Link valid for 7 days · up to 5 downloads
                    </p>
                  </>
                ) : polling ? (
                  <>
                    <div style={{ fontSize: "13px", color: "var(--ink-faded)", fontWeight: 500 }}>
                      Preparing your download…
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--ink-mute)" }}>
                      This usually takes just a moment.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "13px", color: "var(--ink-faded)", fontWeight: 500 }}>
                      Check your email for your download link.
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--ink-mute)" }}>
                      If it doesn&apos;t arrive, check your spam folder or contact support.
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: "44px", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/products" className="btn btn-primary">
                Browse More Products
              </Link>
              <Link href="/" className="btn btn-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
