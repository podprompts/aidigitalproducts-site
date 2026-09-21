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
        .select("id, product_id, reviewer_name, rating, comment, vendor_response, is_hidden, created_at")
        .in("product_id", productIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const reviews = reviewsData ?? [];
  const visibleCount = reviews.filter((r) => !r.is_hidden).length;
  const hiddenCount = reviews.length - visibleCount;
  const needsReply = reviews.filter((r) => !r.is_hidden && !r.vendor_response).length;

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", marginBottom: "8px" }}>
        Reviews.
      </h1>
      <p style={{ fontSize: "14px", color: "var(--ink-faded)", marginBottom: "28px" }}>
        {visibleCount} review{visibleCount !== 1 ? "s" : ""} on your products
        {visibleCount > 0 ? ` - ${needsReply} awaiting a reply` : ""}. Replies are public.
        {hiddenCount > 0 ? ` ${hiddenCount} hidden by admin.` : ""}
      </p>

      {reviews.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>
          No reviews yet. Buyers are invited to review a few days after purchase.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid var(--line)",
                padding: "20px",
                opacity: r.is_hidden ? 0.6 : 1,
                background: r.is_hidden ? "var(--bg-alt)" : "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {nameMap.get(r.product_id) ?? "Product"}
                </div>
                {r.is_hidden && (
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: "#c0392b", background: "#fdecea" }}>
                    Hidden by admin
                  </span>
                )}
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

              {r.is_hidden ? (
                <div style={{ marginTop: "12px" }}>
                  {r.vendor_response && (
                    <div style={{ padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--line)", marginBottom: "10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                        Your reply
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                        {r.vendor_response}
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: "12px", color: "var(--ink-mute)", margin: 0 }}>
                    This review is not visible to the public and does not count toward your product rating.
                  </p>
                </div>
              ) : (
                <ReplyForm reviewId={r.id} existingReply={r.vendor_response} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}