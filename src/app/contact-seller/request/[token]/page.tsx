import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SupportThread from "@/components/SupportThread";
import ReplyForm from "./ReplyForm";
import { supabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/support-constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your message | AI Digital Products",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ token: string }> };

export default async function ContactSellerThreadPage({ params }: Props) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const { data: request } = await supabaseAdmin
    .from("seller_contact_requests")
    .select("id, vendor_id, buyer_name, created_at")
    .eq("access_token", token)
    .single();
  if (!request) notFound();

  const { data: messages } = await supabaseAdmin
    .from("seller_contact_messages")
    .select("id, author_role, body, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  let sellerName = "The seller";
  if (request.vendor_id) {
    const { data: v } = await supabaseAdmin
      .from("vendor_profiles")
      .select("display_name")
      .eq("id", request.vendor_id)
      .single();
    if (v?.display_name) sellerName = v.display_name as string;
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="block" style={{ paddingTop: "48px" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "16px" }}>
              &mdash; Your Message &mdash;
            </div>
            <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.02, color: "var(--ink)", marginBottom: "24px" }}>
              Conversation with {sellerName}.
            </h1>

            <div style={{ margin: "24px 0 32px" }}>
              <SupportThread
                messages={messages ?? []}
                labels={{ buyer: "You", seller: sellerName, admin: "AI Digital Products team" }}
              />
            </div>

            <ReplyForm token={token} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}