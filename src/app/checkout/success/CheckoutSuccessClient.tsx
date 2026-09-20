"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface DownloadFile {
  index: number;
  file_name: string;
  file_size: number | null;
  url: string;
}

interface DownloadManifest {
  files: DownloadFile[];
  expires_at: string;
  downloads_left: number;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId    = searchParams.get("session_id");
  const directToken  = searchParams.get("token"); // present when arriving from the email link

  const [manifest,  setManifest]  = useState<DownloadManifest | null>(null);
  const [polling,   setPolling]   = useState(!!sessionId || !!directToken);
  const [loadError, setLoadError] = useState<string | null>(null);
  const attempts = useRef(0);

  // Shared logic: given a resolved token, fetch the manifest (or detect a
  // direct binary stream for legacy single-file products) and update state.
  async function loadManifestForToken(token: string): Promise<boolean> {
    try {
      const manifestRes = await fetch(`/api/download/${token}`);
      const contentType = manifestRes.headers.get("content-type") ?? "";

      if (!manifestRes.ok) {
        // A real error (expired link, download limit reached, no files
        // configured for this product, etc.) — surface it plainly instead
        // of pretending a download exists.
        let message = "Something went wrong loading your download.";
        if (contentType.includes("application/json")) {
          const body = await manifestRes.json().catch(() => null);
          if (body?.error) message = body.error;
        }
        setLoadError(message);
        return true;
      }

      if (contentType.includes("application/json")) {
        const manifestData = await manifestRes.json();

        if (manifestData.files) {
          // Multi-file product: use the manifest as-is
          setManifest(manifestData);
        } else {
          // Successful JSON response but no files array — unexpected shape.
          // This should no longer be reachable now that error responses are
          // handled above, but fail safe rather than assume it's fine.
          setLoadError("Something went wrong loading your download.");
        }
      } else {
        // Binary response = legacy single-file product streaming directly.
        // Synthesize a 1-item manifest pointing back at the same token URL.
        setManifest({
          files: [{
            index:     0,
            file_name: "download.zip",
            file_size: null,
            url:       `/api/download/${token}`,
          }],
          expires_at:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          downloads_left: 5,
        });
      }
      return true;
    } catch {
      return false; // transient/network error — caller may retry
    }
  }

  // Path 1: arrived directly from the confirmation email (?token=...) —
  // no session to verify, just load the manifest once.
  useEffect(() => {
    if (!directToken || sessionId) return;
    loadManifestForToken(directToken).finally(() => setPolling(false));
  }, [directToken, sessionId]);

  // Path 2: arrived from Stripe's redirect (?session_id=...) — poll
  // /api/checkout/verify until the webhook has created the token, then load it.
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      attempts.current += 1;
      try {
        const res  = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        const data = await res.json();

        if (data.token) {
          const done = await loadManifestForToken(data.token);
          if (done) {
            setPolling(false);
            clearInterval(interval);
          }
        }
      } catch {
        // ignore transient errors, keep polling
      }

      if (attempts.current >= 15) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const expiryLabel = manifest
    ? new Date(manifest.expires_at).toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric",
      })
    : null;

  const showDownloadArea = !!sessionId || !!directToken;

  return (
    <main style={{ paddingTop: "100px" }}>
      <section className="page-hero">
        <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>

          {/* Header */}
          <div style={{
            fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)",
            textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "24px",
          }}>
            — Order Confirmed —
          </div>

          <h1 className="display" style={{
            fontSize: "clamp(40px, 6vw, 80px)",
            lineHeight: 0.94,
            color: "var(--ink)",
          }}>
            You&apos;re all set.
          </h1>

          <p style={{
            marginTop: "28px",
            fontSize: "clamp(15px, 1.4vw, 17px)",
            fontWeight: 500,
            color: "var(--ink-faded)",
            lineHeight: 1.6,
          }}>
            Your purchase is confirmed. Download your files below, or check your
            inbox — links are on their way too.
          </p>

          {/* Download area */}
          {showDownloadArea && (
            <div style={{
              marginTop: "40px",
              padding: "28px 32px",
              border: "1px solid var(--line)",
              background: "var(--bg-alt)",
              display: "block",
              width: "100%",
              maxWidth: "480px",
              margin: "40px auto 0",
              textAlign: "left",
              boxSizing: "border-box",
            }}>
              {loadError ? (
                <>
                  <div style={{ fontSize: "13px", color: "#c0392b", fontWeight: 600 }}>
                    {loadError}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--ink-mute)" }}>
                    Check your confirmation email for your download link, or contact
                    support if this keeps happening.
                  </div>
                </>
              ) : manifest ? (
                <>
                  <div style={{
                    fontSize: "12px", color: "var(--ink-faded)", marginBottom: "20px",
                    fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    Your Downloads ({manifest.files.length} {manifest.files.length === 1 ? "file" : "files"})
                  </div>

                  {/* File list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {manifest.files.map((file) => (
                      <a
                        key={file.index}
                        href={file.url}
                        className="btn btn-primary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          textDecoration: "none",
                        }}
                      >
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          ↓ {file.file_name}
                        </span>
                        {file.file_size && (
                          <span style={{ fontSize: "11px", opacity: 0.7, flexShrink: 0 }}>
                            {formatBytes(file.file_size)}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>

                  {/* Meta */}
                  <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--ink-mute)" }}>
                    Links valid until {expiryLabel} · {manifest.downloads_left} downloads remaining
                  </p>
                </>
              ) : polling ? (
                <>
                  <div style={{ fontSize: "13px", color: "var(--ink-faded)", fontWeight: 500 }}>
                    Preparing your downloads…
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--ink-mute)" }}>
                    This usually takes just a moment.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "13px", color: "var(--ink-faded)", fontWeight: 500 }}>
                    Check your email for your download links.
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--ink-mute)" }}>
                    If it doesn&apos;t arrive, check your spam folder or contact support.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ marginTop: "44px", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/products" className="btn btn-primary">
              Browse More Products
            </Link>
            <Link href="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}

export default function CheckoutSuccessClient() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
