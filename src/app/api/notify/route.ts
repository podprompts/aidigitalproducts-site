import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, productId } = await req.json();

    if (!email || !productId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("email_signups").upsert(
      {
        email: email.toLowerCase().trim(),
        product_id: productId,
        deals_list: true, // pre-checked consent to future deal emails
      },
      { onConflict: "email,product_id", ignoreDuplicates: true }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}