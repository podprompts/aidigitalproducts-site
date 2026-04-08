import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOverride } from "@/lib/timer-overrides";

const SALE_MINUTES = 30;
const REGULAR_HOURS = 24;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function createNewTimer(ip: string, productId: string) {
  const now = Date.now();
  const expiresAt = new Date(now + SALE_MINUTES * 60 * 1000).toISOString();
  const startedAt = new Date(now).toISOString();

  const { error } = await supabaseAdmin.from("visitor_timers").insert({
    ip_address: ip,
    product_id: productId,
    started_at: startedAt,
    expires_at: expiresAt,
  });

  // Concurrent insert race — fetch the winner
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
    return { saleActive: true, secondsRemaining, expiresAt: raceExpiry };
  }

  return { saleActive: true, secondsRemaining: SALE_MINUTES * 60, expiresAt };
}

async function getOrCreateTimer(ip: string, productId: string) {
  const now = Date.now();

  // ── Admin overrides take priority over visitor timer state ─────────────────
  const override = await getActiveOverride(productId, ip);

  if (override === "force_sale") {
    // Return a synthetic 30-min sale window without touching visitor_timers
    const expiresAt = new Date(now + SALE_MINUTES * 60 * 1000).toISOString();
    return { saleActive: true, secondsRemaining: SALE_MINUTES * 60, expiresAt, adminOverride: true };
  }

  if (override === "force_regular") {
    return { saleActive: false, secondsRemaining: 0, expiresAt: null, adminOverride: true };
  }

  // ── Normal 3-phase timer logic ─────────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from("visitor_timers")
    .select("expires_at")
    .eq("ip_address", ip)
    .eq("product_id", productId)
    .maybeSingle();

  // No record → brand new visitor → start sale phase
  if (!existing) {
    return createNewTimer(ip, productId);
  }

  const expiresAt = existing.expires_at as string;
  const expiryMs = new Date(expiresAt).getTime();
  const resetMs = expiryMs + REGULAR_HOURS * 60 * 60 * 1000;

  // Phase 1 — sale window still active
  if (now < expiryMs) {
    const secondsRemaining = Math.floor((expiryMs - now) / 1000);
    return { saleActive: true, secondsRemaining, expiresAt };
  }

  // Phase 3 — past the 24-hr regular window → delete and start fresh
  if (now >= resetMs) {
    await supabaseAdmin
      .from("visitor_timers")
      .delete()
      .eq("ip_address", ip)
      .eq("product_id", productId);

    return createNewTimer(ip, productId);
  }

  // Phase 2 — in the 24-hr regular window (timer expired, no reset yet)
  return { saleActive: false, secondsRemaining: 0, expiresAt: null };
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
