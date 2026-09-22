import { getProducts } from "@/lib/products";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StickyBuyBar from "@/components/StickyBuyBar";
import ProductThumbnail from "@/components/ProductThumbnail";
import PriceAndBuySection from "@/components/PriceAndBuySection";
import ViewingBadge from "@/components/ViewingBadge";
import ProductMeta from "@/components/ProductMeta";
import { mockProducts, mockCategories } from "@/lib/mock-data";
import ViewTracker from "@/components/ViewTracker";
import ProductGallery, { type GalleryImage } from "@/components/ProductGallery";
import ProductAttributes from "@/components/ProductAttributes";
import VendorAvatarBadge from "@/components/VendorAvatarBadge";
import ReviewCard from "@/components/ReviewCard";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamicParams = true;
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from("products")
    .select("slug")
    .eq("is_active", true);

  const supabaseSlugs = (data ?? []).map((p) => ({ slug: p.slug }));
  const mockSlugs = mockProducts.map((p) => ({ slug: p.slug }));

  return [...supabaseSlugs, ...mockSlugs].filter(
    (p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mockMatch = mockProducts.find((p) => p.slug === slug);

  // Vendor products exist only in Supabase, so look there as well.
  const { data: dbProduct } = await supabaseAdmin
    .from("products")
    .select("name, description, thumbnail_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const name = mockMatch?.title ?? dbProduct?.name;
  if (!name) return {};

  const rawDescription = mockMatch?.description || dbProduct?.description || "";
  const clean = String(rawDescription).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const description = clean
    ? clean.length > 160
      ? clean.slice(0, 157).trimEnd() + "..."
      : clean
    : `${name} on AI Digital Products.`;

  const url = `https://www.aidigitalproducts.com/products/${slug}`;
  const title = `${name} \u2014 AI Digital Products`;
  const image =
    typeof dbProduct?.thumbnail_url === "string" && dbProduct.thumbnail_url.startsWith("http")
      ? dbProduct.thumbnail_url
      : null;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "AI Digital Products",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const mockMatch = mockProducts.find((p) => p.slug === slug);

  // Always fetch live Supabase data to get purchases, flags, and PLR fields
  const { data: dbProduct } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, sale_price_cents, regular_price_cents, sale_stripe_price_id, regular_stripe_price_id, plr_price_cents, plr_stripe_price_id, is_plr_available, description, is_active, purchases, is_favorite, is_featured, is_not_ai, vendor_id, creator_refund_terms, rating, review_count")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  let product: (typeof mockProducts)[0] | null = null;

  if (mockMatch && dbProduct) {
    // Merge: mock is source of truth for priceId/regularPriceId/features,
    // Supabase is source of truth for purchases, flags, and PLR pricing
    product = {
      ...mockMatch,
      purchases: dbProduct.purchases ?? 0,
      isFavorite: dbProduct.is_favorite ?? false,
      isFeatured: dbProduct.is_featured ?? false,
      isNotAi: dbProduct.is_not_ai ?? false,
      plrPrice: dbProduct.plr_price_cents ? dbProduct.plr_price_cents / 100 : undefined,
      plrPriceId: dbProduct.plr_stripe_price_id ?? undefined,
      isPlrAvailable: dbProduct.is_plr_available ?? false,
      rating: dbProduct.rating ?? undefined,
      reviewCount: dbProduct.review_count ?? undefined,
    };
  } else if (mockMatch) {
    product = { ...mockMatch, purchases: 0 };
  } else if (dbProduct) {
    const shaped = {
      id: dbProduct.id,
      slug: dbProduct.slug,
      title: dbProduct.name,
      category: dbProduct.category ?? "Prompt Packs",
      price: (dbProduct.sale_price_cents ?? 0) / 100,
      regularPrice: dbProduct.regular_price_cents ? dbProduct.regular_price_cents / 100 : undefined,
      description: dbProduct.description ?? "",
      priceId: dbProduct.sale_stripe_price_id ?? undefined,
      regularPriceId: dbProduct.regular_stripe_price_id ?? undefined,
      plrPrice: dbProduct.plr_price_cents ? dbProduct.plr_price_cents / 100 : undefined,
      plrPriceId: dbProduct.plr_stripe_price_id ?? undefined,
      isPlrAvailable: dbProduct.is_plr_available ?? false,
      thumbnailUrl: undefined,
      purchases: dbProduct.purchases ?? 0,
      isFavorite: dbProduct.is_favorite ?? false,
      isFeatured: dbProduct.is_featured ?? false,
      isNotAi: dbProduct.is_not_ai ?? false,
      rating: dbProduct.rating ?? undefined,
      reviewCount: dbProduct.review_count ?? undefined,
    };
    // @ts-ignore
    product = shaped;
  } else {
    // Check for slug redirect
    const { data: redirectTarget } = await supabaseAdmin
      .from("products")
      .select("slug")
      .eq("old_slug", slug)
      .eq("is_active", true)
      .single();

    if (redirectTarget?.slug) {
      redirect(`/products/${redirectTarget.slug}`);
    }

    notFound();
  }

  if (!product) notFound();

  // Resolve the real "Sold by" name from the vendor relationship. dbProduct
  // is only populated when a real Supabase row exists — mock-only products
  // have no vendor_id and fall back to the site default.
  let sellerName = "AI Digital Products";
  let sellerAvatarUrl: string | null = null;
  let sellerVendorId: string | null = null;
  if (dbProduct?.vendor_id) {
    const { data: vendorRow } = await supabaseAdmin
      .from("vendor_profiles")
      .select("display_name, avatar_url")
      .eq("id", dbProduct.vendor_id)
      .single();
    if (vendorRow?.display_name) sellerName = vendorRow.display_name;
    sellerAvatarUrl = vendorRow?.avatar_url ?? null;
    sellerVendorId = dbProduct.vendor_id;
  }
  product.seller = sellerName;
  const creatorRefundTerms = dbProduct?.creator_refund_terms ?? null;

  const categoryObj = mockCategories.find((c) => c.name === product.category);
  const categorySlug = categoryObj?.slug ?? product.category.toLowerCase().replace(/\s+/g, "-");

  const allProducts = await getProducts();
  const related = allProducts.filter((p) => p.slug !== product.slug).slice(0, 4);

  async function generateHowToUseSteps(productTitle: string): Promise<string[]> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: `You are writing 3 short "How To Use" steps for a digital product called: "${productTitle}".

Rules:
- Each step is one concise sentence (max 12 words)
- Steps must be specific to this exact product type
- Written in second person ("Download your...", "Open the...", "Use the...")
- No fluff, no generic advice
- Return ONLY a JSON array of 3 strings, nothing else

Example format: ["Step one here", "Step two here", "Step three here"]`,
            },
          ],
        }),
        next: { revalidate: 86400 },
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? "[]";
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    } catch {
      // fall through to defaults
    }

    return [
      "Download your files instantly after purchase",
      "Follow the included documentation to get started",
      "Deploy or use your product right away",
    ];
  }

  const howToUseSteps = await generateHowToUseSteps(product.title);

  const isComingSoon = !product.priceId;
  const hasSale = !!(product.regularPrice && product.regularPriceId);

  const [{ data: dbProductData }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id, attributes, thumbnail_url")
      .eq("slug", slug)
      .single(),
  ]);

  const attributes     = (dbProductData?.attributes as Record<string, unknown> | null) ?? {};
  const dbProductId    = dbProductData?.id ?? product.id;
  const dbThumbnailUrl = (dbProductData?.thumbnail_url as string | null) ?? null;

  const { data: dbImages } = await supabaseAdmin
    .from("product_images")
    .select("url, is_primary, display_order, alt_text")
    .eq("product_id", dbProductId)
    .order("display_order", { ascending: true });

  let galleryImages: GalleryImage[];
  if (dbImages && dbImages.length > 0) {
    const sorted = [...dbImages].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return 0;
    });
    galleryImages = sorted.map((img) => ({
      url: img.url,
      alt: (img.alt_text as string | null) ?? product.title,
    }));
  } else {
    const fallback = dbThumbnailUrl ?? product.thumbnailUrl ?? null;
    galleryImages = fallback ? [{ url: fallback, alt: product.title }] : [];
  }

  // Reviews — hidden ones excluded from the public list entirely (matches
  // the same exclusion already applied when the aggregate rating/count is
  // calculated on submission).
  const { data: reviewsData } = await supabaseAdmin
    .from("product_reviews")
    .select("id, reviewer_name, rating, comment, vendor_response, vendor_response_at, created_at")
    .eq("product_id", dbProductId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });
  const reviews = reviewsData ?? [];

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "clamp(60px, 10vw, 100px)", overflowX: "hidden" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "12px 24px 0",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 8px",
            alignItems: "center",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--ink-faded)",
            overflow: "hidden",
          }}
        >
          <Link href="/products" className="nav-link">
            Products
          </Link>
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <Link href={`/categories/${categorySlug}`} className="nav-link">
            {product.category}
          </Link>
          <span style={{ color: "var(--ink-mute)" }}>/</span>
          <span
            style={{
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "min(400px, 50vw)",
            }}
          >
            {product.title}
          </span>
        </div>

        <section
          style={{
            borderBottom: "1px solid var(--line-soft)",
            padding: "0 0 clamp(48px, 8vw, 80px)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="detail-grid">
              <ProductGallery images={galleryImages} alt={product.title} />

              <div
                style={{
                  padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)",
                  background: "var(--bg)",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--ink-faded)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                  }}
                >
                  {product.category}
                </div>

                <h1
                  className="display"
                  style={{
                    fontSize: "clamp(24px, 4vw, 56px)",
                    lineHeight: 1.05,
                    color: "var(--ink)",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {product.title}
                </h1>

                {/* Favorite + Human-Made pills on detail page */}
                {(product.isFavorite || product.isNotAi) && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                    {product.isFavorite && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "rgba(245, 243, 238, 0.93)",
                          border: "1px solid rgba(0,0,0,0.10)",
                          borderRadius: "4px",
                          padding: "4px 8px",
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
                    {product.isNotAi && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "rgba(245, 243, 238, 0.93)",
                          border: "1px solid rgba(0,0,0,0.10)",
                          borderRadius: "4px",
                          padding: "4px 8px",
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
                )}

                {isComingSoon ? (
                  <>
                    <div
                      style={{
                        marginTop: "24px",
                        fontSize: "48px",
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        color: "var(--ink)",
                        lineHeight: 1,
                      }}
                    >
                      ${product.price.toFixed(2)}
                    </div>
                    <p
                      style={{
                        marginTop: "20px",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "var(--ink-faded)",
                        lineHeight: 1.65,
                      }}
                    >
                      {product.description}
                    </p>
                    <div style={{ marginTop: "36px" }}>
                      <span
                        className="btn btn-primary"
                        style={{ opacity: 0.45, cursor: "not-allowed" }}
                      >
                        Coming Soon
                      </span>
                    </div>
                  </>
                ) : (
                  <PriceAndBuySection
                    productId={product.id}
                    productName={product.title}
                    salePrice={product.price}
                    salePriceId={product.priceId}
                    regularPrice={hasSale ? product.regularPrice : undefined}
                    regularPriceId={hasSale ? product.regularPriceId : undefined}
                    description={product.description}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    purchases={product.purchases}
                    plrPrice={product.plrPrice}
                    plrPriceId={product.plrPriceId}
                    isPlrAvailable={product.isPlrAvailable}
                  />
                )}

                <div
                  style={{
                    marginTop: "32px",
                    paddingTop: "24px",
                    borderTop: "1px solid var(--line)",
                    fontSize: "12px",
                    color: "var(--ink-mute)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <VendorAvatarBadge url={sellerAvatarUrl} size={22} alt={product.seller} />
                  {sellerVendorId ? (
                    <Link href={`/sellers/${sellerVendorId}`} style={{ color: "var(--ink-mute)", textDecoration: "underline" }}>
                      Sold by {product.seller}
                    </Link>
                  ) : (
                    <span>Sold by {product.seller}</span>
                  )}
                  <span style={{ color: "var(--ink-soft)" }}>·</span>
                  <Link href="/refund-buyer-protection" style={{ color: "var(--ink-mute)", textDecoration: "underline" }}>
                    Refund policy
                  </Link>
                </div>

                {creatorRefundTerms && (
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "12px",
                      color: "var(--ink-faded)",
                      fontWeight: 500,
                      lineHeight: 1.6,
                      background: "var(--bg-alt)",
                      border: "1px solid var(--line)",
                      padding: "10px 14px",
                    }}
                  >
                    <strong style={{ color: "var(--ink)" }}>Creator&apos;s refund terms:</strong> {creatorRefundTerms}
                  </div>
                )}

                {Object.keys(attributes).length > 0 && (
                  <ProductAttributes attributes={attributes} />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — About this product —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.05,
                color: "var(--ink)",
                marginBottom: "28px",
              }}
            >
              What it does.{" "}
              <span style={{ color: "var(--ink-mute)" }}>How it works.</span>
            </h2>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.7,
                marginBottom: "20px",
              }}
            >
              {product.description} This product is built to be deployed, not studied. Everything
              you need to get it running is included.
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.7,
              }}
            >
              The documentation covers the full setup process from start to finish. If you run into
              anything, seller support is included.
            </p>
          </div>
        </section>

        <section className="block alt">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — How to use —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.05,
                color: "var(--ink)",
                marginBottom: "48px",
              }}
            >
              Ready in 3 simple steps.{" "}
              <span style={{ color: "var(--ink-mute)" }}>Start creating today.</span>
            </h2>
            <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0" }}>
              {howToUseSteps.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: "24px",
                    alignItems: "flex-start",
                    padding: "20px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--ink-mute)",
                      letterSpacing: "0.1em",
                      lineHeight: 1,
                      flexShrink: 0,
                      paddingTop: "2px",
                      minWidth: "20px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--ink-faded)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — Seller —
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <VendorAvatarBadge url={sellerAvatarUrl} size={48} alt={product.seller} />
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "var(--ink)",
                }}
              >
                {product.seller}
              </div>
            </div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "var(--ink-faded)",
                lineHeight: 1.65,
                maxWidth: "480px",
                marginBottom: "16px",
              }}
            >
              An independent builder specialising in AI digital products. All products are tested,
              documented, and supported directly by the seller.
            </p>

            {dbProduct?.vendor_id && (
              <p style={{ marginBottom: "16px" }}>
                <Link
                  href={`/sellers/${dbProduct.vendor_id}`}
                  style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", textDecoration: "underline" }}
                >
                  View all products from {product.seller} &rarr;
                </Link>
              </p>
            )}
            {creatorRefundTerms && (
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--ink-faded)",
                  lineHeight: 1.65,
                  maxWidth: "480px",
                  marginBottom: "16px",
                }}
              >
                <strong style={{ color: "var(--ink)" }}>Refund terms for this product:</strong>{" "}
                {creatorRefundTerms}
              </p>
            )}
            <Link
              href="/refund-buyer-protection"
              style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", textDecoration: "underline" }}
            >
              View the full Refund &amp; Buyer Protection Policy →
            </Link>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
              — Reviews —
            </div>
            {reviews.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
                <StarRatingDisplay rating={product.rating ?? 0} size={22} />
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>
                  {(product.rating ?? 0).toFixed(1)}
                </span>
                <span style={{ fontSize: "14px", color: "var(--ink-mute)" }}>
                  ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            {reviews.length === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>
                No reviews yet — be the first to leave one after your purchase.
              </p>
            ) : (
              <div>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} sellerName={product.seller ?? "the seller"} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            padding: "clamp(80px, 12vw, 160px) 24px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              — Related —
            </div>
            <h2
              className="display"
              style={{
                fontSize: "clamp(32px, 4.5vw, 60px)",
                lineHeight: 0.96,
                color: "var(--ink)",
                textAlign: "center",
                marginBottom: "64px",
              }}
            >
              You might also like.{" "}
              <span style={{ color: "var(--ink-mute)" }}>More from the marketplace.</span>
            </h2>
            <div className="related-grid">
              {related.map((p) => (
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
                      ...(p.isFeatured
                        ? { boxShadow: "0 0 0 1px rgba(160,160,160,0.13), 0 6px 32px rgba(0,0,0,0.16)" }
                        : {}),
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <ProductThumbnail url={p.thumbnailUrl} alt={p.title} />

                      {p.isFavorite && (
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

                      {p.isNotAi && (
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
                          {p.title}
                        </div>
                        <div className="card-seller" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <VendorAvatarBadge url={p.sellerAvatarUrl ?? null} size={26} alt={p.seller ?? "Seller"} />
                          <span>Seller · {p.seller}</span>
                        </div>

                        <ProductMeta
                          rating={p.rating}
                          reviewCount={p.reviewCount}
                          price={p.price}
                          purchases={p.purchases}
                        />

                        <ViewingBadge productId={p.id} />
                      </div>
                      <span className="card-arrow" style={{ marginTop: "20px" }}>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <ViewTracker productId={product.id} />

      <StickyBuyBar
        price={product.price}
        priceId={product.priceId}
        productId={product.id}
        productName={product.title}
      />
    </>
  );
}
