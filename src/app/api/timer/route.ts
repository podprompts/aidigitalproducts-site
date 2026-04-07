import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const TIMER_MINUTES = 30;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function getOrCreateTimer(ip: string, productId: string) {
  const now = Date.now();

  // Check for existing timer
  const { data: existing } = await supabaseAdmin
    .from("visitor_timers")
    .select("expires_at")
    .eq("ip_address", ip)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const expiresAt = existing.expires_at as string;
    const secondsRemaining = Math.max(
      0,
      Math.floor((new Date(expiresAt).getTime() - now) / 1000)
    );
    return { secondsRemaining, expiresAt, saleActive: secondsRemaining > 0 };
  }

  // Create new timer
  const expiresAt = new Date(now + TIMER_MINUTES * 60 * 1000).toISOString();
  const startedAt = new Date(now).toISOString();

  const { error } = await supabaseAdmin.from("visitor_timers").insert({
    ip_address: ip,
    product_id: productId,
    started_at: startedAt,
    expires_at: expiresAt,
  });

  // If a concurrent request already inserted, fetch the one that won
  if (error?.code === "23505") {
    const { data: race } = await supabaseAdmin
      .from("visitor_timers")
      .select("expires_at")
      .eq("ip_address", ip)
      .eq("product_id", productId)
      .maybeSingle();

    const raceExpiry = (race?.expires_at as string) ?? expiresAt;
    const secondsRemaining = Math.max(
      0,
      Math.floor((new Date(raceExpiry).getTime() - now) / 1000)
    );
    return { secondsRemaining, expiresAt: raceExpiry, saleActive: secondsRemaining > 0 };
  }

  return { secondsRemaining: TIMER_MINUTES * 60, expiresAt, saleActive: true };
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const ip = getIp(req);
  const result = await getOrCreateTimer(ip, productId);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    const ip = getIp(req);
    const result = await getOrCreateTimer(ip, productId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
