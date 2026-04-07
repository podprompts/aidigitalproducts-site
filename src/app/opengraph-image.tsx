import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Digital Products — The Marketplace for AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f4f4f2",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        {/* Dot-separated logo mark */}
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "rgba(20,20,20,0.38)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          AI · DIGITAL · PRODUCTS
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: "88px",
            fontWeight: 800,
            color: "#141414",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            textAlign: "center",
            maxWidth: "1000px",
          }}
        >
          The Marketplace for AI.
        </div>

        {/* Subline */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "22px",
            fontWeight: 500,
            color: "rgba(20,20,20,0.55)",
            letterSpacing: "-0.01em",
          }}
        >
          Chatbots · Voice Agents · Automations · Content Systems
        </div>
      </div>
    ),
    { ...size }
  );
}
