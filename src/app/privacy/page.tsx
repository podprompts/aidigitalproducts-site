import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — AI Digital Products",
  description: "Privacy Policy for AI Digital Products.",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="page-hero" style={{ textAlign: "left" }}>
          <div className="prose-inner">
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
              — Legal —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(36px, 5vw, 64px)",
                lineHeight: 0.96,
                color: "var(--ink)",
              }}
            >
              Privacy Policy.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Last updated April 2026.</span>
            </h1>
          </div>
        </section>

        <section className="block">
          <div className="prose-inner">
            <p
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.75,
                marginBottom: "24px",
              }}
            >
              Privacy Policy — last updated April 2026.
            </p>
            <p
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--ink-mute)",
                lineHeight: 1.75,
              }}
            >
              Full privacy policy coming soon.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
