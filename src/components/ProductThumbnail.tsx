"use client";
 
import Image from "next/image";
import { useRef, useState } from "react";
 
interface Props {
  url?: string;
  videoUrl?: string;
  alt: string;
  /** Use "detail" for the large 4:3 preview on the product detail page */
  variant?: "card" | "detail";
}
 
function isVideo(url?: string) {
  return !!url && url.split("?")[0].toLowerCase().endsWith(".mp4");
}
 
export default function ProductThumbnail({ url, videoUrl, alt, variant = "card" }: Props) {
  const primaryIsVideo = isVideo(url);
  const hasHoverVideo = !!videoUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);
 
  function handleMouseEnter() {
    if (!hasHoverVideo) return;
    setHovering(true);
    videoRef.current?.play();
  }
 
  function handleMouseLeave() {
    if (!hasHoverVideo) return;
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }
 
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
          primaryIsVideo ? (
            <video
              src={url}
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
              style={{ objectFit: "cover" }}
            />
          )
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
 
  // "card" variant — hover plays videoUrl silently over the thumbnail
  return (
    <div
      className="card-thumbnail"
      style={{ position: "relative", overflow: "hidden" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Static thumbnail — image or mp4 */}
      {url && (
        primaryIsVideo ? (
          <video
            src={url}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Image
            src={url}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
            style={{
              objectFit: "cover",
              transition: "opacity 0.3s",
              opacity: hovering && hasHoverVideo ? 0 : 1,
            }}
          />
        )
      )}
 
      {/* Hover video — fades in over the thumbnail on mouseenter */}
      {hasHoverVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: hovering ? 1 : 0,
            transition: "opacity 0.3s",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}