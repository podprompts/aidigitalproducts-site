import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ connected: false, onboardingComplete: false });
  }

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);
  const onboardingComplete = !!account.charges_enabled && !!account.payouts_enabled;

  // Keep the cached display flag in sync with what Stripe actually reports
  await supabaseAdmin
    .from("vendor_profiles")
    .update({ stripe_onboarding_complete: onboardingComplete })
    .eq("id", user.id);

  return NextResponse.json({
    connected: true,
    onboardingComplete,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });
}