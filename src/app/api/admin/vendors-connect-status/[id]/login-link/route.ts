import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const { data: vendor } = await supabaseAdmin
    .from("vendor_profiles")
    .select("stripe_account_id")
    .eq("id", id)
    .single();

  if (!vendor?.stripe_account_id) {
    return NextResponse.json({ error: "This vendor hasn't connected a Stripe account" }, { status: 400 });
  }

  try {
    // Single-use, short-lived — generated fresh on every click, never cached.
    const loginLink = await stripe.accounts.createLoginLink(vendor.stripe_account_id);
    return NextResponse.json({ url: loginLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create login link" },
      { status: 502 }
    );
  }
}