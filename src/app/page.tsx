import Link from "next/link";
import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Hero from "@/components/Hero";
import StatsCarousel from "@/components/StatsCarousel";
import ProductGrid from "@/components/ProductGrid";
import RecentlyAddedCarousel from "@/components/RecentlyAddedCarousel";
import Stats from "@/components/Stats";
import SellerBlock from "@/components/SellerBlock";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE VIDEO
// To change the video: replace the ID below with the new YouTube video ID.
//   Example: for https://www.youtube.com/watch?v=dQw4w9WgXcQ
//   set YOUTUBE_VIDEO_ID = "dQw4w9WgXcQ"
// To hide the video entirely: set SHOW_HOMEPAGE_VIDEO = false
// ─────────────────────────────────────────────────────────────────────────────
const YOUTUBE_VIDEO_ID = "r6LeN1Wdbgk";
const SHOW_HOMEPAGE_VIDEO = true;

export default function Home() {
  return (
    <>
      {/* Ticker — homepage only */}
      <Ticker />

      <Nav />
      <Hero />

      {/* ── HOMEPAGE VIDEO ────────────────────────────────────────────────── */}
      {/* To hide this section: change SHOW_HOMEPAGE_VIDEO to false (line ~20) */}
      {/* To change the video: change YOUTUBE_VIDEO_ID (line ~19)             */}
      {SHOW_HOMEPAGE_VIDEO && (
        <section
          style={{
            padding: "clamp(48px, 7vw, 80px) 24px",
            borderBottom: "1px solid var(--line-soft)",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%", /* 16:9 aspect ratio */
                height: 0,
                overflow: "hidden",
                borderRadius: "6px",
                background: "var(--bg-alt)",
              }}
            >
              <iframe
                key={YOUTUBE_VIDEO_ID}
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
                title="AI Digital Products intro video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          </div>
        </section>
      )}
      {/* ── END HOMEPAGE VIDEO ──────────────────────────────────────────── */}

      {/* Stats bar — swipeable/draggable infinite carousel */}
      <StatsCarousel />

      {/* Recently Added */}
      <section className="block" id="recently-added">
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
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
            — Recently Added —
          </div>
          <h2
            className="display"
            style={{
              fontSize: "clamp(36px, 5.5vw, 72px)",
              lineHeight: 0.96,
              maxWidth: "800px",
              margin: "0 auto",
              color: "var(--ink)",
            }}
          >
            Fresh off the press.{" "}
            <span style={{ color: "var(--ink-mute)" }}>New products daily.</span>
          </h2>
        </div>

        {/* Full-width draggable carousel — bleeds past the centered container */}
        <RecentlyAddedCarousel />

        <div style={{ maxWidth: "1200px", margin: "36px auto 0", textAlign: "center" }}>
          <Link href="/products" className="underline-link">
            Browse all products
          </Link>
        </div>
      </section>

      <ProductGrid />
      <Stats />
      <SellerBlock />
      <Pricing />
      <FinalCTA />
      <Footer />
    </>
  );
}
