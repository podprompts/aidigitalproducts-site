import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getPost(slug: string) {
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("id, slug, title, category, excerpt, body, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — AI Digital Products`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const paragraphs = (post.body as string).split(/\n\s*\n/).filter((p) => p.trim());

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
              <span>{formatDate(post.published_at)}</span>
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
            {paragraphs.map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--ink-faded)",
                  lineHeight: 1.8,
                  marginBottom: i < paragraphs.length - 1 ? "24px" : "0",
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