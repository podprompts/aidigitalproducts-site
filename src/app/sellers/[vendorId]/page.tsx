import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductThumbnail from "@/components/ProductThumbnail";
import ProductMeta from "@/components/ProductMeta";
import ViewingBadge from "@/components/ViewingBadge";
import VendorAvatarBadge from "@/components/VendorAvatarBadge";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveVendor, weightedVendorRating } from "@/lib/vendor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ vendorId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorId } = await params;
  const vendor = await getActiveVendor(vendorId);
  if (!vendor) return {};
  return {
    title: `${vendor.display_name} | AI Digital Products`,
    description: `Browse all products from ${vendor.display_name} on AI Digital Products.`,
  };
}

export default async function SellerStorefrontPage({ params }: Props) {
  const { vendorId } = await params;
  const vendor = await getActiveVendor(vendorId);
  if (!vendor) notFound();

  const { data: productRows } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, category, sale_price_cents, thumbnail_url, video_url, is_favorite, is_featured, is_not_ai, purchases, rating, review_count"
    )
    .eq("vendor_id", vendorId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const products = productRows ?? [];
  const sellerName = vendor.display_name as string;
  const agg = weightedVendorRating(products);

  return (
    <>
      <Nav />
      <main style={{ overflowX: "hidden" }}>
        <section className="page-hero">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <VendorAvatarBadge url={vendor.avatar_url ?? null} size={88} alt={sellerName} />
          </div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--ink-faded)",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              marginBottom: "20px",
            }}
          >
            &mdash; Seller &mdash;
          </div>
          <h1
            className="display"
            style={{
              fontSize: "clamp(32px, 5vw, 64px)",
              lineHeight: 1.02,
              color: "var(--ink)",
              wordBreak: "break-word",
            }}
          >
            {sellerName}
          </h1>
          <p
            style={{
              marginTop: "16px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--ink-faded)",
            }}
          >
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginTop: "14px" }}>
            {agg && (
              <Link
                href={`/sellers/${vendorId}/reviews`}
                style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
              >
                <StarRatingDisplay rating={agg.avg} size={15} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>{agg.avg.toFixed(1)}</span>
                <span style={{ fontSize: "13px", color: "var(--ink-mute)", textDecoration: "underline" }}>
                  ({agg.count} review{agg.count !== 1 ? "s" : ""})
                </span>
              </Link>
            )}
            <Link
              href={`/contact-seller/${vendorId}`}
              style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", textDecoration: "underline" }}
            >
              Contact Seller
            </Link>
          </div>
        </section>

        <section style={{ padding: "clamp(40px, 6vw, 80px) 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {products.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  fontSize: "15px",
                  color: "var(--ink-faded)",
                  fontWeight: 500,
                }}
              >
                This seller has no active products yet.
              </p>
            ) : (
              <div className="catalog-grid">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    style={{ textDecoration: "none", display: "flex", height: "100%", color: "inherit" }}
                  >
                    <div
                      className="card"
                      style={{
                        padding: "28px 28px 40px",
                        minHeight: "220px",
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        ...(p.is_featured
                          ? { boxShadow: "0 0 0 1px rgba(160,160,160,0.13), 0 6px 32px rgba(0,0,0,0.16)" }
                          : {}),
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <ProductThumbnail
                          url={p.thumbnail_url ?? undefined}
                          videoUrl={p.video_url ?? undefined}
                          alt={p.name}
                        />

                        {p.is_favorite && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "10px",
                              right: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(245, 243, 238, 0.93)",
                              backdropFilter: "blur(6px)",
                              WebkitBackdropFilter: "blur(6px)",
                              border: "1px solid rgba(0,0,0,0.10)",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              zIndex: 10,
                            }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                              <circle cx="4" cy="4" r="3" style={{ fill: "#e8c97a" }} />
                            </svg>
                            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2a2a2a" }}>
                              Favorite
                            </span>
                          </div>
                        )}

                        {p.is_not_ai && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "10px",
                              left: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(245, 243, 238, 0.93)",
                              backdropFilter: "blur(6px)",
                              WebkitBackdropFilter: "blur(6px)",
                              border: "1px solid rgba(0,0,0,0.10)",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              zIndex: 10,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: "block", flexShrink: 0, fill: "none" }}>
                              <path d="M2 8 Q5 1 8 8" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                              <path d="M3.5 9 Q5 3.5 6.5 9" style={{ stroke: "#3a3a3a", fill: "none" }} strokeWidth="1.2" strokeLinecap="round" />
                              <circle cx="5" cy="9.2" r="0.6" style={{ fill: "#3a3a3a" }} />
                            </svg>
                            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2a2a2a" }}>
                              Human-Made
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-faded)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                            {p.category}
                          </div>
                          <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: "8px", lineHeight: 1.25 }}>
                            {p.name}
                          </div>

                          <ProductMeta
                            rating={p.rating != null ? Number(p.rating) : undefined}
                            reviewCount={p.review_count != null ? Number(p.review_count) : undefined}
                            price={(p.sale_price_cents ?? 0) / 100}
                            purchases={p.purchases ?? 0}
                          />

                          <ViewingBadge productId={p.id} />
                        </div>
                        <span className="card-arrow" style={{ marginTop: "20px" }}>&rarr;</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}