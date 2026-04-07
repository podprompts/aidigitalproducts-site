import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Checkout Cancelled — AI Digital Products",
  description: "Your checkout was cancelled. Your cart is saved — come back any time.",
};

export default function CheckoutCancelPage() {
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
              — Checkout Cancelled —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(40px, 6vw, 80px)",
                lineHeight: 0.94,
                color: "var(--ink)",
              }}
            >
              No worries.
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
              You didn&apos;t complete your purchase and nothing was charged. The
              product will be here whenever you&apos;re ready.
            </p>
            <div style={{ marginTop: "44px", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/products" className="btn btn-primary">
                Return to Products
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
