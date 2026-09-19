import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | AI Digital Products",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 className="display" style={{ fontSize: "36px", color: "var(--ink)", marginBottom: "8px" }}>
          Terms of Service
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
          <strong>Draft — not yet reviewed by an attorney.</strong> This document is a starting
          point, not a finished legal instrument. Do not treat it as binding or complete until it
          has been reviewed by a qualified attorney familiar with e-commerce and marketplace law
          in your jurisdiction.
        </div>

        <section style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink-faded)" }}>
          <h2 style={sectionHeading}>1. Overview</h2>
          <p>
            AI Digital Products ("we," "us," "the Platform") operates a marketplace where
            independent sellers ("Vendors") list digital products for sale to buyers
            ("Customers"). By using this site, you agree to these Terms. If you don't agree,
            don't use the site.
          </p>

          <h2 style={sectionHeading}>2. Accounts</h2>
          <p>
            Vendor accounts require an application and approval. You're responsible for
            maintaining the confidentiality of your login credentials and for all activity under
            your account. Notify us immediately of any unauthorized use.
          </p>

          <h2 style={sectionHeading}>3. Buyer Terms</h2>
          <p>
            <strong>Purchases.</strong> All purchases are final except as described in our{" "}
            <a href="/refund-policy" style={{ color: "var(--ink)" }}>Refund Policy</a>.
          </p>
          <p>
            <strong>Licenses.</strong> Each product is sold under one of two license types,
            clearly stated at the time of purchase:
          </p>
          <ul style={{ paddingLeft: "20px" }}>
            <li>
              <strong>Personal/Standard License</strong> — for your own use. You may not resell,
              redistribute, or grant others rights to the product.
            </li>
            <li>
              <strong>PLR (Private Label Rights) License</strong> — you may rebrand and resell the
              finished product to your own customers, but you may not grant further resale or PLR
              rights to anyone downstream ("non-re-PLR-able"). See the full{" "}
              <a href="/plr-license" style={{ color: "var(--ink)" }}>PLR License terms</a> for
              details.
            </li>
          </ul>
          <p>
            <strong>No warranty on third-party AI outputs.</strong> Where a product involves or
            was created with third-party AI tools, we make no representations about the accuracy,
            reliability, or fitness for any particular purpose of AI-generated content or outputs.
          </p>

          <h2 style={sectionHeading}>4. Vendor Terms</h2>
          <p>
            <strong>Eligibility.</strong> Vendor accounts are subject to application and approval,
            and we may reject or remove any vendor at our discretion.
          </p>
          <p>
            <strong>Commission.</strong> The Platform retains a percentage of each sale as a
            commission, disclosed to you before you begin selling. This rate may change with
            reasonable advance notice.
          </p>
          <p>
            <strong>Content responsibility.</strong> You are solely responsible for the products
            you list, including their legality, accuracy, and that you own or have the rights to
            sell them. You may not list content that infringes on any third party's intellectual
            property, is illegal, or violates these Terms.
          </p>
          <p>
            <strong>Review.</strong> We may review vendor listings before they go live and may
            remove or reject any listing at our discretion.
          </p>
          <p>
            <strong>Payouts.</strong> Your share of each sale is paid out according to the payout
            schedule and method disclosed to you at signup, minus the Platform's commission and
            any applicable payment processing fees.
          </p>

          <h2 style={sectionHeading}>5. Prohibited Uses</h2>
          <p>
            You may not use the Platform to distribute malware, infringing content, illegal
            content, or content that violates the rights of others. We may suspend or terminate
            any account for violations of these Terms.
          </p>

          <h2 style={sectionHeading}>6. Intellectual Property</h2>
          <p>
            Vendors retain ownership of their own product content, subject to the license terms
            under which that content is sold to buyers. The Platform's own branding, design, and
            software remain our property.
          </p>

          <h2 style={sectionHeading}>7. Disclaimers &amp; Limitation of Liability</h2>
          <p>
            The Platform is provided "as is" without warranties of any kind. To the fullest extent
            permitted by law, we are not liable for indirect, incidental, or consequential damages
            arising from your use of the Platform or any product purchased through it.
          </p>

          <h2 style={sectionHeading}>8. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Arizona, without regard to
            conflict-of-law principles.
          </p>

          <h2 style={sectionHeading}>9. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Platform after
            changes take effect constitutes acceptance of the revised Terms.
          </p>

          <h2 style={sectionHeading}>10. Contact</h2>
          <p>Questions about these Terms? Contact us through the site's contact form.</p>
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