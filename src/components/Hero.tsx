"use client";

import Link from "next/link";
import VideoSlot from "@/components/VideoSlot";
import { videoConfig } from "@/lib/video-config";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "176px 24px 100px",
        position: "relative",
      }}
    >
      {/* Overline */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--ink-faded)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 0.2s",
        }}
      >
        <span style={{ display: "inline-block", width: "28px", height: "1px", background: "var(--ink-soft)" }} />
        The AI Marketplace
        <span style={{ display: "inline-block", width: "28px", height: "1px", background: "var(--ink-soft)" }} />
      </div>

      {/* Video slot — hidden when videoType is "none" */}
      <VideoSlot
        videoType={videoConfig.videoType}
        videoSrc={videoConfig.videoSrc}
        posterImage={videoConfig.posterImage}
      />

      {/* Headline */}
      <h1
        className="display"
        style={{
          fontSize: "clamp(56px, 10vw, 148px)",
          lineHeight: 0.92,
          maxWidth: "1100px",
          color: "var(--ink)",
          opacity: 0,
          animation: "fadeUp 1s ease forwards 0.35s",
        }}
      >
        Skip the Build.{" "}
        <span style={{ color: "var(--ink-mute)" }}>Buy the Solution.</span>
      </h1>

      {/* Subtext */}
      <p
        style={{
          marginTop: "36px",
          fontSize: "clamp(16px, 1.5vw, 18px)",
          fontWeight: 500,
          color: "var(--ink-faded)",
          maxWidth: "460px",
          lineHeight: 1.55,
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 0.55s",
        }}
      >
        Ready-made AI products that work out of the box. Built by experts. Deployed in minutes.
      </p>

      {/* Buttons */}
      <div
        className="hero-buttons"
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "44px",
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 0.75s",
        }}
      >
        <Link href="/products" className="btn btn-primary">Browse Products</Link>
        <Link href="/sell" className="btn btn-ghost">Start Selling</Link>
      </div>

      {/* Scroll cue */}
      <Link
        href="#recently-added"
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
          textDecoration: "none",
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 1s, scrollBounce 2s ease 1.5s infinite",
          whiteSpace: "nowrap",
        }}
      >
        Keep Scrolling
      </Link>
    </section>
  );
}
