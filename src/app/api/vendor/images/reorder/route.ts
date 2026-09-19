import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { images?: { id: string; display_order: number; is_primary: boolean }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const images = body.images ?? [];
  if (images.length === 0) return NextResponse.json({ ok: true });

  // Verify every image belongs to a product owned by this vendor before
  // touching any of them. Deliberately using two plain queries instead of
  // a PostgREST nested-relationship embed, to avoid depending on an
  // unverified auto-detected FK relationship.
  const ids = images.map((i) => i.id);
  const { data: rows } = await supabaseAdmin
    .from("product_images")
    .select("id, product_id")
    .in("id", ids);

  if (!rows || rows.length !== ids.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const productIds = [...new Set(rows.map((r) => r.product_id))];
  const { data: ownedProducts } = await supabaseAdmin
    .from("products")
    .select("id")
    .in("id", productIds)
    .eq("vendor_id", user.id);

  const ownedIds = new Set((ownedProducts ?? []).map((p) => p.id));
  const allOwned = productIds.every((pid) => ownedIds.has(pid));
  if (!allOwned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  for (const img of images) {
    await supabaseAdmin
      .from("product_images")
      .update({ display_order: img.display_order, is_primary: img.is_primary })
      .eq("id", img.id);
  }

  return NextResponse.json({ ok: true });
}