import Image from "next/image";

interface Props {
  url: string | null;
  size?: number;
  alt?: string;
}

export default function VendorAvatarBadge({ url, size = 32, alt = "Seller" }: Props) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        background: "var(--bg-alt)",
        border: "1px solid var(--line)",
        flexShrink: 0,
      }}
    >
      {url ? (
        <Image src={url} alt={alt} fill style={{ objectFit: "cover" }} sizes={`${size}px`} />
      ) : (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: `${Math.max(9, size * 0.3)}px`, fontWeight: 700, color: "var(--ink-mute)",
          }}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}