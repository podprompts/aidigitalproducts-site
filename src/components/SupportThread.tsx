export interface ThreadMessage {
  id: string;
  author_role: string;
  body: string;
  created_at: string;
}

export default function SupportThread({
  messages,
  labels,
}: {
  messages: ThreadMessage[];
  labels: { buyer: string; seller: string; admin: string };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {messages.map((m) => {
        const who = m.author_role === "seller" ? labels.seller : m.author_role === "admin" ? labels.admin : labels.buyer;
        return (
          <div
            key={m.id}
            style={{
              padding: "12px 14px",
              border: "1px solid var(--line)",
              background: m.author_role === "buyer" ? "var(--bg)" : "var(--bg-alt)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {who}
              </span>
              <span style={{ fontSize: "11px", color: "var(--ink-mute)" }}>
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-faded)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {m.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}