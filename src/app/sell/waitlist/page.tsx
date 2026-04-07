import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SellerWaitlistForm from "@/components/SellerWaitlistForm";

export const metadata: Metadata = {
  title: "Seller Waitlist — AI Digital Products",
  description:
    "Join the seller waitlist and be first to list your AI digital products when we open applications.",
};

export default function SellerWaitlistPage() {
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
              — Seller Applications —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 7vw, 96px)",
                lineHeight: 0.94,
                color: "var(--ink)",
              }}
            >
              Join the waitlist.
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
              We&apos;re onboarding sellers in waves. Drop your info below and we&apos;ll
              reach out when your spot opens.
            </p>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <SellerWaitlistForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
