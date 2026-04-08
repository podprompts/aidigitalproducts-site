/**
 * Shared utility for reading active admin timer overrides from Supabase.
 * Used by both /api/timer and /api/checkout so override logic stays consistent.
 */
import { supabaseAdmin } from "@/lib/supabase/server";

export type OverrideType = "force_sale" | "force_regular";

/**
 * Returns the active admin override for a product+visitor, or null if none.
 *
 * Priority: ip-specific override > global override (ip_address IS NULL).
 * Expired overrides (expires_at < now) are ignored.
 * `reset_all` overrides are handled synchronously in the admin POST endpoint
 * and never appear here — by the time the timer API runs, timers are already cleared.
 */
export async function getActiveOverride(
  productId: string,
  ip: string
): Promise<OverrideType | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("timer_admin_overrides")
    .select("override_type, ip_address")
    .eq("product_id", productId)
    .in("override_type", ["force_sale", "force_regular"])
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[timer-overrides] fetch error:", error.message);
    return null; // fail open — don't break checkout on DB errors
  }

  if (!data || data.length === 0) return null;

  // Prefer a visitor-specific override over a global one
  const match =
    data.find((o) => o.ip_address === ip) ??
    data.find((o) => o.ip_address === null) ??
    null;

  return (match?.override_type as OverrideType) ?? null;
}
