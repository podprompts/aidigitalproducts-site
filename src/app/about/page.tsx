import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — AI Digital Products",
  description:
    "AI Digital Products is a marketplace for digital products built with and for artificial intelligence.",
};

const sections = [
  {
    heading: "What we're building",
    body: [
      "AI Digital Products is a marketplace for digital products built with and for artificial intelligence. Chatbots, voice agents, automations, content systems, and more — listed, bought, and delivered in one place.",
      "We handle the infrastructure: discovery, payments, and delivery. Sellers focus on the product.",
    ],
  },
  {
    heading: "Why now",
    body: [
      "The tools available to independent builders have changed substantially. Products that once required a team can now be built and maintained by one person. The economics of digital software have shifted.",
      "The distribution infrastructure for selling that work is catching up. We are part of that process.",
    ],
  },
  {
    heading: "Who it's for",
    body: [
      "Buyers who want working AI products without the research overhead. Sellers who want distribution without the overhead of running their own storefront.",
      "Both groups are here, and the marketplace is built to serve them equally.",
    ],
  },
  {
    heading: "What's next",
    body: [
      "Reviews and seller ratings. A buyer dashboard for managing purchases. More categories as the catalog grows.",
      "We are building steadily and shipping often.",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "64px" }}>
        {/* Hero */}
        <section className="page-hero">
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
              — About —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(40px, 6vw, 80px)",
                lineHeight: 0.96,
                color: "var(--ink)",
              }}
            >
              The marketplace{" "}
              <span style={{ color: "var(--ink-mute)" }}>built for AI.</span>
            </h1>
          </div>
        </section>

        {/* Prose sections */}
        {sections.map((section, i) => (
          <section
            key={section.heading}
            className={`block${i % 2 === 1 ? " alt" : ""}`}
          >
            <div className="prose-inner">
              <h2
                style={{
                  fontSize: "clamp(22px, 2.5vw, 28px)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "var(--ink)",
                  marginBottom: "24px",
                }}
              >
                {section.heading}
              </h2>
              <div className="divider" style={{ marginBottom: "28px" }} />
              {section.body.map((para, j) => (
                <p
                  key={j}
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "var(--ink-faded)",
                    lineHeight: 1.75,
                    marginBottom: j < section.body.length - 1 ? "20px" : "0",
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
