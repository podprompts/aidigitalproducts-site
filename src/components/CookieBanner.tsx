"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acked = localStorage.getItem("cookies-acknowledged");
    if (!acked) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem("cookies-acknowledged", "true");
    setVisible(false);
  };

  return (
    <div className="cookie-banner">
      <p
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--ink-faded)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        We use cookies for analytics. By continuing, you agree to our{" "}
        <Link
          href="/privacy"
          style={{
            color: "var(--ink)",
            fontWeight: 600,
            textDecoration: "none",
            borderBottom: "1px solid var(--ink-soft)",
          }}
        >
          privacy policy
        </Link>
        .
      </p>
      <button
        onClick={dismiss}
        className="btn btn-primary"
        style={{ marginTop: "16px", padding: "8px 18px", fontSize: "12px" }}
      >
        Got it
      </button>
    </div>
  );
}
