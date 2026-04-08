import React from "react";

const ATTR_LABELS: Record<string, string> = {
  promptsIncluded: "Prompts Included",
  worksWith:       "Works With",
  license:         "License",
  format:          "Format",
  lastUpdated:     "Last Updated",
  version:         "Version",
  instantDownload: "Instant Download",
  support:         "Support",
  difficultyLevel: "Difficulty Level",
  builtWith:       "Built With",
  requirements:    "Requirements",
  aiModel:         "AI Model",
};

const ATTR_ORDER = Object.keys(ATTR_LABELS);

function formatValue(key: string, value: unknown): React.ReactNode | null {
  if (value === null || value === undefined || value === "") return null;

  if (key === "instantDownload") {
    return value ? "✓ Yes" : "✗ No";
  }

  if (key === "lastUpdated" && typeof value === "string") {
    try {
      const d = new Date(value + "T12:00:00");
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch { return value; }
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value : null;
  }

  return String(value);
}

function labelForKey(key: string): string {
  return ATTR_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export default function ProductAttributes({
  attributes,
}: {
  attributes: Record<string, unknown>;
}) {
  const entries: [string, unknown][] = [];

  for (const key of ATTR_ORDER) {
    const val = attributes[key];
    if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) {
      entries.push([key, val]);
    }
  }
  for (const key of Object.keys(attributes)) {
    if (!ATTR_ORDER.includes(key)) {
      const val = attributes[key];
      if (val !== null && val !== undefined && val !== "") entries.push([key, val]);
    }
  }

  if (entries.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "28px",
        paddingTop: "24px",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--ink-faded)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Product Details
      </div>

      <div>
        {entries.map(([key, value]) => {
          const formatted = formatValue(key, value);
          if (!formatted) return null;
          const isArray = Array.isArray(formatted);

          return (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isArray ? "flex-start" : "center",
                gap: "16px",
                padding: "9px 0",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--ink-mute)",
                  letterSpacing: "0.01em",
                  flexShrink: 0,
                  minWidth: "100px",
                }}
              >
                {labelForKey(key)}
              </span>

              {isArray ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    justifyContent: "flex-end",
                  }}
                >
                  {(formatted as unknown[]).map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--ink)",
                        background: "var(--bg-alt)",
                        border: "1px solid var(--line)",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {String(tag)}
                    </span>
                  ))}
                </div>
              ) : (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: key === "instantDownload" ? (value ? "#16a34a" : "var(--ink-faded)") : "var(--ink)",
                    textAlign: "right",
                  }}
                >
                  {formatted as string}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
