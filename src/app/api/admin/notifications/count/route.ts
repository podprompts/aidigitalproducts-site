import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isOverdue } from "@/lib/support-constants";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const [pendingProducts, pendingWaitlist, draftPosts, openSupport] = await Promise.all([
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabaseAdmin.from("seller_waitlist").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabaseAdmin
      .from("support_requests")
      .select("status, first_response_at, created_at")
      .in("status", ["open", "escalated"]),
  ]);

  const overdueOrEscalated = (openSupport.data ?? []).filter(
    (r) => r.status === "escalated" || isOverdue(r as { status: string; first_response_at: string | null; created_at: string })
  ).length;

  const total =
    (pendingProducts.count ?? 0) +
    (pendingWaitlist.count ?? 0) +
    (draftPosts.count ?? 0) +
    overdueOrEscalated;

  return NextResponse.json({
    total,
    breakdown: {
      pendingProducts: pendingProducts.count ?? 0,
      pendingWaitlist: pendingWaitlist.count ?? 0,
      draftPosts: draftPosts.count ?? 0,
      supportNeedsAttention: overdueOrEscalated,
    },
  });
}