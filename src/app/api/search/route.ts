import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { mockProducts } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  // Split query into individual words (each at least 2 chars).
  // This lets "Outdoors Adventure" match products containing either word.
  const words = q.split(/\s+/).filter((w) => w.length >= 2);

  // Build a Supabase OR filter: every word is checked against name, description, and category.
  // ilike is case-insensitive by default.
  const conditions = words
    .flatMap((word) => [
      `name.ilike.%${word}%`,
      `description.ilike.%${word}%`,
      `category.ilike.%${word}%`,
    ])
    .join(",");

  // ── Supabase (live / purchasable products) ────────────────────────────────
  const { data: supabaseData, error } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, sale_price_cents")
    .eq("is_active", true)
    .or(conditions)
    .order("display_order", { ascending: true })
    .limit(6);

  if (error) {
    console.error("[search] supabase error:", error.message);
  }

  const supabaseResults = supabaseData ?? [];
  const supabaseSlugs = new Set(supabaseResults.map((r) => r.slug));

  // ── Mock data (coming-soon products not yet in Supabase) ──────────────────
  // Only include products whose slug isn't already in Supabase results to
  // avoid duplicates. Any word in the query matching title, category, or
  // description counts as a hit.
  const lowerWords = words.map((w) => w.toLowerCase());

  const mockResults = mockProducts
    .filter((p) => !supabaseSlugs.has(p.slug))
    .filter((p) =>
      lowerWords.some(
        (word) =>
          p.title.toLowerCase().includes(word) ||
          p.category.toLowerCase().includes(word) ||
          (p.description ?? "").toLowerCase().includes(word)
      )
    )
    .map((p) => ({
      id: p.id,
      name: p.title,
      slug: p.slug,
      category: p.category,
      sale_price_cents: Math.round(p.price * 100),
    }));

  // Live Supabase results first, then mock fill-ins — cap at 6 total.
  const combined = [...supabaseResults, ...mockResults].slice(0, 6);

  return NextResponse.json(combined);
}
