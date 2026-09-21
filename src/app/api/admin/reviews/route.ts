import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("product_reviews")
    .select("id, product_id, reviewer_name, rating, comment, vendor_response, vendor_response_at, is_hidden, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const reviews = data ?? [];
  const productIds = [...new Set(reviews.map((r) => r.product_id))];
  const nameMap = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name")
      .in("id", productIds);
    for (const p of products ?? []) nameMap.set(p.id as string, p.name as string);
  }

  return NextResponse.json({
    reviews: reviews.map((r) => ({ ...r, product_name: nameMap.get(r.product_id) ?? "Unknown product" })),
  });
}