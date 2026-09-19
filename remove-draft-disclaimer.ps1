# Removes the draft/attorney-review disclaimer from the Refund & Buyer
# Protection Policy page. Run from the root of your aidigitalproducts-site repo.

$content = @'
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Refund & Buyer Protection Policy — AI Digital Products",
  description:
    "How refunds, support requests, and marketplace escalation actually work at AiDigitalProducts.com.",
};

const toc = [
  { id: "overview",      label: "1. Overview" },
  { id: "creator-first", label: "2. Contact the Creator First" },
  { id: "response-time", label: "3. 48-Hour Response Requirement" },
  { id: "escalation",    label: "4. When AI Digital Products Steps In" },
  { id: "listing-terms", label: "5. Listing-Specific Refund Terms" },
  { id: "consumer-rights", label: "6. Your Statutory Rights" },
  { id: "how-to",        label: "7. How to Request a Refund" },
  { id: "contact",       label: "8. Contact Information" },
];

export default function RefundBuyerProtectionPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="page-hero">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "24px" }}>
              — Legal —
            </div>
            <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 80px)", lineHeight: 0.98, color: "var(--ink)", maxWidth: "900px", margin: "0 auto" }}>
              Refund &amp; Buyer Protection Policy.
            </h1>
            <p style={{ marginTop: "28px", fontSize: "14px", fontWeight: 500, color: "var(--ink-faded)" }}>
              Last Updated: September 19, 2026
            </p>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "64px" }}>

            <div
              style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", padding: "36px 40px" }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-mute)", marginBottom: "20px" }}>
                Contents
              </div>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-faded)", textDecoration: "none" }}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            <LegalSection id="overview" number="1" title="Overview">
              <p>
                Most products on AI Digital Products are created and sold by independent Creators.
                This page explains, in practical terms, what happens if you have a problem with a
                purchase — who to contact, how long they have to respond, and when the platform
                itself gets involved.
              </p>
            </LegalSection>

            <LegalSection id="creator-first" number="2" title="Contact the Creator First">
              <p>
                If a product doesn't work as described, is missing files, or otherwise has a
                genuine problem, contact the Creator listed on the product page first. Most issues
                are resolved quickly this way — a corrected file, a missing download link fixed,
                or a straightforward refund.
              </p>
            </LegalSection>

            <LegalSection id="response-time" number="3" title="48-Hour Response Requirement">
              <p>
                Creators selling on this marketplace are required to respond to legitimate support
                and refund requests within 48 hours. This is a response requirement, not a
                resolution requirement — a Creator may reasonably need more time to investigate or
                fix an issue, but they must acknowledge your request and make a genuine effort to
                address it within that window.
              </p>
            </LegalSection>

            <LegalSection id="escalation" number="4" title="When AI Digital Products Steps In">
              <p>
                Buyers and Creators are expected to resolve ordinary issues directly. We'll review
                and step into a dispute when:
              </p>
              <ul>
                <li>A Creator hasn't responded within 48 hours</li>
                <li>A Creator repeatedly ignores legitimate messages</li>
                <li>A product is materially different from its description, or materially defective</li>
                <li>A Creator refuses to address a legitimate, genuine problem</li>
                <li>There's evidence of fraud, deception, or abuse</li>
              </ul>
              <p>
                To escalate, contact us through the{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>Contact page</Link>{" "}
                with your order number and a summary of what's happened so far.
              </p>
            </LegalSection>

            <LegalSection id="listing-terms" number="5" title="Listing-Specific Refund Terms">
              <p>
                Some Creators set additional refund terms specific to their own products — these
                appear directly on the product page and at checkout when present. Listing-specific
                terms can only add to what's offered here; they can never take away rights this
                policy or your Terms of Service already provide you.
              </p>
            </LegalSection>

            <LegalSection id="consumer-rights" number="6" title="Your Statutory Rights">
              <p>
                Nothing in this policy, a Creator's own refund terms, or any product listing is
                intended to exclude or restrict consumer rights that cannot legally be excluded or
                restricted. Where mandatory law in your jurisdiction gives you stronger rights than
                described here, those rights apply.
              </p>
            </LegalSection>

            <LegalSection id="how-to" number="7" title="How to Request a Refund">
              <p>Reach out to the Creator directly using the contact details on the product page or in your order confirmation email. If you don't hear back within 48 hours, or the issue meets one of the escalation criteria above, contact us directly with your order number.</p>
            </LegalSection>

            <LegalSection id="contact" number="8" title="Contact Information">
              <p>Questions about this policy or an active dispute? Reach us here:</p>
              <ContactBlock />
            </LegalSection>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function LegalSection({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ scrollMarginTop: "100px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-mute)", marginBottom: "10px" }}>
        {number}
      </div>
      <h2 style={{ fontSize: "clamp(18px, 2vw, 24px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--line)" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}

function ContactBlock() {
  return (
    <div style={{ marginTop: "8px", padding: "24px 28px", background: "var(--bg-alt)", border: "1px solid var(--line)", fontSize: "14px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 2 }}>
      <strong style={{ color: "var(--ink)" }}>HONNYDO LLC d/b/a AI Digital Products</strong>
      <br />
      Arizona, USA
      <br />
      Contact:{" "}
      <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
        AiDigitalProducts.com/contact
      </Link>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\refund-buyer-protection\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\refund-buyer-protection\page.tsx" -ForegroundColor Green
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan