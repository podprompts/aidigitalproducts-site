"use client";

import { useState, useTransition } from "react";
import { approveRefundAction } from "./actions";

export default function ApproveRefund({ requestId, approved }: { requestId: string; approved: boolean }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (approved) {
    return (
      <p style={{ marginTop: "14px", fontSize: "12px", color: "#166534", fontWeight: 600 }}>
        You approved a refund for this order. Our team will process it.
      </p>
    );
  }

  function approve() {
    const ok = window.confirm(
      "Approve a refund for this buyer?\n\nThis tells AI Digital Products you agree the buyer should be refunded. Our team issues the refund, and a refund reverses your payout for this order. This cannot be undone."
    );
    if (!ok) return;
    setError("");
    startTransition(async () => {
      const res = await approveRefundAction(requestId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div style={{ marginTop: "14px" }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={approve} disabled={pending}>
        {pending ? "Approving..." : "Approve refund"}
      </button>
      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
    </div>
  );
}