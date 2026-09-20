"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const MIN_DIMENSION = 400; // px — rejects small/low-quality images
const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const DISPLAY_SIZE = 96; // px — fixed modern avatar size regardless of source dimensions

interface Props {
  currentAvatarUrl: string | null;
}

export default function AvatarUploader({ currentAvatarUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function checkImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read image dimensions"));
      };
      img.src = objectUrl;
    });
  }

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setError("");

    if (file.size > MAX_BYTES) {
      setError("Image must be under 3MB.");
      return;
    }

    try {
      const { width, height } = await checkImageDimensions(file);
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        setError(`Image is too small (${width}×${height}px). Please use at least ${MIN_DIMENSION}×${MIN_DIMENSION}px for a clear, high-quality picture.`);
        return;
      }
    } catch {
      setError("Couldn't read that image — please try a different file.");
      return;
    }

    setUploading(true);
    try {
      const presignRes = await fetch("/api/vendor/avatar/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error ?? "Failed to prepare upload");

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      const confirmRes = await fetch("/api/vendor/avatar/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicUrl: presignData.publicUrl }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error ?? "Failed to save picture");

      setAvatarUrl(confirmData.avatar_url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: `${DISPLAY_SIZE}px`,
          height: `${DISPLAY_SIZE}px`,
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
          background: "var(--bg-alt)",
          border: "1px solid var(--line)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Profile picture" fill style={{ objectFit: "cover" }} sizes={`${DISPLAY_SIZE}px`} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--ink-mute)", textAlign: "center", padding: "8px" }}>
            No photo
          </div>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff" }}>
            Uploading…
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-ghost btn-sm"
        >
          {avatarUrl ? "Change photo" : "Upload photo"}
        </button>
        <p style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "6px", maxWidth: "260px" }}>
          At least {MIN_DIMENSION}×{MIN_DIMENSION}px, under 3MB.
        </p>
        {error && <p style={{ fontSize: "12px", color: "#e53e3e", marginTop: "6px" }}>{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}