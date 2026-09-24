import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isOverdue } from "@/lib/support-constants";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [outcomeProducts, openSupport, contactThreads, ownProductIds] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", user.id)
      .or("review_status.eq.rejected,last_approved_changes.not.is.null"),
    supabaseAdmin
      .from("support_requests")
      .select("status, first_response_at, created_at")
      .eq("vendor_id", user.id)
      .in("status", ["open", "escalated"]),
    supabaseAdmin
      .from("seller_contact_requests")
      .select("id, seller_contact_messages(author_role, created_at)")
      .eq("vendor_id", user.id),
    supabaseAdmin.from("products").select("id").eq("vendor_id", user.id),
  ]);

  const needsFirstReplyOrOverdue = (openSupport.data ?? []).filter((r) =>
    isOverdue(r as { status: string; first_response_at: string | null; created_at: string })
  ).length;

  // A thread "needs a reply" if its most recent message was from the buyer.
  let threadsAwaitingReply = 0;
  for (const t of contactThreads.data ?? []) {
    const msgs = (t as { seller_contact_messages?: { author_role: string; created_at: string }[] }).seller_contact_messages ?? [];
    if (msgs.length === 0) continue;
    const latest = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (latest.author_role === "buyer") threadsAwaitingReply++;
  }

  const productIds = (ownProductIds.data ?? []).map((p) => p.id as string);
  let unrepliedReviews = 0;
  if (productIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("product_reviews")
      .select("id", { count: "exact", head: true })
      .in("product_id", productIds)
      .eq("is_hidden", false)
      .is("vendor_response", null);
    unrepliedReviews = count ?? 0;
  }

  const total = (outcomeProducts.count ?? 0) + needsFirstReplyOrOverdue + threadsAwaitingReply + unrepliedReviews;

  return NextResponse.json({
    total,
    breakdown: {
      productOutcomes: outcomeProducts.count ?? 0,
      supportNeedsAttention: needsFirstReplyOrOverdue,
      messagesAwaitingReply: threadsAwaitingReply,
      reviewsAwaitingReply: unrepliedReviews,
    },
  });
}