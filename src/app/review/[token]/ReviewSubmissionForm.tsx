"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  token: string;
  state: "valid" | "used" | "expired" | "invalid";
  productName?: string;
  productThumbnailUrl?: string | null;
  customerFirstName?: string | null;
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", lineHeight: 1 }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? "#c7a24c" : "none"} stroke={filled ? "#c7a24c" : "var(--ink-mute)"} strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewSubmissionForm({
  token,
  state,
  productName,
  productThumbnailUrl,
  customerFirstName,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }

  const wrapperStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: "24px",
  };

  if (state === "invalid") {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: "380px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>
            This link isn&apos;t valid.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
            Double-check the link from your email, or contact{" "}
            <a href="mailto:support@aidigitalproducts.com" style={{ color: "var(--ink)" }}>support@aidigitalproducts.com</a> if you think this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  if (state === "used") {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: "380px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>
            You&apos;ve already reviewed this.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
            Thanks again for your feedback — this link has already been used.
          </p>
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: "380px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>
            This link has expired.
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
            Review links are valid for a limited time. If you'd still like to leave a review, contact{" "}
            <a href="mailto:support@aidigitalproducts.com" style={{ color: "var(--ink)" }}>support@aidigitalproducts.com</a>.
          </p>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: "380px", textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>
            Thanks for your review!
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ink-faded)", lineHeight: 1.6 }}>
            It's now live on the product page. We really appreciate you taking the time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "440px" }}>
        <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "8px" }}>
          {customerFirstName ? `${customerFirstName}, how was it?` : "How was it?"}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--ink-faded)", marginBottom: "28px" }}>
          Leave a quick review for{" "}
          <strong style={{ color: "var(--ink)" }}>{productName}</strong>.
        </p>

        {productThumbnailUrl && (
          <div style={{ width: "72px", height: "72px", position: "relative", marginBottom: "24px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
            <Image src={productThumbnailUrl} alt={productName ?? ""} fill style={{ objectFit: "cover" }} sizes="72px" />
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
            Your Rating
          </label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label htmlFor="review-comment" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
            Your Review (optional)
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="What did you think? What worked well, what could be better?"
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--ink-soft)",
              fontSize: "14px", background: "transparent", color: "var(--ink)",
              fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
            }}
          />
        </div>

        {error && <p style={{ fontSize: "13px", color: "#e53e3e", marginBottom: "16px" }}>{error}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn btn-primary"
          style={{ opacity: status === "submitting" ? 0.6 : 1 }}
        >
          {status === "submitting" ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
