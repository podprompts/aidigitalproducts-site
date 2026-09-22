import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import SupportThread, { type ThreadMessage } from "@/components/SupportThread";
import ReplyBox from "./ReplyBox";
import { firstName } from "@/lib/support-constants";

export const dynamic = "force-dynamic";

export default async function VendorMessagesPage() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Deliberately excludes buyer_email: sellers reply through the platform.
  const { data: requestsData } = await supabaseAdmin
    .from("seller_contact_requests")
    .select("id, buyer_name, created_at")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const requests = requestsData ?? [];

  const ids = requests.map((r) => r.id);
  const { data: msgData } = ids.length
    ? await supabaseAdmin
        .from("seller_contact_messages")
        .select("id, request_id, author_role, body, created_at")
        .in("request_id", ids)
        .order("created_at", { ascending: true })
    : { data: [] };

  const byRequest = new Map<string, ThreadMessage[]>();
  for (const m of msgData ?? []) {
    const list = byRequest.get(m.request_id as string) ?? [];
    list.push(m as ThreadMessage);
    byRequest.set(m.request_id as string, list);
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 className="display" style={{ fontSize: "32px", color: "var(--ink)", marginBottom: "8px" }}>
        Messages.
      </h1>
      <p style={{ fontSize: "14px", color: "var(--ink-faded)", marginBottom: "28px", lineHeight: 1.6 }}>
        Messages from buyers who contacted you from your storefront. Their email addresses stay private, so reply here.
      </p>

      {requests.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No messages yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {requests.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", marginBottom: "10px" }}>
                {firstName(r.buyer_name as string)}
              </div>
              <SupportThread
                messages={byRequest.get(r.id) ?? []}
                labels={{ buyer: firstName(r.buyer_name as string), seller: "You", admin: "AI Digital Products team" }}
              />
              <ReplyBox requestId={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}