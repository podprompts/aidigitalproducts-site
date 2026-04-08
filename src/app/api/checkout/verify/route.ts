import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .single();

  if (!order) return NextResponse.json({ pending: true });

  const { data: tokenRow } = await supabaseAdmin
    .from("download_tokens")
    .select("token")
    .eq("order_id", order.id)
    .single();

  if (!tokenRow) return NextResponse.json({ pending: true });

  return NextResponse.json({ token: tokenRow.token });
}
