import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorAvatarBadge from "@/components/VendorAvatarBadge";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import ReviewCard from "@/components/ReviewCard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveVendor, weightedVendorRating } from "@/lib/vendor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ vendorId: string }>; searchParams: Promise<{ page?: string }> };
const PAGE_SIZE = 10;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorId } = await params;
  const vendor = await getActiveVendor(vendorId);
  if (!vendor) return {};
  return {
    title: `Reviews for ${vendor.display_name} | AI Digital Products`,
    description: `Customer reviews for all products from ${vendor.display_name} on AI Digital Products.`,
  };
}

export default async function SellerReviewsPage({ params, searchParams }: Props) {
  const { vendorId } = await params;
  const { page: pageParam } = await searchParams;
  const vendor = await getActiveVendor(vendorId);
  if (!vendor) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const sellerName = vendor.display_name as string;

  const { data: productRows } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, rating, review_count")
    .eq("vendor_id", vendorId)
    .eq("is_active", true);

  const products = productRows ?? [];
  const productIds = products.map((p) => p.id as string);
  const nameMap = new Map(products.map((p) => [p.id as string, { name: p.name as string, slug: p.slug as string }]));
  const agg = weightedVendorRating(products);

  let reviews: Array<{
    id: string; reviewer_name: string | null; rating: number; comment: string | null;
    vendor_response: string | null; vendor_response_at: string | null; created_at: string; product_id: string;
  }> = [];
  let totalCount = 0;

  if (productIds.length > 0) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabaseAdmin
      .from("product_reviews")
      .select("id, reviewer_name, rating, comment, vendor_response, vendor_response_at, created_at, product_id", { count: "exact" })
      .in("product_id", productIds)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .range(from, to);
    reviews = data ?? [];
    totalCount = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <Nav />
      <main style={{ overflowX: "hidden" }}>
        <section className="page-hero">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <VendorAvatarBadge url={vendor.avatar_url ?? null} size={72} alt={sellerName} />
          </div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "20px" }}>
            &mdash; Reviews &mdash;
          </div>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4.5vw, 56px)", lineHeight: 1.02, color: "var(--ink)", wordBreak: "break-word" }}>
            {sellerName}
          </h1>
          {agg && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "18px" }}>
              <StarRatingDisplay rating={agg.avg} size={20} />
              <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>{agg.avg.toFixed(1)}</span>
              <span style={{ fontSize: "14px", color: "var(--ink-mute)" }}>({agg.count} review{agg.count !== 1 ? "s" : ""})</span>
            </div>
          )}
          <p style={{ marginTop: "16px" }}>
            <Link href={`/sellers/${vendorId}`} style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", textDecoration: "underline" }}>
              &larr; Back to {sellerName}&apos;s storefront
            </Link>
          </p>
        </section>

        <section style={{ padding: "clamp(40px, 6vw, 80px) 24px" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            {reviews.length === 0 ? (
              <p style={{ textAlign: "center", fontSize: "15px", color: "var(--ink-faded)", fontWeight: 500 }}>
                No reviews yet.
              </p>
            ) : (
              <>
                <div>
                  {reviews.map((review) => {
                    const p = nameMap.get(review.product_id);
                    return (
                      <div key={review.id}>
                        {p && (
                          <Link
                            href={`/products/${p.slug}`}
                            style={{ display: "inline-block", marginTop: "20px", fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", textDecoration: "none" }}
                          >
                            On {p.name}
                          </Link>
                        )}
                        <ReviewCard review={review} sellerName={sellerName} />
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "32px" }}>
                    {page > 1 && (
                      <Link href={`/sellers/${vendorId}/reviews?page=${page - 1}`} className="btn btn-ghost btn-sm">
                        Previous
                      </Link>
                    )}
                    <span style={{ fontSize: "13px", color: "var(--ink-faded)", padding: "10px 14px" }}>
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link href={`/sellers/${vendorId}/reviews?page=${page + 1}`} className="btn btn-ghost btn-sm">
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}