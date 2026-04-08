import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — AI Digital Products",
  description:
    "Privacy Policy for AiDigitalProducts.com, operated by HONNYDO LLC d/b/a AI Digital Products.",
};

const toc = [
  { id: "introduction",     label: "1. Introduction & Scope" },
  { id: "information",      label: "2. Information We Collect" },
  { id: "how-we-use",       label: "3. How We Use Your Information" },
  { id: "sharing",          label: "4. How We Share Information" },
  { id: "cookies",          label: "5. Cookies & Tracking Technologies" },
  { id: "retention",        label: "6. Data Retention" },
  { id: "your-rights",      label: "7. Your Rights" },
  { id: "california",       label: "8. California Residents (CCPA)" },
  { id: "international",    label: "9. International Users" },
  { id: "children",         label: "10. Children's Privacy" },
  { id: "security",         label: "11. Security Measures" },
  { id: "third-party",      label: "12. Third-Party Links" },
  { id: "changes",          label: "13. Changes to This Policy" },
  { id: "contact",          label: "14. Contact Information" },
];

export default function PrivacyPage() {
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
              Privacy Policy.
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

            {/* Intro paragraph */}
            <Prose>
              <p>
                This Privacy Policy describes how <strong>HONNYDO LLC d/b/a AI Digital Products</strong>{" "}
                (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, discloses, and protects your
                personal information when you access or use our website at{" "}
                <strong>AiDigitalProducts.com</strong> (the &quot;Site&quot;) and related services
                (collectively, the &quot;Platform&quot;).
              </p>
              <p>
                By using the Platform, you agree to the collection and use of information in
                accordance with this Privacy Policy. If you do not agree with the terms of this
                policy, please do not use the Platform.
              </p>
            </Prose>

            {/* 1 */}
            <LegalSection id="introduction" number="1" title="Introduction & Scope">
              <p>
                This Privacy Policy applies to all visitors, registered users, buyers, and sellers
                who access or use the Platform. It covers information collected through the Site,
                our contact and newsletter forms, seller application forms, checkout flows, and any
                other interactions you have with the Platform.
              </p>
              <p>
                This policy does not apply to third-party websites or services that may be linked
                from our Platform. Those services operate under their own privacy policies, which we
                encourage you to review.
              </p>
            </LegalSection>

            {/* 2 */}
            <LegalSection id="information" number="2" title="Information We Collect">
              <SubHeading>Information You Provide Directly</SubHeading>
              <p>We collect information you voluntarily provide to us, including:</p>
              <ul>
                <li>
                  <strong>Account Information:</strong> Email address when you register or sign in
                  via our authentication system (powered by Supabase).
                </li>
                <li>
                  <strong>Contact Form Submissions:</strong> Name, email address, subject, and
                  message when you submit our contact form.
                </li>
                <li>
                  <strong>Newsletter Signups:</strong> Email address and the page from which you
                  signed up.
                </li>
                <li>
                  <strong>Seller Applications:</strong> Name, email address, business name, product
                  types you intend to sell, and any message included in your seller application.
                </li>
                <li>
                  <strong>Purchase Information:</strong> When you make a purchase, our payment
                  processor Stripe collects your payment details. We receive a confirmation of
                  payment and purchase details but do not receive or store your full card number,
                  CVV, or other raw payment credentials.
                </li>
              </ul>

              <SubHeading>Information Collected Automatically</SubHeading>
              <p>When you visit the Platform, we may automatically collect:</p>
              <ul>
                <li>
                  <strong>IP Address:</strong> Your IP address, used to support our dynamic pricing
                  system (countdown timer pricing) and for security and fraud prevention purposes.
                </li>
                <li>
                  <strong>Device & Browser Information:</strong> Browser type and version, operating
                  system, device type, and screen resolution.
                </li>
                <li>
                  <strong>Usage Data:</strong> Pages visited, time spent on pages, links clicked,
                  referral source, and other browsing behavior on the Platform.
                </li>
                <li>
                  <strong>Cookies & Similar Technologies:</strong> See Section 5 for details.
                </li>
              </ul>
            </LegalSection>

            {/* 3 */}
            <LegalSection id="how-we-use" number="3" title="How We Use Your Information">
              <p>We use the information we collect for the following purposes:</p>
              <ul>
                <li>To process and fulfill your purchases and deliver purchased digital products</li>
                <li>To create and manage your account</li>
                <li>To respond to your contact form inquiries and support requests</li>
                <li>
                  To send you newsletter emails if you have subscribed (you may unsubscribe at any
                  time)
                </li>
                <li>To review and process seller applications</li>
                <li>To display personalized pricing based on your session (dynamic pricing system)</li>
                <li>To detect, prevent, and investigate fraud and security incidents</li>
                <li>To analyze usage patterns and improve the Platform&apos;s functionality and content</li>
                <li>
                  To comply with legal obligations, including responding to lawful requests from
                  authorities
                </li>
                <li>To enforce our Terms of Service and other policies</li>
              </ul>
              <p>
                We do not sell your personal information to third parties for their own marketing
                purposes.
              </p>
            </LegalSection>

            {/* 4 */}
            <LegalSection id="sharing" number="4" title="How We Share Information">
              <p>
                We do not share, rent, or sell your personal information except in the following
                circumstances:
              </p>

              <SubHeading>Service Providers</SubHeading>
              <p>
                We share information with trusted third-party service providers who assist us in
                operating the Platform, subject to confidentiality obligations:
              </p>
              <ul>
                <li>
                  <strong>Stripe:</strong> Payment processing. Stripe receives your payment
                  information directly and is subject to its own privacy policy and PCI DSS
                  compliance requirements.
                </li>
                <li>
                  <strong>Supabase:</strong> Database storage and user authentication. Your account
                  data, form submissions, and Platform data are stored on Supabase&apos;s infrastructure.
                </li>
                <li>
                  <strong>Vercel:</strong> Website hosting and deployment. Vercel may process
                  request logs and IP addresses as part of serving the Site.
                </li>
              </ul>

              <SubHeading>Legal Requirements</SubHeading>
              <p>
                We may disclose your information if required to do so by law or in response to
                valid requests by public authorities (e.g., a court, government agency, or law
                enforcement) when we believe in good faith that disclosure is necessary to comply
                with a legal obligation, protect our rights or property, prevent fraud or illegal
                activity, or protect the safety of our users or the public.
              </p>

              <SubHeading>Business Transfers</SubHeading>
              <p>
                If the Company is involved in a merger, acquisition, asset sale, or similar
                transaction, your information may be transferred as part of that transaction. We
                will provide notice before your personal information is transferred and becomes
                subject to a different privacy policy.
              </p>

              <SubHeading>With Your Consent</SubHeading>
              <p>
                We may share your information for any other purpose with your explicit consent.
              </p>
            </LegalSection>

            {/* 5 */}
            <LegalSection id="cookies" number="5" title="Cookies & Tracking Technologies">
              <SubHeading>What Are Cookies</SubHeading>
              <p>
                Cookies are small text files placed on your device by a website. We use cookies and
                similar tracking technologies (such as local storage and session storage) to operate
                and improve the Platform.
              </p>

              <SubHeading>Types of Cookies We Use</SubHeading>
              <ul>
                <li>
                  <strong>Essential Cookies:</strong> Required for the Platform to function. These
                  include session cookies for authentication and security.
                </li>
                <li>
                  <strong>Functional Cookies:</strong> Used to remember your preferences and
                  settings, such as cookie consent status.
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Used to understand how visitors interact with
                  the Platform, including which pages are most visited and how users navigate the
                  Site.
                </li>
              </ul>

              <SubHeading>Managing Cookies</SubHeading>
              <p>
                You can control cookies through your browser settings. Most browsers allow you to
                refuse new cookies, delete existing cookies, or be notified when new cookies are
                set. Note that disabling cookies may affect the functionality of the Platform.
              </p>
              <p>
                Our Platform displays a cookie consent notice on your first visit. By continuing to
                use the Platform after dismissing the notice, you consent to our use of cookies as
                described in this policy.
              </p>
            </LegalSection>

            {/* 6 */}
            <LegalSection id="retention" number="6" title="Data Retention">
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes
                described in this Privacy Policy, unless a longer retention period is required or
                permitted by law.
              </p>
              <ul>
                <li>
                  <strong>Account Data:</strong> Retained for the duration of your account and for
                  a reasonable period afterward to comply with legal obligations and resolve
                  disputes.
                </li>
                <li>
                  <strong>Contact Form Submissions:</strong> Retained until the inquiry has been
                  resolved and for a reasonable archival period thereafter.
                </li>
                <li>
                  <strong>Newsletter Subscriptions:</strong> Retained until you unsubscribe or
                  request deletion.
                </li>
                <li>
                  <strong>Transaction Records:</strong> Retained for the period required by
                  applicable tax and financial regulations (typically 7 years).
                </li>
                <li>
                  <strong>IP Address / Pricing Timer Data:</strong> Retained for the duration of
                  the applicable pricing session and purged automatically thereafter.
                </li>
              </ul>
              <p>
                When information is no longer needed, we will securely delete or anonymize it.
              </p>
            </LegalSection>

            {/* 7 */}
            <LegalSection id="your-rights" number="7" title="Your Rights">
              <p>
                Depending on your location, you may have the following rights regarding your
                personal information:
              </p>
              <ul>
                <li>
                  <strong>Access:</strong> Request a copy of the personal information we hold about
                  you.
                </li>
                <li>
                  <strong>Correction:</strong> Request that we correct inaccurate or incomplete
                  information.
                </li>
                <li>
                  <strong>Deletion:</strong> Request that we delete your personal information,
                  subject to certain legal exceptions.
                </li>
                <li>
                  <strong>Opt-Out of Marketing:</strong> Unsubscribe from newsletter or marketing
                  emails at any time by using the unsubscribe link in any email we send or by
                  contacting us directly.
                </li>
                <li>
                  <strong>Data Portability:</strong> Request a copy of your personal data in a
                  structured, machine-readable format where technically feasible.
                </li>
                <li>
                  <strong>Restriction:</strong> Request that we restrict the processing of your
                  personal information in certain circumstances.
                </li>
              </ul>
              <p>
                To exercise any of these rights, please contact us through the{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Contact page
                </Link>
                . We will respond to your request within a reasonable timeframe and in accordance
                with applicable law. We may need to verify your identity before fulfilling certain
                requests.
              </p>
            </LegalSection>

            {/* 8 */}
            <LegalSection id="california" number="8" title="California Residents (CCPA)">
              <p>
                If you are a California resident, you have specific rights under the California
                Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA),
                including:
              </p>
              <ul>
                <li>
                  <strong>Right to Know:</strong> The right to request disclosure of the categories
                  and specific pieces of personal information we have collected about you, the
                  sources from which it was collected, and the purposes for which it was used.
                </li>
                <li>
                  <strong>Right to Delete:</strong> The right to request deletion of your personal
                  information, subject to certain exceptions.
                </li>
                <li>
                  <strong>Right to Correct:</strong> The right to request correction of inaccurate
                  personal information.
                </li>
                <li>
                  <strong>Right to Opt-Out of Sale or Sharing:</strong> We do not sell or share
                  your personal information with third parties for cross-context behavioral
                  advertising.
                </li>
                <li>
                  <strong>Right to Non-Discrimination:</strong> We will not discriminate against
                  you for exercising any of your CCPA rights.
                </li>
              </ul>
              <p>
                To submit a California privacy rights request, please contact us through the{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Contact page
                </Link>
                . We will respond within 45 days as required by applicable law.
              </p>
            </LegalSection>

            {/* 9 */}
            <LegalSection id="international" number="9" title="International Users">
              <p>
                The Platform is operated from the United States. If you are located outside of the
                United States, please be aware that any information you provide to us will be
                transferred to, processed, and stored in the United States, where data protection
                laws may differ from those in your country.
              </p>
              <p>
                By using the Platform, you consent to the transfer of your information to the
                United States and its processing in accordance with this Privacy Policy.
              </p>
              <p>
                We do not currently offer services specifically targeted at residents of the
                European Economic Area (EEA), United Kingdom, or other jurisdictions with specific
                data transfer requirements. If you are located in such a jurisdiction and have
                questions about your data, please contact us.
              </p>
            </LegalSection>

            {/* 10 */}
            <LegalSection id="children" number="10" title="Children's Privacy">
              <p>
                The Platform is not directed to children under the age of 13, and we do not
                knowingly collect personal information from children under 13. If we become aware
                that we have inadvertently collected personal information from a child under 13, we
                will take steps to delete such information as soon as practicable.
              </p>
              <p>
                If you are a parent or guardian and believe your child has provided personal
                information to us without your consent, please contact us through the{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Contact page
                </Link>{" "}
                and we will take appropriate action.
              </p>
              <p>
                The Platform requires all users to be at least 18 years of age (see our{" "}
                <Link href="/terms" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  Terms of Service
                </Link>
                ), further limiting the likelihood of data collection from minors.
              </p>
            </LegalSection>

            {/* 11 */}
            <LegalSection id="security" number="11" title="Security Measures">
              <p>
                We implement reasonable technical and organizational security measures to protect
                your personal information against unauthorized access, alteration, disclosure, or
                destruction. These measures include:
              </p>
              <ul>
                <li>HTTPS encryption for all data transmitted between your browser and the Platform</li>
                <li>Row-level security policies on our database (Supabase)</li>
                <li>
                  Payment processing exclusively through Stripe, which maintains PCI DSS compliance
                  and handles all sensitive card data
                </li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
              <p>
                However, no method of transmission over the Internet or electronic storage is 100%
                secure. While we strive to use commercially acceptable means to protect your
                information, we cannot guarantee absolute security. You provide your information at
                your own risk.
              </p>
              <p>
                In the event of a data breach that affects your rights and freedoms, we will notify
                affected users as required by applicable law.
              </p>
            </LegalSection>

            {/* 12 */}
            <LegalSection id="third-party" number="12" title="Third-Party Links">
              <p>
                The Platform may contain links to third-party websites, products, or services that
                are not owned or controlled by us. This Privacy Policy applies only to our Platform.
              </p>
              <p>
                We have no control over and assume no responsibility for the content, privacy
                policies, or practices of any third-party websites or services. We strongly advise
                you to review the privacy policy of every site you visit.
              </p>
            </LegalSection>

            {/* 13 */}
            <LegalSection id="changes" number="13" title="Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. When we do, we will revise
                the &quot;Last Updated&quot; date at the top of this page. For material changes, we may
                provide additional notice, such as a notice on the Site or an email to registered
                users.
              </p>
              <p>
                Your continued use of the Platform after any changes to this Privacy Policy
                constitutes your acceptance of the revised policy. We encourage you to review this
                page periodically to stay informed about how we protect your information.
              </p>
            </LegalSection>

            {/* 14 */}
            <LegalSection id="contact" number="14" title="Contact Information">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or
                our data practices, please contact us:
              </p>
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
