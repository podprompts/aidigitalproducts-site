import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main
        style={{
          paddingTop: "100px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "160px 24px 120px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--ink-faded)",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            marginBottom: "28px",
          }}
        >
          — 404 —
        </div>

        <h1
          className="display"
          style={{
            fontSize: "clamp(40px, 7vw, 96px)",
            lineHeight: 0.94,
            color: "var(--ink)",
            maxWidth: "800px",
            marginBottom: "28px",
          }}
        >
          Page not found.{" "}
          <span style={{ color: "var(--ink-mute)" }}>But we&apos;re still here.</span>
        </h1>

        <p
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "var(--ink-faded)",
            maxWidth: "400px",
            lineHeight: 1.6,
            marginBottom: "44px",
          }}
        >
          The link you followed may be broken, or the page may have moved.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/products" className="btn btn-ghost">Browse products</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
