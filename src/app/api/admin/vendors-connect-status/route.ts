import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: vendors, error } = await supabaseAdmin
    .from("vendor_profiles")
    .select("id, display_name, business_name, email, is_active, stripe_account_id, avatar_url");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (vendors ?? []).map(async (v) => {
      if (!v.stripe_account_id) {
        return { ...v, connected: false, chargesEnabled: false, payoutsEnabled: false };
      }
      try {
        const account = await stripe.accounts.retrieve(v.stripe_account_id);
        return {
          ...v,
          connected: true,
          chargesEnabled: !!account.charges_enabled,
          payoutsEnabled: !!account.payouts_enabled,
        };
      } catch (err) {
        console.error(`[admin/vendors-connect-status] Failed to retrieve ${v.stripe_account_id}`, err);
        return { ...v, connected: true, chargesEnabled: false, payoutsEnabled: false, retrieveFailed: true };
      }
    })
  );

  return NextResponse.json({ vendors: enriched });
}