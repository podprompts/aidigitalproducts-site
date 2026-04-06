import { stats } from "@/lib/content";

export default function Stats() {
  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: "var(--bg)",
            padding: "64px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "clamp(40px, 4.5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            {s.num}
          </div>
          <div
            style={{
              marginTop: "14px",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--ink-faded)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
