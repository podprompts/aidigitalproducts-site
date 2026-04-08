import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { productId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { productId } = body;
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc("increment_views", {
    product_id: productId,
  });

  if (error) {
    console.error("[track-view]", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
