import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Order Confirmed — AI Digital Products",
  description: "Your purchase is confirmed. Check your email for your download link.",
};

export default function CheckoutSuccessPage() {
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
              Your purchase is confirmed. Check your inbox — your download link is on
              its way. If it doesn&apos;t arrive within a few minutes, check your spam
              folder.
            </p>
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
