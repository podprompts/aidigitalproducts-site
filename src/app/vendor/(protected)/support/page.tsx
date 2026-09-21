import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import SupportThread, { type ThreadMessage } from "@/components/SupportThread";
import SupportReply from "./SupportReply";
import ApproveRefund from "./ApproveRefund";
import { REASON_LABELS, firstName, isOverdue } from "@/lib/support-constants";

export const dynamic = "force-dynamic";

export default async function VendorSupportPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Deliberately excludes buyer_email: sellers reply through the platform.
  const { data: requestsData } = await supabaseAdmin
    .from("support_requests")
    .select("id, order_id, product_id, buyer_name, reason, status, first_response_at, seller_refund_approved_at, created_at")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const requests = requestsData ?? [];

  const ids = requests.map((r) => r.id);
  const orderIds = [...new Set(requests.map((r) => r.order_id))];
  const productIds = [...new Set(requests.map((r) => r.product_id).filter(Boolean))] as string[];

  const { data: msgData } = ids.length
    ? await supabaseAdmin
        .from("support_messages")
        .select("id, request_id, author_role, body, created_at")
        .in("request_id", ids)
        .order("created_at", { ascending: true })
    : { data: [] };
  const { data: orderData } = orderIds.length
    ? await supabaseAdmin.from("orders").select("id, order_number").in("id", orderIds)
    : { data: [] };
  const { data: prodData } = productIds.length
    ? await supabaseAdmin.from("products").select("id, name").in("id", productIds)
    : { data: [] };

  const orderNo = new Map((orderData ?? []).map((o) => [o.id as string, o.order_number as string]));
  const prodName = new Map((prodData ?? []).map((p) => [p.id as string, p.name as string]));
  const byRequest = new Map<string, ThreadMessage[]>();
  for (const m of msgData ?? []) {
    const list = byRequest.get(m.request_id as string) ?? [];
    list.push(m as ThreadMessage);
    byRequest.set(m.request_id as string, list);
  }

  const awaiting = requests.filter(
    (r) => (r.status === "open" || r.status === "escalated") && !r.first_response_at
  ).length;

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", marginBottom: "8px" }}>
        Support.
      </h1>
      <p style={{ fontSize: "14px", color: "var(--ink-faded)", marginBottom: "28px", lineHeight: 1.6 }}>
        Buyer requests on your products. Our Buyer Protection Policy requires a response within 48 hours.
        {requests.length > 0 ? ` ${awaiting} awaiting your first reply.` : ""} Buyers&apos; email addresses stay private, so reply here.
      </p>

      {requests.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No support requests yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {requests.map((r) => {
            const overdue = isOverdue(r);
            const closed = r.status === "resolved" || r.status === "denied";
            return (
              <div key={r.id} style={{ border: "1px solid var(--line)", padding: "20px", opacity: closed ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {prodName.get(r.product_id) ?? "Product"} &middot; {orderNo.get(r.order_id) ?? ""}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", marginTop: "6px" }}>
                      {firstName(r.buyer_name)} &middot; {REASON_LABELS[r.reason] ?? r.reason}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    {overdue && (
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: "#c0392b", background: "#fdecea" }}>
                        Response overdue
                      </span>
                    )}
                    {r.status === "escalated" && (
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: "#8a6d1a", background: "#fff8e1" }}>
                        Escalated
                      </span>
                    )}
                    {r.seller_refund_approved_at && !closed && (
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: "#166534", background: "#eaf6ec" }}>
                        Refund approved
                      </span>
                    )}
                    {closed && (
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: "#555", background: "#eee" }}>
                        {r.status === "resolved" ? "Resolved" : "Closed"}
                      </span>
                    )}
                  </div>
                </div>
                <SupportThread
                  messages={byRequest.get(r.id) ?? []}
                  labels={{ buyer: firstName(r.buyer_name), seller: "You", admin: "AI Digital Products team" }}
                />
                {!closed && (
                  <>
                    <ApproveRefund requestId={r.id} approved={!!r.seller_refund_approved_at} />
                    <SupportReply requestId={r.id} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}