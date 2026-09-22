import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContactSellerForm from "./ContactSellerForm";
import { getActiveVendor } from "@/lib/vendor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ vendorId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorId } = await params;
  const vendor = await getActiveVendor(vendorId);
  if (!vendor) return {};
  return {
    title: `Contact ${vendor.display_name} | AI Digital Products`,
    description: `Send a message to ${vendor.display_name} on AI Digital Products.`,
  };
}

export default async function ContactSellerPage({ params }: Props) {
  const { vendorId } = await params;
  const vendor = await getActiveVendor(vendorId);
  if (!vendor) notFound();

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="page-hero">
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "24px" }}>
              &mdash; Contact Seller &mdash;
            </div>
            <h1 className="display" style={{ fontSize: "clamp(32px, 5vw, 64px)", lineHeight: 1.02, color: "var(--ink)" }}>
              Message {vendor.display_name}.
            </h1>
            <p style={{ marginTop: "20px", fontSize: "15px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.65 }}>
              Have a question before you buy, or want to reach this seller directly? Send a message below.
              They will reply through the platform, so your email stays private.
            </p>
          </div>
        </section>
        <section className="block">
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <ContactSellerForm vendorId={vendorId} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}