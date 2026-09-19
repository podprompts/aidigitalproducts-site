import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | AI Digital Products",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 className="display" style={{ fontSize: "36px", color: "var(--ink)", marginBottom: "8px" }}>
          Privacy Policy
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
          point, not a finished legal instrument. If you have customers in the EU/UK, California,
          or other jurisdictions with specific privacy laws (GDPR, CCPA, etc.), have this reviewed
          before relying on it — those laws have specific requirements this draft doesn't attempt
          to fully address.
        </div>

        <section style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink-faded)" }}>
          <h2 style={sectionHeading}>1. What We Collect</h2>
          <p>
            <strong>Account &amp; order information:</strong> email address, and for vendors,
            business name and payout details.
          </p>
          <p>
            <strong>Payment information:</strong> we do not store your card details. Payments are
            processed by Stripe, and Stripe's own privacy policy governs how they handle your
            payment data.
          </p>
          <p>
            <strong>Usage data:</strong> pages viewed, products viewed, and similar analytics
            collected automatically as you use the site.
          </p>

          <h2 style={sectionHeading}>2. How We Use It</h2>
          <ul style={{ paddingLeft: "20px" }}>
            <li>To process your orders and deliver digital products you've purchased</li>
            <li>To send order confirmations and, if you opt in, product update emails</li>
            <li>To operate vendor accounts and process vendor payouts</li>
            <li>To improve the site and understand how it's used</li>
            <li>To detect and prevent fraud</li>
          </ul>

          <h2 style={sectionHeading}>3. Third-Party Services</h2>
          <p>We rely on the following third parties, each with their own privacy practices:</p>
          <ul style={{ paddingLeft: "20px" }}>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Supabase</strong> — database and account authentication</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
            <li><strong>Cloudflare</strong> — file and video storage/delivery</li>
            <li><strong>Vercel</strong> — website hosting</li>
          </ul>

          <h2 style={sectionHeading}>4. Cookies</h2>
          <p>
            We use cookies necessary for the site to function (like keeping you logged in) and may
            use analytics cookies to understand site usage.
          </p>

          <h2 style={sectionHeading}>5. Data Retention</h2>
          <p>
            We retain account and order information for as long as your account is active, and as
            needed to comply with legal and tax obligations after account closure.
          </p>

          <h2 style={sectionHeading}>6. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal information by
            contacting us through the site's contact form. We'll respond within a reasonable time.
          </p>

          <h2 style={sectionHeading}>7. Children's Privacy</h2>
          <p>
            This site is not directed at children under 18, and we do not knowingly collect
            information from them.
          </p>

          <h2 style={sectionHeading}>8. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Continued use of the site after changes
            take effect constitutes acceptance of the revised policy.
          </p>

          <h2 style={sectionHeading}>9. Contact</h2>
          <p>Questions about this policy? Contact us through the site's contact form.</p>
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