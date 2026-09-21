import StarRatingDisplay from "./StarRatingDisplay";

interface Review {
  id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  vendor_response: string | null;
  vendor_response_at: string | null;
  created_at: string;
}

export default function ReviewCard({ review, sellerName }: { review: Review; sellerName: string }) {
  return (
    <div style={{ padding: "24px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
            {review.reviewer_name || "Anonymous"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <StarRatingDisplay rating={review.rating} size={14} />
            <span
              style={{
                fontSize: "10px", fontWeight: 700, color: "#166534", background: "#eaf6ec",
                padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.05em",
              }}
            >
              Verified Purchase
            </span>
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "var(--ink-mute)", whiteSpace: "nowrap" }}>
          {new Date(review.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {review.comment && (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.65, marginBottom: review.vendor_response ? "16px" : 0 }}>
          {review.comment}
        </p>
      )}

      {review.vendor_response && (
        <div style={{ marginTop: "12px", padding: "14px 16px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
            Response from {sellerName}
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, margin: 0 }}>
            {review.vendor_response}
          </p>
        </div>
      )}
    </div>
  );
}
