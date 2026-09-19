import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Refund Policy | AI Digital Products",
};

export default function RefundPolicyPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 className="display" style={{ fontSize: "36px", color: "var(--ink)", marginBottom: "8px" }}>
          Refund Policy
        </h1>
        <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "8px" }}>
          Last updated: September 19, 2026
        </p>
        <div
          style={{
            background: "#fff8e1",
            border: "1px solid #f0d878",
            padding: "16px 20px",
            fontSize: "13px",
            color: "#6b5a1a",
            marginBottom: "40px",
          }}
        >
          <strong>Draft — not yet reviewed by an attorney.</strong> Refund/return laws for digital
          goods vary by jurisdiction (the EU in particular has specific rules about digital
          content and the right of withdrawal). Have this reviewed before relying on it if you
          sell to customers outside the US.
        </div>

        <section style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink-faded)" }}>
          <h2 style={sectionHeading}>Digital Products Are Generally Non-Refundable</h2>
          <p>
            Because our products are digital and delivered instantly, all sales are final once a
            download link has been issued or a file has been accessed, except as described below.
          </p>

          <h2 style={sectionHeading}>Exceptions</h2>
          <p>We will issue a refund if:</p>
          <ul style={{ paddingLeft: "20px" }}>
            <li>The file you received is corrupted, incomplete, or doesn't match its listing</li>
            <li>You were charged in error or charged twice for the same order</li>
            <li>
              You contact us within 24 hours of purchase and have not yet downloaded or accessed
              the product
            </li>
          </ul>

          <h2 style={sectionHeading}>PLR Purchases</h2>
          <p>
            Once a PLR (resale rights) license has been delivered, it cannot be refunded under any
            circumstances — the license itself, once granted, cannot be "returned."
          </p>

          <h2 style={sectionHeading}>How to Request a Refund</h2>
          <p>
            Contact us through the site's contact form with your order number and the reason for
            your request. We'll respond within a reasonable time.
          </p>

          <h2 style={sectionHeading}>Vendor-Specific Products</h2>
          <p>
            Refund requests for a specific vendor's product may be routed to that vendor for
            review, but the Platform reserves the right to make the final decision on any refund.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "var(--ink)",
  marginTop: "36px",
  marginBottom: "12px",
};