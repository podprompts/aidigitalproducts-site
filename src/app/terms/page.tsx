import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — AI Digital Products",
  description:
    "Terms of Service for AiDigitalProducts.com, operated by HONNYDO LLC d/b/a AI Digital Products.",
};

const toc = [
  { id: "acceptance",       label: "1. Acceptance of Terms" },
  { id: "platform",         label: "2. Platform Description" },
  { id: "accounts",         label: "3. User Accounts & Eligibility" },
  { id: "buyer-terms",      label: "4. Buyer Terms" },
  { id: "seller-terms",     label: "5. Seller Terms" },
  { id: "prohibited",       label: "6. Prohibited Uses" },
  { id: "ip",               label: "7. Intellectual Property" },
  { id: "payments",         label: "8. Payment Terms" },
  { id: "dynamic-pricing",  label: "9. Dynamic Pricing Disclosure" },
  { id: "disclaimers",      label: "10. Disclaimers" },
  { id: "liability",        label: "11. Limitation of Liability" },
  { id: "indemnification",  label: "12. Indemnification" },
  { id: "disputes",         label: "13. Dispute Resolution" },
  { id: "governing-law",    label: "14. Governing Law" },
  { id: "termination",      label: "15. Termination" },
  { id: "changes",          label: "16. Changes to Terms" },
  { id: "severability",     label: "17. Severability" },
  { id: "entire-agreement", label: "18. Entire Agreement" },
  { id: "contact",          label: "19. Contact Information" },
];

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>

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
              — Legal —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(40px, 7vw, 96px)",
                lineHeight: 0.94,
                color: "var(--ink)",
                maxWidth: "900px",
                margin: "0 auto",
              }}
            >
              Terms of Service.
            </h1>
            <p
              style={{
                marginTop: "28px",
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--ink-faded)",
              }}
            >
              Last Updated: April 8, 2026
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="block">
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "64px",
            }}
          >

            {/* Table of Contents */}
            <div
              style={{
                background: "var(--bg-alt)",
                border: "1px solid var(--line)",
                padding: "36px 40px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "var(--ink-mute)",
                  marginBottom: "20px",
                }}
              >
                Contents
              </div>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--ink-faded)",
                        textDecoration: "none",
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* Intro */}
            <Prose>
              <p>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the website
                located at <strong>AiDigitalProducts.com</strong> (the &quot;Site&quot;) and all related
                services (collectively, the &quot;Platform&quot;) operated by{" "}
                <strong>HONNYDO LLC d/b/a AI Digital Products</strong> (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;), an Arizona limited liability company.
              </p>
              <p>
                Please read these Terms carefully before using the Platform. By accessing or using
                the Platform in any way, you agree to be bound by these Terms in their entirety.
              </p>
            </Prose>

            {/* 1 */}
            <LegalSection id="acceptance" number="1" title="Acceptance of Terms">
              <p>
                By creating an account, browsing the Site, purchasing a product, or otherwise
                accessing any part of the Platform, you acknowledge that you have read, understood,
                and agree to be legally bound by these Terms and our{" "}
                <Link href="/privacy" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Privacy Policy
                </Link>
                , which is incorporated herein by reference.
              </p>
              <p>
                If you do not agree to these Terms, you must immediately cease all use of the
                Platform and may not access or use any of our services.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Changes become effective
                upon posting to the Site. Your continued use of the Platform after any modification
                constitutes your acceptance of the updated Terms.
              </p>
            </LegalSection>

            {/* 2 */}
            <LegalSection id="platform" number="2" title="Platform Description">
              <p>
                AI Digital Products is a curated marketplace for AI-related digital goods, including
                but not limited to AI tools, prompt libraries, templates, automation systems,
                chatbots, content generation systems, and custom AI applications. The Platform
                enables buyers to discover, evaluate, and purchase digital products created by the
                Company and by approved third-party sellers.
              </p>
              <p>
                The Company acts as a platform intermediary facilitating transactions between buyers
                and sellers. For third-party seller products, the Company is not the manufacturer,
                creator, or primary licensor of those products. The Company does not guarantee the
                accuracy, completeness, or fitness for a particular purpose of any third-party
                product listed on the Platform.
              </p>
            </LegalSection>

            {/* 3 */}
            <LegalSection id="accounts" number="3" title="User Accounts & Eligibility">
              <SubHeading>Eligibility</SubHeading>
              <p>
                You must be at least <strong>18 years of age</strong> to use the Platform. By using
                the Platform, you represent and warrant that you are 18 years of age or older, have
                the legal capacity to enter into a binding agreement, and are not barred from
                receiving services under applicable law.
              </p>
              <SubHeading>Account Registration</SubHeading>
              <p>
                Certain features of the Platform require account registration. You agree to provide
                accurate, current, and complete information during registration and to update such
                information as necessary. You are responsible for maintaining the confidentiality of
                your account credentials and for all activities that occur under your account.
              </p>
              <p>
                You agree to notify us immediately of any unauthorized use of your account or any
                other breach of security. We will not be liable for any loss or damage arising from
                your failure to safeguard your account credentials.
              </p>
              <SubHeading>Account Termination</SubHeading>
              <p>
                We reserve the right to suspend or terminate your account at any time, with or
                without notice, for any reason, including but not limited to violation of these
                Terms, fraudulent activity, or conduct harmful to other users, sellers, or the
                Company.
              </p>
            </LegalSection>

            {/* 4 */}
            <LegalSection id="buyer-terms" number="4" title="Buyer Terms">
              <SubHeading>Product Types</SubHeading>
              <p>The Platform offers two primary product categories:</p>
              <ul>
                <li>
                  <strong>Starter / Buy Now Products:</strong> Lower-priced digital products
                  delivered instantly upon successful payment. Delivery is automated and immediate.
                </li>
                <li>
                  <strong>Professional / Enterprise Products:</strong> Custom-scoped AI systems,
                  deployments, and services. These are not instant-delivery products. After
                  purchase, a member of our team or the applicable seller will contact you to scope
                  the engagement and establish delivery timelines. Delivery timelines vary by
                  project complexity.
                </li>
              </ul>

              <SubHeading>License Grant</SubHeading>
              <p>
                Upon completing a purchase, you receive a non-exclusive, non-transferable license to
                use the purchased digital product for personal or commercial purposes as specified in
                the individual product listing. Where no specific license is stated, you receive a
                license for personal use only.
              </p>
              <p>The following are expressly prohibited without prior written consent:</p>
              <ul>
                <li>Reselling, redistributing, or sublicensing any purchased product</li>
                <li>Repackaging purchased products for sale on any platform</li>
                <li>Sharing purchased product files with third parties for commercial gain</li>
                <li>Claiming authorship or ownership of purchased products</li>
              </ul>

              <SubHeading>Refund Policy</SubHeading>
              <p>
                <strong>Starter / Buy Now Products:</strong> All sales are final. Because digital
                products are delivered instantly and cannot be &quot;returned,&quot; we do not offer refunds
                once a product has been delivered. Please review all product descriptions, previews,
                and details carefully before purchasing.
              </p>
              <p>
                <strong>Professional / Enterprise Products:</strong> Refund eligibility for custom
                orders is determined on a case-by-case basis prior to project commencement. Any
                refund terms will be agreed upon in writing before work begins. No refunds will be
                issued once delivery has commenced or been completed.
              </p>
              <p>
                If you believe you have received a product materially different from its description,
                please contact us via the{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Contact page
                </Link>{" "}
                within 7 days of purchase. We will review such claims at our sole discretion.
              </p>

              <SubHeading>Digital Delivery</SubHeading>
              <p>
                For instantly-delivered products, access or download links will be provided via
                email or your account dashboard following confirmed payment. You are responsible for
                downloading and saving your purchased files. We may not maintain access to
                previously purchased files indefinitely.
              </p>
            </LegalSection>

            {/* 5 */}
            <LegalSection id="seller-terms" number="5" title="Seller Terms">
              <SubHeading>Application and Approval</SubHeading>
              <p>
                Third-party sellers must apply to list products on the Platform through our seller
                waitlist and approval process. Submission of an application does not guarantee
                approval. We review all applications and approve sellers at our sole discretion
                based on product quality, category fit, and compliance with our standards.
              </p>
              <p>
                Approved sellers will receive onboarding instructions and must agree to any
                supplemental seller agreements before listing products.
              </p>

              <SubHeading>Listing Requirements</SubHeading>
              <p>All products listed by sellers must meet the following minimum standards:</p>
              <ul>
                <li>Accurate and complete product title, description, and preview materials</li>
                <li>Clear disclosure of what the buyer receives upon purchase</li>
                <li>Truthful claims regarding product functionality and results</li>
                <li>Compliance with all applicable laws, including intellectual property laws</li>
                <li>No misleading, exaggerated, or fraudulent claims</li>
                <li>No products that violate our Prohibited Content policy (see Section 6)</li>
              </ul>
              <p>
                We reserve the right to remove any listing at any time for any reason, including
                failure to meet our standards, user complaints, or changes in platform policy.
              </p>

              <SubHeading>Commission Structure</SubHeading>
              <p>
                The Company charges a commission percentage on each transaction processed through
                the Platform for third-party seller products. The applicable commission rate will be
                disclosed during the seller onboarding process and may be updated with advance
                notice to sellers.
              </p>
              <p>
                Sellers are responsible for any applicable taxes on their earnings. The Company does
                not provide tax advice and sellers should consult a qualified tax professional
                regarding their obligations.
              </p>

              <SubHeading>Payment Disbursement</SubHeading>
              <p>
                Seller earnings, net of the platform commission and any applicable payment
                processing fees, will be disbursed according to the payout schedule communicated
                during seller onboarding. Minimum payout thresholds may apply. Disbursements are
                subject to successful verification of seller identity and payment information.
              </p>

              <SubHeading>Seller Intellectual Property</SubHeading>
              <p>
                Sellers retain all intellectual property rights in the products they create and
                list. By listing a product on the Platform, sellers grant the Company a
                non-exclusive, worldwide license to display, reproduce, and market the product
                (including previews, screenshots, and descriptions) solely for the purpose of
                operating and promoting the Platform.
              </p>
              <p>
                Sellers represent and warrant that they own or have the right to license all content
                included in their products and listings, and that such content does not infringe the
                intellectual property rights of any third party.
              </p>

              <SubHeading>Seller Responsibilities</SubHeading>
              <p>
                Sellers are solely responsible for the quality, accuracy, delivery, and support of
                their products. The Company is not responsible for seller product defects, delivery
                failures, or customer disputes arising from seller products.
              </p>
              <p>
                Sellers must respond to buyer inquiries and complaints in a timely and professional
                manner. Persistent failure to do so may result in listing removal or account
                termination.
              </p>

              <SubHeading>Seller Account Termination</SubHeading>
              <p>
                The Company may suspend or permanently terminate a seller&apos;s account and remove all
                associated listings for violations of these Terms, fraudulent activity, repeated
                buyer complaints, or any conduct the Company determines is harmful to the Platform
                or its users. Termination does not affect the Company&apos;s right to recover any amounts
                owed.
              </p>
            </LegalSection>

            {/* 6 */}
            <LegalSection id="prohibited" number="6" title="Prohibited Uses">
              <p>You agree not to use the Platform to:</p>
              <ul>
                <li>Violate any applicable local, state, national, or international law or regulation</li>
                <li>Transmit content that is unlawful, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable</li>
                <li>Infringe any patent, trademark, trade secret, copyright, or other proprietary right</li>
                <li>Upload or transmit malware, viruses, or any other malicious code</li>
                <li>Attempt to gain unauthorized access to any part of the Platform or its infrastructure</li>
                <li>Engage in data scraping, crawling, or automated access without prior written consent</li>
                <li>Circumvent any technical measures designed to protect the Platform or its users</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
                <li>Submit false or misleading information in any form, application, or listing</li>
                <li>Engage in any fraudulent transaction or chargebacks made in bad faith</li>
                <li>List, sell, or distribute products designed to harm, deceive, or defraud users</li>
                <li>Use the Platform to engage in spam, phishing, or unsolicited commercial communications</li>
              </ul>
              <p>
                Violations may result in immediate account suspension, termination, and referral to
                appropriate law enforcement authorities.
              </p>
            </LegalSection>

            {/* 7 */}
            <LegalSection id="ip" number="7" title="Intellectual Property">
              <SubHeading>Platform Content</SubHeading>
              <p>
                All content on the Platform that is not a third-party seller product — including
                but not limited to the Site design, layout, graphics, logos, text, and software —
                is owned by or licensed to HONNYDO LLC and is protected by applicable intellectual
                property laws. You may not reproduce, distribute, modify, create derivative works
                of, publicly display, or exploit any such content without our express prior written
                permission.
              </p>
              <SubHeading>Third-Party Seller Products</SubHeading>
              <p>
                Intellectual property rights in seller-listed products remain with the respective
                seller or their licensors. Buyers receive only the license described in Section 4
                and the applicable product listing. No title or ownership is transferred to buyers
                upon purchase.
              </p>
              <SubHeading>Feedback</SubHeading>
              <p>
                Any feedback, suggestions, or ideas you submit regarding the Platform may be used
                by us without obligation to you, including for product development, marketing, or
                other business purposes.
              </p>
            </LegalSection>

            {/* 8 */}
            <LegalSection id="payments" number="8" title="Payment Terms">
              <p>
                All transactions on the Platform are processed by <strong>Stripe</strong>, a
                third-party payment processor. By making a purchase, you agree to Stripe&apos;s terms
                of service and privacy policy. The Company does not collect, store, or have access
                to your full credit card number, CVV, or other sensitive payment credentials.
              </p>
              <p>
                All prices are displayed in U.S. Dollars (USD) unless otherwise stated. You are
                responsible for any applicable taxes, duties, or fees imposed by your local
                jurisdiction in connection with your purchase.
              </p>
              <p>
                We reserve the right to change prices at any time. Price changes will not affect
                transactions already completed.
              </p>
            </LegalSection>

            {/* 9 */}
            <LegalSection id="dynamic-pricing" number="9" title="Dynamic Pricing Disclosure">
              <p>
                The Platform uses a time-limited dynamic pricing system (&quot;Countdown Timer Pricing&quot;)
                on certain products. Under this system, a discounted sale price may be offered for
                a limited window of time to individual visitors. After the promotional window
                expires, the regular listed price applies.
              </p>
              <p>
                Pricing is determined based on visitor session data, including IP address. The sale
                price shown at any point in time is valid only during the active promotional period
                displayed on the product page. The Company makes no guarantee that a particular
                price will remain available and reserves the right to modify, extend, or discontinue
                promotional pricing at any time.
              </p>
              <p>
                The price charged at checkout will reflect the price confirmed on your order summary
                page at the time of purchase.
              </p>
            </LegalSection>

            {/* 10 */}
            <LegalSection id="disclaimers" number="10" title="Disclaimers">
              <p>
                THE PLATFORM AND ALL PRODUCTS AVAILABLE THEREON ARE PROVIDED ON AN &quot;AS IS&quot; AND
                &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              </p>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY DISCLAIMS ALL
                WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p>
                WE DO NOT WARRANT THAT: (A) THE PLATFORM WILL BE UNINTERRUPTED OR ERROR-FREE;
                (B) DEFECTS WILL BE CORRECTED; (C) THE PLATFORM OR ITS SERVERS ARE FREE FROM
                VIRUSES OR OTHER HARMFUL COMPONENTS; OR (D) ANY PRODUCT WILL ACHIEVE ANY PARTICULAR
                BUSINESS RESULT, INCOME LEVEL, OR PERFORMANCE OUTCOME.
              </p>
              <p>
                Results described in product listings, testimonials, or marketing materials are
                illustrative and not guarantees. Individual results will vary based on effort,
                experience, market conditions, and many other factors outside our control.
              </p>
            </LegalSection>

            {/* 11 */}
            <LegalSection id="liability" number="11" title="Limitation of Liability">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL HONNYDO LLC,
                ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES,
                INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE
                LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF, OR INABILITY TO USE,
                THE PLATFORM OR ANY PRODUCT PURCHASED THEREON.
              </p>
              <p>
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR
                RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM EXCEED THE GREATER OF (A) THE
                AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM OR (B) ONE
                HUNDRED U.S. DOLLARS ($100).
              </p>
              <p>
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN WARRANTIES
                OR LIABILITIES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
              </p>
            </LegalSection>

            {/* 12 */}
            <LegalSection id="indemnification" number="12" title="Indemnification">
              <p>
                You agree to defend, indemnify, and hold harmless HONNYDO LLC and its officers,
                directors, employees, contractors, agents, licensors, and suppliers from and against
                any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or
                fees (including reasonable attorneys&apos; fees) arising out of or relating to:
              </p>
              <ul>
                <li>Your violation of these Terms</li>
                <li>Your use or misuse of the Platform or any product purchased thereon</li>
                <li>Your violation of any applicable law or the rights of a third party</li>
                <li>
                  Any content, product, or listing you submit or make available through the
                  Platform as a seller
                </li>
              </ul>
            </LegalSection>

            {/* 13 */}
            <LegalSection id="disputes" number="13" title="Dispute Resolution">
              <SubHeading>Informal Resolution</SubHeading>
              <p>
                Before initiating any formal dispute proceeding, you agree to contact us through
                our{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Contact page
                </Link>{" "}
                and make a good-faith effort to resolve the dispute informally. Most concerns can
                be addressed quickly through direct communication.
              </p>
              <SubHeading>Binding Arbitration</SubHeading>
              <p>
                If informal resolution is unsuccessful, any dispute, claim, or controversy arising
                out of or relating to these Terms or your use of the Platform shall be settled by
                binding arbitration administered in accordance with the rules of the American
                Arbitration Association (AAA) in Maricopa County, Arizona, USA. The
                arbitrator&apos;s decision shall be final and binding and may be entered as a judgment
                in any court of competent jurisdiction.
              </p>
              <SubHeading>No Class Actions</SubHeading>
              <p>
                YOU AND THE COMPANY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN
                AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED
                CLASS OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN
                ONE PERSON&apos;S CLAIMS.
              </p>
              <SubHeading>Exceptions</SubHeading>
              <p>
                Nothing in this section shall prevent either party from seeking injunctive or other
                equitable relief in a court of competent jurisdiction to prevent actual or
                threatened infringement, misappropriation, or violation of intellectual property
                rights.
              </p>
            </LegalSection>

            {/* 14 */}
            <LegalSection id="governing-law" number="14" title="Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the{" "}
                <strong>State of Arizona, USA</strong>, without regard to its conflict of law
                provisions. Any disputes not subject to arbitration shall be brought exclusively
                in the state or federal courts located in Maricopa County, Arizona, and you consent
                to the personal jurisdiction of such courts.
              </p>
            </LegalSection>

            {/* 15 */}
            <LegalSection id="termination" number="15" title="Termination">
              <p>
                We may terminate or suspend your access to the Platform immediately, without prior
                notice or liability, for any reason whatsoever, including without limitation if you
                breach these Terms.
              </p>
              <p>
                Upon termination, your right to use the Platform will cease immediately. All
                provisions of these Terms which by their nature should survive termination shall
                survive, including without limitation: ownership provisions, warranty disclaimers,
                indemnity, and limitations of liability.
              </p>
              <p>
                If you wish to terminate your account, please contact us through the{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Contact page
                </Link>
                .
              </p>
            </LegalSection>

            {/* 16 */}
            <LegalSection id="changes" number="16" title="Changes to Terms">
              <p>
                We reserve the right to update or modify these Terms at any time at our sole
                discretion. When we make material changes, we will update the &quot;Last Updated&quot; date
                at the top of this page. We may also provide additional notice, such as a banner
                on the Site or an email notification to registered users.
              </p>
              <p>
                Your continued use of the Platform following the posting of any changes constitutes
                your acceptance of the revised Terms. If you do not agree to the updated Terms, you
                must stop using the Platform.
              </p>
            </LegalSection>

            {/* 17 */}
            <LegalSection id="severability" number="17" title="Severability">
              <p>
                If any provision of these Terms is found by a court or arbitrator of competent
                jurisdiction to be invalid, illegal, or unenforceable, that provision shall be
                modified to the minimum extent necessary to make it enforceable, and the remaining
                provisions shall continue in full force and effect.
              </p>
            </LegalSection>

            {/* 18 */}
            <LegalSection id="entire-agreement" number="18" title="Entire Agreement">
              <p>
                These Terms, together with our{" "}
                <Link href="/privacy" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Privacy Policy
                </Link>{" "}
                and any supplemental agreements entered into with sellers, constitute the entire
                agreement between you and HONNYDO LLC with respect to your use of the Platform and
                supersede all prior or contemporaneous communications, agreements, and
                understandings, whether written or oral.
              </p>
            </LegalSection>

            {/* 19 */}
            <LegalSection id="contact" number="19" title="Contact Information">
              <p>If you have any questions about these Terms, please contact us:</p>
              <ContactBlock />
            </LegalSection>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ── Shared layout primitives ──────────────────────────────────────────────── */

function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} style={{ scrollMarginTop: "100px" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "var(--ink-mute)",
          marginBottom: "10px",
        }}
      >
        {number}
      </div>
      <h2
        style={{
          fontSize: "clamp(18px, 2vw, 24px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--ink)",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--ink-faded)",
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "13px",
        fontWeight: 700,
        color: "var(--ink)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginTop: "8px",
      }}
    >
      {children}
    </h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--ink-faded)",
        lineHeight: 1.75,
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        paddingBottom: "8px",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      {children}
    </div>
  );
}

function ContactBlock() {
  return (
    <div
      style={{
        marginTop: "8px",
        padding: "24px 28px",
        background: "var(--bg-alt)",
        border: "1px solid var(--line)",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--ink-faded)",
        lineHeight: 2,
      }}
    >
      <strong style={{ color: "var(--ink)" }}>HONNYDO LLC d/b/a AI Digital Products</strong>
      <br />
      Arizona, USA
      <br />
      Website:{" "}
      <Link href="/" style={{ color: "var(--ink)", fontWeight: 600 }}>
        AiDigitalProducts.com
      </Link>
      <br />
      Contact:{" "}
      <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
        AiDigitalProducts.com/contact
      </Link>
    </div>
  );
}
