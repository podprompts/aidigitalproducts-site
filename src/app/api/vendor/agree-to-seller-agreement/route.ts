import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // .is(...) guards against a replayed request silently overwriting an
  // already-recorded acceptance date. If zero rows match, the vendor had
  // already agreed before this call - that is not a failure, just a no-op.
  const { data: updated, error } = await supabaseAdmin
    .from("vendor_profiles")
    .update({ agreed_to_seller_agreement_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("agreed_to_seller_agreement_at", null)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, alreadyAgreed: !updated || updated.length === 0 });
}
