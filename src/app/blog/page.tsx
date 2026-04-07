import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockBlogPosts } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Blog — AI Digital Products",
  description:
    "Notes from the marketplace. Updates, ideas, and product guides from the AI Digital Products team.",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogPage() {
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
              — Blog —
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 8vw, 112px)",
                lineHeight: 0.94,
                color: "var(--ink)",
                maxWidth: "900px",
                margin: "0 auto",
              }}
            >
              Notes from the marketplace.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Updates and ideas.</span>
            </h1>
          </div>
        </section>

        {/* Blog grid */}
        <section style={{ padding: "0 0 clamp(80px, 12vw, 160px)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <div className="catalog-grid">
              {mockBlogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card"
                    style={{
                      padding: "48px 36px",
                      minHeight: "300px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--ink-faded)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}
                      >
                        {post.category}
                      </div>
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--ink-mute)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {formatDate(post.date)}
                      </div>
                      <div
                        style={{
                          marginTop: "16px",
                          fontSize: "18px",
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: "var(--ink)",
                          lineHeight: 1.25,
                        }}
                      >
                        {post.title}
                      </div>
                      <p
                        style={{
                          marginTop: "12px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--ink-faded)",
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.excerpt}
                      </p>
                    </div>
                    <div
                      style={{
                        marginTop: "28px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--ink)",
                      }}
                    >
                      Read more →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
