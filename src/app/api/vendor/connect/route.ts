import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("stripe_account_id, email, business_name")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  let accountId = profile.stripe_account_id as string | null;

  // Create the Connect account only if this vendor doesn't already have one
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: profile.email ?? user.email ?? undefined,
      business_profile: profile.business_name ? { name: profile.business_name } : undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await supabaseAdmin
      .from("vendor_profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Account Links are single-use and short-lived — generate a fresh one
  // every time, whether this is a first-time setup or resuming an
  // incomplete onboarding.
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/vendor/connect?refresh=true`,
    return_url: `${appUrl}/vendor/connect?complete=true`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}