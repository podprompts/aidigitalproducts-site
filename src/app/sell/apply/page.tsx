import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SellerApplicationForm from "@/components/SellerApplicationForm";

export const metadata: Metadata = {
  title: "Seller Application — AI Digital Products",
  description:
    "Apply to sell your AI digital products. We review every application and follow up by email.",
};

export default function SellerApplicationPage() {
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
              — Seller Application —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 7vw, 96px)",
                lineHeight: 0.94,
                color: "var(--ink)",
              }}
            >
              Become a seller.
            </h1>
            <p
              style={{
                marginTop: "28px",
                fontSize: "clamp(15px, 1.4vw, 17px)",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.6,
                maxWidth: "480px",
                margin: "28px auto 0",
              }}
            >
              Start selling your AI products to thousands of buyers. Tell us about
              yourself and what you want to sell.
            </p>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <SellerApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}