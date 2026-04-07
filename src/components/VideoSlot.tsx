"use client";

interface VideoSlotProps {
  videoSrc: string;
  videoType: "youtube" | "vimeo" | "mp4" | "livestream-youtube" | "livestream-twitch" | "none";
  posterImage?: string;
}

export default function VideoSlot({ videoSrc, videoType, posterImage }: VideoSlotProps) {
  if (videoType === "none" || !videoSrc) return null;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        aspectRatio: "16/9",
        border: "1px solid var(--line)",
        overflow: "hidden",
      }}
    >
      {videoType === "youtube" && (
        <iframe
          src={`https://www.youtube.com/embed/${videoSrc}?autoplay=0&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      )}
      {videoType === "vimeo" && (
        <iframe
          src={`https://player.vimeo.com/video/${videoSrc}?autoplay=0`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      )}
      {videoType === "mp4" && (
        <video
          src={videoSrc}
          controls
          preload="metadata"
          playsInline
          controlsList="nofullscreen"
          poster={posterImage}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      )}
      {videoType === "livestream-youtube" && (
        <iframe
          src={`https://www.youtube.com/embed/live_stream?channel=${videoSrc}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      )}
      {videoType === "livestream-twitch" && (
        <iframe
          src={`https://player.twitch.tv/?channel=${videoSrc}&parent=aidigitalproducts.com`}
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      )}
    </div>
  );
}
