import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SupportRequestForm from "./SupportRequestForm";

export const metadata: Metadata = {
  title: "Get help with an order | AI Digital Products",
  description: "Report a problem with a purchase.",
};

type Props = { searchParams: Promise<{ order?: string }> };

export default async function SupportOrderPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const defaultOrder = typeof order === "string" ? order.slice(0, 20) : "";

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="page-hero">
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "24px" }}>
              &mdash; Support &mdash;
            </div>
            <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 0.98, color: "var(--ink)" }}>
              Get help with an order.
            </h1>
            <p style={{ marginTop: "24px", fontSize: "15px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.65 }}>
              Your request goes to the creator first, and they are required to respond within 48 hours.
              If they do not, or the problem is serious, you can ask us to step in. See the{" "}
              <Link href="/refund-buyer-protection" style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "underline" }}>
                Refund &amp; Buyer Protection Policy
              </Link>
              .
            </p>
          </div>
        </section>
        <section className="block">
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <SupportRequestForm defaultOrder={defaultOrder} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}