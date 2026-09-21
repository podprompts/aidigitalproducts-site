interface Props {
  rating: number;
  size?: number;
}

export default function StarRatingDisplay({ rating, size = 16 }: Props) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating);
        return (
          <svg
            key={n}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "#c7a24c" : "none"}
            stroke={filled ? "#c7a24c" : "var(--ink-mute)"}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
}
