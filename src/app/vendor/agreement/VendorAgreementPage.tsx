"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";

interface Props {
  alreadyAgreedAt: string | null;
  vendorName: string;
}

const SECTIONS = [
  {
    title: "1. Parties and Scope",
    body: (
      <>
        <p>
          This Seller Agreement (&quot;Agreement&quot;) supplements the general{" "}
          <Link href="/terms" target="_blank" style={{ color: "var(--ink)", fontWeight: 600 }}>
            Terms of Service
          </Link>{" "}
          between you (&quot;Seller,&quot; &quot;you&quot;) and HONNYDO LLC d/b/a AI Digital Products (&quot;Company,&quot;
          &quot;we&quot;). It applies specifically to your relationship as an approved third-party seller
          on the Platform. Where this Agreement and the Terms of Service conflict, the Terms of
          Service govern.
        </p>
      </>
    ),
  },
  {
    title: "2. Commission and Payment",
    body: (
      <>
        <p>
          The Company retains a{" "}
          <Link href="/pricing" target="_blank" style={{ color: "var(--ink)", fontWeight: 600 }}>
            {PLATFORM_COMMISSION_PERCENT}% commission
          </Link>{" "}
          on each sale of your products. The remaining balance is transferred directly to your
          connected Stripe account by Stripe itself — the Company does not hold or manually
          disburse your funds.
        </p>
        <p>
          You are solely responsible for completing Stripe Connect onboarding to receive payouts.
          Sales are still recorded normally even before this is complete, but no funds can be sent
          to you until it is.
        </p>
        <p>
          Any change to the commission rate will be communicated to you in advance and reflected
          on the{" "}
          <Link href="/pricing" target="_blank" style={{ color: "var(--ink)", fontWeight: 600 }}>
            Pricing page
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    title: "3. Listing Standards and Responsibilities",
    body: (
      <>
        <p>You agree that every product you list will:</p>
        <ul>
          <li>Have an accurate, complete title, description, and preview materials</li>
          <li>Clearly disclose exactly what a buyer receives upon purchase</li>
          <li>Make truthful claims about functionality and results</li>
          <li>Comply with applicable law, including intellectual property law</li>
        </ul>
        <p>
          You are solely responsible for the quality, accuracy, delivery, and support of your own
          products. The Company is not responsible for defects, delivery failures, or disputes
          arising from your products.
        </p>
      </>
    ),
  },
  {
    title: "4. Intellectual Property Warranty",
    body: (
      <>
        <p>
          You represent and warrant that you own, or have the legal right to license, all content
          included in every product and listing you submit, and that none of it infringes the
          intellectual property rights of any third party. You retain ownership of your products;
          by listing them, you grant the Company a non-exclusive license to display, reproduce,
          and market them (including previews and descriptions) solely to operate and promote the
          Platform.
        </p>
      </>
    ),
  },
  {
    title: "5. Buyer Response Commitment",
    body: (
      <>
        <p>
          You agree to respond to legitimate buyer support and refund requests within{" "}
          <strong>48 hours</strong>. This is a response requirement, not a resolution requirement —
          you may reasonably need more time to investigate or fix an issue, but you must
          acknowledge the request and make a genuine effort to address it within that window.
        </p>
        <p>
          If you do not respond within 48 hours, or repeatedly ignore legitimate buyer messages,
          the Company may step in directly, as described in the{" "}
          <Link href="/refund-buyer-protection" target="_blank" style={{ color: "var(--ink)", fontWeight: 600 }}>
            Refund &amp; Buyer Protection Policy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    title: "6. Term and Termination",
    body: (
      <>
        <p>
          This Agreement remains in effect for as long as you have an active seller account. The
          Company may suspend or terminate your seller account and remove your listings for
          violations of this Agreement or the Terms of Service, fraudulent activity, repeated
          buyer complaints, or any conduct the Company determines is harmful to the Platform or
          its users. Termination does not affect the Company&apos;s right to recover any amounts owed,
          or your right to any payouts already earned and confirmed prior to termination.
        </p>
      </>
    ),
  },
];

export default function VendorAgreementPage({ alreadyAgreedAt, vendorName }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const alreadyAgreed = !!alreadyAgreedAt;

  async function handleAgree() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/agree-to-seller-agreement", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to record agreement");
      router.push("/vendor/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
      <div
        style={{
          fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)",
          textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "16px",
        }}
      >
        Seller Agreement
      </div>
      <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "var(--ink)", marginBottom: "16px" }}>
        {alreadyAgreed ? "Your Seller Agreement" : `One more step, ${vendorName}.`}
      </h1>
      {alreadyAgreed ? (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)", marginBottom: "32px" }}>
          You accepted this agreement on {new Date(alreadyAgreedAt!).toLocaleDateString()}.
        </p>
      ) : (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)", marginBottom: "32px", lineHeight: 1.6 }}>
          Before you can list products, please review and accept the Seller Agreement below.
        </p>
      )}

      <div
        style={{
          border: "1px solid var(--line)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          maxHeight: "480px",
          overflowY: "auto",
          marginBottom: "24px",
        }}
      >
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>
              {s.title}
            </h2>
            <div style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "10px" }}>
              {s.body}
            </div>
          </div>
        ))}
      </div>

      {!alreadyAgreed && (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "20px" }}>
            <input
              id="agree-checkbox"
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{ marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, cursor: "pointer" }}
            />
            <label htmlFor="agree-checkbox" style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.5, cursor: "pointer" }}>
              I have read and agree to this Seller Agreement.
            </label>
          </div>
          {error && <p style={{ fontSize: "13px", color: "#e53e3e", marginBottom: "16px" }}>{error}</p>}
          <button
            onClick={handleAgree}
            disabled={!checked || submitting}
            className="btn btn-primary"
            style={{ opacity: !checked || submitting ? 0.6 : 1 }}
          >
            {submitting ? "Saving…" : "Agree and Continue"}
          </button>
        </>
      )}

      {alreadyAgreed && (
        <a href="/vendor/dashboard" className="btn btn-ghost">
          Back to Dashboard
        </a>
      )}
    </div>
  );
}
