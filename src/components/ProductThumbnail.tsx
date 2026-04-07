import Image from "next/image";

interface Props {
  url?: string;
  alt: string;
  /** Use "detail" for the large 4:3 preview on the product detail page */
  variant?: "card" | "detail";
}

export default function ProductThumbnail({ url, alt, variant = "card" }: Props) {
  if (variant === "detail") {
    return (
      <div
        style={{
          background: "var(--bg-alt)",
          aspectRatio: "4/3",
          border: "1px solid var(--line)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--ink-mute)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Preview
          </span>
        )}
      </div>
    );
  }

  // "card" variant — slots into the existing .card-thumbnail styling
  return (
    <div className="card-thumbnail" style={{ position: "relative", overflow: "hidden" }}>
      {url && (
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
        />
      )}
    </div>
  );
}
