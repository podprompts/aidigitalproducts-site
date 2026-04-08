import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductsClient from "./ProductsClient";
import { supabaseAdmin } from "@/lib/supabase/server";
import { mockProducts, mockCategories } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Browse Products — AI Digital Products",
  description:
    "Browse the full catalog of AI digital products. Chatbots, voice agents, automations, content systems, and more. New listings daily.",
};

export default async function ProductsPage() {
  const { data: dbProducts } = await supabaseAdmin
    .from("products")
    .select("id, thumbnail_url");

  const thumbMap = Object.fromEntries(
    (dbProducts ?? []).map((p) => [p.id, p.thumbnail_url as string | null])
  );

  const products = mockProducts.map((p) => ({
    ...p,
    thumbnailUrl: thumbMap[p.id] ?? p.thumbnailUrl,
  }));

  const categoryNames = mockCategories.map((c) => c.name);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        {/* Hero */}
        <section className="page-hero" style={{ paddingTop: "96px" }}>
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
              — Marketplace —
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
              Every product.{" "}
              <span style={{ color: "var(--ink-mute)" }}>One marketplace.</span>
            </h1>
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
              Browse the full catalog of AI digital products. New listings daily.
            </p>
          </div>
        </section>

        {/* Filterable grid */}
        <section style={{ paddingBottom: "clamp(80px, 12vw, 160px)" }}>
          <ProductsClient products={products} categoryNames={categoryNames} />
        </section>
      </main>
      <Footer />
    </>
  );
}
