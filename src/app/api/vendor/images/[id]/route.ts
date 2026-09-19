import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const { data: imageRow } = await supabaseAdmin
    .from("product_images")
    .select("id, product_id")
    .eq("id", id)
    .single();
  if (!imageRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: owned } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", imageRow.product_id)
    .eq("vendor_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("product_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}