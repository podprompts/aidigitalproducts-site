import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SupportThread from "@/components/SupportThread";
import ThreadActions from "./ThreadActions";
import { supabaseAdmin } from "@/lib/supabase/server";
import { REASON_LABELS, UUID_RE, isOverdue } from "@/lib/support-constants";
import { getRequestContext } from "@/lib/support";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your support request | AI Digital Products",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ token: string }> };

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Waiting on the creator", color: "#8a6d1a", bg: "#fff8e1" },
  escalated: { label: "With our team", color: "#c0392b", bg: "#fdecea" },
  resolved: { label: "Resolved", color: "#166534", bg: "#eaf6ec" },
  denied: { label: "Closed", color: "#555555", bg: "#eeeeee" },
};

export default async function SupportRequestPage({ params }: Props) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const { data: request } = await supabaseAdmin
    .from("support_requests")
    .select("*")
    .eq("access_token", token)
    .single();
  if (!request) notFound();

  const { data: messages } = await supabaseAdmin
    .from("support_messages")
    .select("id, author_role, body, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  const ctx = await getRequestContext(request.order_id, request.product_id);

  let sellerName = "The creator";
  if (request.vendor_id) {
    const { data: v } = await supabaseAdmin
      .from("vendor_profiles")
      .select("display_name")
      .eq("id", request.vendor_id)
      .single();
    if (v?.display_name) sellerName = v.display_name as string;
  }

  const status = STATUS[request.status] ?? STATUS.open;
  const overdue = isOverdue(request);
  const closed = request.status === "resolved" || request.status === "denied";

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="block" style={{ paddingTop: "48px" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "16px" }}>
              &mdash; Support Request &mdash;
            </div>
            <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.02, color: "var(--ink)", marginBottom: "16px" }}>
              {ctx.productName}
            </h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", color: status.color, background: status.bg }}>
                {status.label}
              </span>
              <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>
                Order {ctx.orderNumber} &middot; {REASON_LABELS[request.reason] ?? request.reason}
              </span>
            </div>
            {request.status === "open" && !overdue && (
              <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", lineHeight: 1.6 }}>
                The creator is required to respond within 48 hours of your request.
              </p>
            )}
            {overdue && (
              <p style={{ fontSize: "13px", color: "#c0392b", fontWeight: 600, marginBottom: "24px", lineHeight: 1.6 }}>
                The creator has not responded within 48 hours. You can ask our team to step in below.
              </p>
            )}

            <div style={{ margin: "24px 0 32px" }}>
              <SupportThread
                messages={messages ?? []}
                labels={{ buyer: "You", seller: sellerName, admin: "AI Digital Products team" }}
              />
            </div>

            {closed ? (
              <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>
                This request is closed. Need more help? Start a new one from the{" "}
                <a href="/support/order" style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "underline" }}>support form</a>.
              </p>
            ) : (
              <ThreadActions token={token} status={request.status} overdue={overdue} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}