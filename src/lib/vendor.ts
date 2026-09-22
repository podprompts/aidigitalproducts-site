import { supabaseAdmin } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/support-constants";

export interface VendorProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
}

// Shared by the public storefront and reviews pages: rejects malformed IDs
// before querying (Postgres throws on non-UUID input) and only returns
// active vendors. Deliberately never selects email — that stays server-only
// via getVendorEmail in src/lib/contact-seller.ts.
export async function getActiveVendor(vendorId: string): Promise<VendorProfile | null> {
  if (!UUID_RE.test(vendorId)) return null;
  const { data } = await supabaseAdmin
    .from("vendor_profiles")
    .select("id, display_name, avatar_url, is_active")
    .eq("id", vendorId)
    .single();
  if (!data || !data.is_active) return null;
  return data as VendorProfile;
}

export interface RatedProduct {
  rating: number | null;
  review_count: number | null;
}

// Review-count-weighted average across a vendor's products, so a product
// with 50 reviews counts more than one with 1. Returns null if the vendor
// has no reviews anywhere yet.
export function weightedVendorRating(products: RatedProduct[]): { avg: number; count: number } | null {
  let ratingSum = 0;
  let countSum = 0;
  for (const p of products) {
    const c = p.review_count ?? 0;
    if (c > 0 && p.rating != null) {
      ratingSum += p.rating * c;
      countSum += c;
    }
  }
  if (countSum === 0) return null;
  return { avg: ratingSum / countSum, count: countSum };
}