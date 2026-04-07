import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sell — AI Digital Products",
  description:
    "List your AI digital products on the fastest-growing AI marketplace. Free to list. 30% per sale. Paid weekly.",
};

const howItWorks = [
  {
    num: "01",
    heading: "Free to List",
    body: "No upfront fees. No monthly subscriptions. List as many products as you want.",
  },
  {
    num: "02",
    heading: "30% Per Sale",
    body: "We only earn when you earn. One flat rate on every transaction.",
  },
  {
    num: "03",
    heading: "Weekly Payouts",
    body: "Hit $50 in sales and get paid every Friday. Direct to your bank.",
  },
];

export default function SellPage() {
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
              — For Sellers —
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
              List your AI.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Reach buyers.</span>
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
              A direct path from product to payout. No gatekeeping.
            </p>
          </div>
        </section>

        {/* How it works — 3-cell grid */}
        <section className="block">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              — How it works —
            </div>
            <div className="catalog-grid">
              {howItWorks.map((item) => (
                <div
                  key={item.num}
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
                    {item.num}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      letterSpacing: "-0.025em",
                      color: "var(--ink)",
                    }}
                  >
                    {item.heading}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--ink-faded)",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mid-page statement */}
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
              Built for the new way.
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
              The line between AI-generated and human-made has blurred in digital work. This
              marketplace does not draw that line. It makes room for both. What matters is whether
              the product delivers what it promises.
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
            Your product.{" "}
            <span style={{ color: "var(--ink-mute)" }}>Your terms.</span>
          </h2>
          <p
            style={{
              marginTop: "28px",
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--ink-faded)",
            }}
          >
            List today. Earn from the first sale.
          </p>
          <a
            href="#"
            className="btn btn-primary"
            style={{ marginTop: "44px", display: "inline-block" }}
          >
            Become a Seller
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
