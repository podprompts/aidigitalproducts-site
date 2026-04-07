import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { mockBlogPosts } from "@/lib/mock-data";

type Props = { params: Promise<{ slug: string }> };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  return mockBlogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = mockBlogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — AI Digital Products`,
    description: post.excerpt,
  };
}

const placeholder = [
  "The starting point matters more than most people acknowledge. Before any implementation decision, the problem needs to be defined clearly — not loosely, not aspirationally. The specific failure mode you are solving for determines the entire shape of the solution.",
  "Most failures in this space come from scope creep at the wrong moment. The tools are capable. The challenge is deciding what to build first and holding that line long enough to learn from it.",
  "The pattern that works, consistently, is to build for the smallest viable use case and expand from there. This is not a limitation. It is a strategy. Narrow scope produces clear feedback. Clear feedback produces better decisions.",
  "This is the approach that scales. Not because it is fashionable, but because it reflects how durable systems actually get built.",
];

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = mockBlogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        {/* Hero */}
        <section className="page-hero" style={{ paddingTop: "80px", textAlign: "left" }}>
          <div className="prose-inner">
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                marginBottom: "28px",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              <span>{post.category}</span>
              <span style={{ color: "var(--ink-mute)" }}>—</span>
              <span>{formatDate(post.date)}</span>
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(36px, 5vw, 64px)",
                lineHeight: 0.96,
                color: "var(--ink)",
              }}
            >
              {post.title}
            </h1>
          </div>
        </section>

        {/* Prose */}
        <section className="block">
          <div className="prose-inner">
            <p
              style={{
                fontSize: "17px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.75,
                marginBottom: "28px",
              }}
            >
              {post.excerpt} This piece explores the underlying patterns in more depth.
            </p>

            <div style={{ height: "1px", background: "var(--line)", margin: "36px 0" }} />

            {placeholder.map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--ink-faded)",
                  lineHeight: 1.8,
                  marginBottom: i < placeholder.length - 1 ? "24px" : "0",
                }}
              >
                {para}
              </p>
            ))}

            <div style={{ height: "1px", background: "var(--line)", margin: "48px 0 36px" }} />

            <Link
              href="/blog"
              className="underline-link"
              style={{ fontSize: "13px" }}
            >
              ← Back to blog
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
