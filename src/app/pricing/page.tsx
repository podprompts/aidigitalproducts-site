import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing — AI Digital Products",
  description:
    "Free to list. 30% per sale. Paid out weekly. Simple pricing for sellers on AI Digital Products.",
};

const pricingCells = [
  {
    num: "01",
    heading: "Free to List",
    body: "List as many products as you want. No upfront fees, no monthly subscriptions, no contracts.",
  },
  {
    num: "02",
    heading: "30% Per Sale",
    body: "We only earn when you earn. One flat rate on every transaction. No hidden cuts, no surprise charges.",
  },
  {
    num: "03",
    heading: "Weekly Payouts",
    body: "Hit $50 in sales and get paid every Friday. Direct to your bank. No waiting, no minimums beyond that.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "64px" }}>
        {/* Hero */}
        <section className="page-hero">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
              — Pricing —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 8vw, 112px)",
                lineHeight: 0.94,
                color: "var(--ink)",
                maxWidth: "900px",
                margin: "0 auto",
              }}
            >
              Simple pricing.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Built for sellers.</span>
            </h1>
            <p
              style={{
                marginTop: "28px",
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                maxWidth: "480px",
                margin: "28px auto 0",
                lineHeight: 1.6,
              }}
            >
              Free to list. 30% per sale. Paid out weekly. That&apos;s it.
            </p>
          </div>
        </section>

        {/* Pricing trio */}
        <section className="block">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="catalog-grid">
              {pricingCells.map((cell) => (
                <div
                  key={cell.num}
                  style={{
                    background: "var(--bg)",
                    padding: "56px 40px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--ink-mute)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {cell.num}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      letterSpacing: "-0.025em",
                      color: "var(--ink)",
                    }}
                  >
                    {cell.heading}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--ink-faded)",
                      lineHeight: 1.65,
                    }}
                  >
                    {cell.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statement section */}
        <section className="block alt">
          <div
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <h2
              className="display"
              style={{
                fontSize: "clamp(36px, 5.5vw, 72px)",
                lineHeight: 0.96,
                color: "var(--ink)",
                marginBottom: "28px",
              }}
            >
              Honest by design.
            </h2>
            <p
              style={{
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.65,
                maxWidth: "560px",
                margin: "0 auto",
              }}
            >
              Pricing should be the easiest part of your day. Ours is one number, no asterisks, no
              fine print. You sell, we handle the rest.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <h2
            className="display"
            style={{
              fontSize: "clamp(40px, 6vw, 88px)",
              lineHeight: 0.94,
              color: "var(--ink)",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            Ready when you are.
          </h2>
          <p
            style={{
              marginTop: "28px",
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--ink-faded)",
            }}
          >
            One flat rate. No contracts. Cancel any time.
          </p>
          <Link
            href="/sell"
            className="btn btn-primary"
            style={{ marginTop: "44px", display: "inline-block" }}
          >
            Start Selling →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
