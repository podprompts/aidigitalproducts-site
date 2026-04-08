import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const [products, orders, subscribers, contacts] = await Promise.all([
    supabaseAdmin.from("products").select("id, status"),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("contact_submissions").select("id", { count: "exact", head: true }),
  ]);

  const allProducts   = products.data ?? [];
  const active        = allProducts.filter((p) => p.status === "active" || !p.status).length;
  const comingSoon    = allProducts.filter((p) => p.status === "coming_soon").length;

  return NextResponse.json({
    totalProducts:    allProducts.length,
    activeProducts:   active,
    comingSoon:       comingSoon,
    totalOrders:      orders.count ?? 0,
    totalSubscribers: subscribers.count ?? 0,
    totalContacts:    contacts.count ?? 0,
  });
}
