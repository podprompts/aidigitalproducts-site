"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export interface UIImage {
  /** DB id — present for existing images, absent for newly queued uploads */
  id?: string;
  /** Preview URL — objectURL for new files, public URL for existing */
  url: string;
  file?: File;
  is_primary: boolean;
  display_order: number;
}

interface Props {
  images: UIImage[];
  onChange: (images: UIImage[]) => void;
  uploading?: boolean;
}

export default function ImageUploader({ images, onChange, uploading }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx,  setDragIdx]  = useState<number | null>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: UIImage[] = [...images];
    Array.from(files).forEach((file, i) => {
      next.push({
        url: URL.createObjectURL(file),
        file,
        is_primary: next.length === 0 && i === 0,
        display_order: next.length,
      });
    });
    onChange(reorder(next));
  }

  function remove(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    // If removed was primary, make first one primary
    if (images[idx].is_primary && next.length > 0) next[0].is_primary = true;
    onChange(reorder(next));
  }

  function setPrimary(idx: number) {
    onChange(
      images.map((img, i) => ({ ...img, is_primary: i === idx }))
    );
  }

  function reorder(arr: UIImage[]): UIImage[] {
    return arr.map((img, i) => ({ ...img, display_order: i }));
  }

  // Drag-to-reorder
  function onDragStart(idx: number) { setDragIdx(idx); }

  function onDragEnter(idx: number) {
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setDragIdx(idx);
    onChange(reorder(next));
  }

  function onDragEnd() { setDragIdx(null); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${dragOver ? "var(--ink)" : "var(--ink-soft)"}`,
          borderRadius: "4px",
          padding: "32px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "var(--bg-soft)" : "transparent",
          transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)" }}>
          {uploading ? "Uploading…" : "Drag & drop images here, or click to browse"}
        </div>
        <div style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "6px" }}>
          PNG, JPG, WEBP — multiple allowed
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {images.length} image{images.length !== 1 ? "s" : ""} — drag to reorder
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {images.map((img, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 12px",
                  background: dragIdx === idx ? "var(--bg-soft)" : "var(--bg-alt)",
                  border: "1px solid var(--line)",
                  cursor: "grab",
                  opacity: dragIdx === idx ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {/* Drag handle */}
                <div style={{ color: "var(--ink-mute)", fontSize: "14px", flexShrink: 0, cursor: "grab" }}>⠿</div>

                {/* Thumbnail */}
                <div style={{ width: "56px", height: "56px", position: "relative", flexShrink: 0, background: "var(--bg-soft)", overflow: "hidden" }}>
                  <Image src={img.url} alt="" fill style={{ objectFit: "cover" }} sizes="56px" />
                </div>

                {/* Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                    {img.file ? img.file.name : "Existing image"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "2px" }}>
                    {img.is_primary ? "✦ Primary image" : `Position ${idx + 1}`}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    title="Set as primary"
                    style={{
                      padding: "5px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: `1px solid ${img.is_primary ? "var(--ink)" : "var(--ink-soft)"}`,
                      background: img.is_primary ? "var(--ink)" : "transparent",
                      color: img.is_primary ? "var(--bg)" : "var(--ink-faded)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      borderRadius: "2px",
                    }}
                  >
                    ✦
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    title="Remove"
                    style={{
                      padding: "5px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid var(--ink-soft)",
                      background: "transparent",
                      color: "var(--ink-faded)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      borderRadius: "2px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
