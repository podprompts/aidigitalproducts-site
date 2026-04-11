import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
 
interface SaleNotificationProps {
  productName: string;
  productUrl: string;
  expiresAt: string; // ISO string
  salePrice: string;
  wasPrice: string;
}
 
function formatExpiry(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
 
export default function SaleNotification({
  productName,
  productUrl,
  expiresAt,
  salePrice,
  wasPrice,
}: SaleNotificationProps) {
  const expiryFormatted = formatExpiry(expiresAt);
 
  return (
    <Html>
      <Head />
      <Preview>🔥 Your deal is live — 30 minutes only</Preview>
      <Body style={body}>
        <Container style={container}>
 
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>AIDigitalProducts.com</Text>
          </Section>
 
          {/* Hero */}
          <Section style={hero}>
            <Text style={eyebrow}>— Limited Time Offer —</Text>
            <Text style={headline}>Your deal is waiting.</Text>
            <Text style={subline}>
              The sale you signed up for is now live. You've got{" "}
              <strong>30 minutes</strong> before it expires.
            </Text>
          </Section>
 
          {/* Product */}
          <Section style={productBlock}>
            <Text style={productName_}>{productName}</Text>
            <Text style={pricing}>
              <span style={wasText}>Was {wasPrice}</span>
              {"  "}
              <span style={saleText}>{salePrice}</span>
            </Text>
          </Section>
 
          {/* CTA */}
          <Section style={{ textAlign: "center" as const, padding: "0 0 40px" }}>
            <Button style={button} href={productUrl}>
              Shop Now →
            </Button>
          </Section>
 
          <Hr style={divider} />
 
          {/* Expiry warning */}
          <Section style={expiryBlock}>
            <Text style={expiryText}>
              ⚠️ This offer expires on {expiryFormatted}. After this time, the
              sale price is no longer valid and cannot be honored. If you're
              reading this after the expiry date, visit{" "}
              <a href="https://aidigitalproducts.com" style={link}>
                AIDigitalProducts.com
              </a>{" "}
              to catch the next sale.
            </Text>
          </Section>
 
          <Hr style={divider} />
 
          {/* Deals list consent */}
          <Section style={consentBlock}>
            <Text style={consentText}>
              ☑ <strong>You're on the deals list.</strong>
            </Text>
            <Text style={consentSub}>
              You signed up to receive future deal alerts from AIDigitalProducts.com.
              We'll only email you when something worth your time drops — no spam,
              no newsletters, just real deals.
            </Text>
          </Section>
 
          <Hr style={divider} />
 
          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              AIDigitalProducts.com
            </Text>
            <Text style={footerSub}>
              You're receiving this because you requested a sale alert.{" "}
              <a href="https://aidigitalproducts.com" style={link}>
                Unsubscribe
              </a>
            </Text>
          </Section>
 
        </Container>
      </Body>
    </Html>
  );
}
 
// ── Styles ────────────────────────────────────────────────────────────────────
 
const body: React.CSSProperties = {
  backgroundColor: "#f4f4f2",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: 0,
};
 
const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#f4f4f2",
  border: "1px solid rgba(20,20,20,0.08)",
};
 
const header: React.CSSProperties = {
  backgroundColor: "#141414",
  padding: "24px 40px",
  textAlign: "center" as const,
};
 
const logo: React.CSSProperties = {
  color: "#f4f4f2",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  margin: 0,
};
 
const hero: React.CSSProperties = {
  padding: "48px 40px 32px",
  textAlign: "center" as const,
  borderBottom: "1px solid rgba(20,20,20,0.08)",
};
 
const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "rgba(20,20,20,0.55)",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
};
 
const headline: React.CSSProperties = {
  fontSize: "40px",
  fontWeight: 800,
  color: "#141414",
  letterSpacing: "-0.04em",
  lineHeight: "1",
  margin: "0 0 16px",
};
 
const subline: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 500,
  color: "rgba(20,20,20,0.55)",
  lineHeight: "1.6",
  margin: 0,
};
 
const productBlock: React.CSSProperties = {
  padding: "32px 40px",
  textAlign: "center" as const,
  borderBottom: "1px solid rgba(20,20,20,0.08)",
};
 
const productName_: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
  color: "#141414",
  letterSpacing: "-0.02em",
  margin: "0 0 12px",
};
 
const pricing: React.CSSProperties = {
  fontSize: "18px",
  margin: 0,
};
 
const wasText: React.CSSProperties = {
  color: "rgba(20,20,20,0.38)",
  textDecoration: "line-through",
  fontSize: "14px",
};
 
const saleText: React.CSSProperties = {
  color: "#141414",
  fontWeight: 800,
  fontSize: "28px",
  letterSpacing: "-0.03em",
};
 
const button: React.CSSProperties = {
  backgroundColor: "#141414",
  color: "#f4f4f2",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  padding: "14px 32px",
  border: "1px solid #141414",
  borderRadius: "0",
  textDecoration: "none",
  display: "inline-block",
};
 
const divider: React.CSSProperties = {
  borderColor: "rgba(20,20,20,0.08)",
  margin: 0,
};
 
const expiryBlock: React.CSSProperties = {
  padding: "24px 40px",
};
 
const expiryText: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(20,20,20,0.55)",
  lineHeight: "1.7",
  margin: 0,
};
 
const consentBlock: React.CSSProperties = {
  padding: "24px 40px",
};
 
const consentText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#141414",
  margin: "0 0 8px",
};
 
const consentSub: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(20,20,20,0.55)",
  lineHeight: "1.7",
  margin: 0,
};
 
const footer: React.CSSProperties = {
  padding: "24px 40px",
  textAlign: "center" as const,
};
 
const footerText: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#141414",
  letterSpacing: "0.08em",
  margin: "0 0 8px",
};
 
const footerSub: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(20,20,20,0.38)",
  margin: 0,
};
 
const link: React.CSSProperties = {
  color: "#141414",
  textDecoration: "underline",
};