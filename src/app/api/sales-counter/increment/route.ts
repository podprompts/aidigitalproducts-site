import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Called by Vercel Cron — secured by CRON_SECRET env var
export async function POST(req: Request) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all active Supabase products
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, purchases")
    .eq("is_active", true);

  if (error || !products || products.length === 0) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }

  // Pick 1–3 random products to increment
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 3) + 1;
  const toUpdate = shuffled.slice(0, count);

  const updates: { id: string; purchases: number }[] = [];

  for (const p of toUpdate) {
    const increment = Math.floor(Math.random() * 3) + 1;
    const newCount = (p.purchases ?? 0) + increment;

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ purchases: newCount })
      .eq("id", p.id);

    if (!updateError) {
      updates.push({ id: p.id, purchases: newCount });
    }
  }

  return NextResponse.json({
    ok: true,
    updated: updates.length,
    products: updates,
  });
}