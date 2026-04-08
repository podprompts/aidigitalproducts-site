import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, sale_price_cents")
    .eq("is_active", true)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
    .order("display_order", { ascending: true })
    .limit(6);

  if (error) {
    console.error("[search]", error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
