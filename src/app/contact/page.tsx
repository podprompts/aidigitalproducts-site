import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact — AI Digital Products",
  description: "Get in touch with the AI Digital Products team. We respond fast.",
};

export default function ContactPage() {
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
              — Contact —
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
              Get in touch.{" "}
              <span style={{ color: "var(--ink-mute)" }}>We respond fast.</span>
            </h1>
          </div>
        </section>

        {/* Form */}
        <section className="block">
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
