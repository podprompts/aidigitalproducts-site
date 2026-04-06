"use client";

export default function SellerBlock() {
  return (
    <section className="block alt" id="sell">
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <Eyebrow>— For Sellers —</Eyebrow>

        <h2
          className="display"
          style={{
            fontSize: "clamp(40px, 6.5vw, 88px)",
            lineHeight: 0.96,
            maxWidth: "880px",
            margin: "0 auto",
            color: "var(--ink)",
          }}
        >
          Your AI.
          <br />
          <span style={{ color: "var(--ink-mute)" }}>Your storefront.</span>
        </h2>

        <p
          style={{
            marginTop: "28px",
            fontSize: "clamp(15px, 1.4vw, 17px)",
            fontWeight: 500,
            color: "var(--ink-faded)",
            maxWidth: "480px",
            margin: "28px auto 0",
            lineHeight: 1.6,
          }}
        >
          List your digital products on the fastest-growing AI marketplace. Zero upfront cost. We
          handle payments, delivery, and support.
        </p>

        <div
          className="link-row"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "32px",
            marginTop: "36px",
            flexWrap: "wrap",
          }}
        >
          <UnderlineLink href="#">Become a seller</UnderlineLink>
          <UnderlineLink href="#">Read the guide</UnderlineLink>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

function UnderlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: "var(--ink)",
        textDecoration: "none",
        borderBottom: "1px solid var(--ink-soft)",
        paddingBottom: "3px",
        transition: "border-color 0.25s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "var(--ink-soft)";
      }}
    >
      {children}
    </a>
  );
}
