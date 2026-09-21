import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import ReplyForm from "./ReplyForm";

export const dynamic = "force-dynamic";

export default async function VendorReviewsPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name")
    .eq("vendor_id", user.id);

  const productIds = (products ?? []).map((p) => p.id);
  const nameMap = new Map((products ?? []).map((p) => [p.id, p.name]));

  const { data: reviewsData } = productIds.length > 0
    ? await supabaseAdmin
        .from("product_reviews")
        .select("id, product_id, reviewer_name, rating, comment, vendor_response, created_at")
        .in("product_id", productIds)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
    : { data: [] };

  const reviews = reviewsData ?? [];
  const needsReply = reviews.filter((r) => !r.vendor_response).length;

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", marginBottom: "8px" }}>
        Reviews.
      </h1>
      <p style={{ fontSize: "14px", color: "var(--ink-faded)", marginBottom: "28px" }}>
        {reviews.length} review{reviews.length !== 1 ? "s" : ""} on your products
        {reviews.length > 0 ? ` - ${needsReply} awaiting a reply` : ""}. Replies are public.
      </p>

      {reviews.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>
          No reviews yet. Buyers are invited to review a few days after purchase.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                {nameMap.get(r.product_id) ?? "Product"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                    {r.reviewer_name || "Anonymous"}
                  </span>
                  <StarRatingDisplay rating={r.rating} size={14} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
                  {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              {r.comment ? (
                <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.65, margin: 0 }}>{r.comment}</p>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--ink-mute)", margin: 0 }}>(Rating only, no written comment)</p>
              )}
              <ReplyForm reviewId={r.id} existingReply={r.vendor_response} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}