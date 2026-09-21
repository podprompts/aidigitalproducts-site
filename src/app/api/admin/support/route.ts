import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isOverdue } from "@/lib/support-constants";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: requests, error } = await supabaseAdmin
    .from("support_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = requests ?? [];
  const ids = rows.map((r) => r.id);
  const orderIds = [...new Set(rows.map((r) => r.order_id))];
  const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))] as string[];
  const vendorIds = [...new Set(rows.map((r) => r.vendor_id).filter(Boolean))] as string[];

  const { data: msgs } = ids.length
    ? await supabaseAdmin.from("support_messages").select("id, request_id, author_role, body, created_at").in("request_id", ids).order("created_at", { ascending: true })
    : { data: [] };
  const { data: orders } = orderIds.length
    ? await supabaseAdmin.from("orders").select("id, order_number").in("id", orderIds)
    : { data: [] };
  const { data: products } = productIds.length
    ? await supabaseAdmin.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const { data: vendors } = vendorIds.length
    ? await supabaseAdmin.from("vendor_profiles").select("id, display_name").in("id", vendorIds)
    : { data: [] };

  const orderNo = new Map((orders ?? []).map((o) => [o.id as string, o.order_number as string]));
  const prodName = new Map((products ?? []).map((p) => [p.id as string, p.name as string]));
  const vendName = new Map((vendors ?? []).map((v) => [v.id as string, v.display_name as string]));
  const byRequest = new Map<string, unknown[]>();
  for (const m of msgs ?? []) {
    const list = byRequest.get(m.request_id as string) ?? [];
    list.push(m);
    byRequest.set(m.request_id as string, list);
  }

  return NextResponse.json({
    requests: rows.map((r) => ({
      ...r,
      overdue: isOverdue(r),
      order_number: orderNo.get(r.order_id) ?? "",
      product_name: prodName.get(r.product_id) ?? "Unknown product",
      vendor_name: r.vendor_id ? vendName.get(r.vendor_id) ?? "Unknown seller" : "Platform (no creator)",
      messages: byRequest.get(r.id) ?? [],
    })),
  });
}