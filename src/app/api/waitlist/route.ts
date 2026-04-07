import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, business_name, product_types, message } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("seller_waitlist").insert({
      email: email.trim().toLowerCase(),
      name: name?.trim() ?? null,
      business_name: business_name?.trim() ?? null,
      product_types: product_types ?? [],
      message: message?.trim() ?? null,
    });

    if (error) {
      // Unique constraint means they're already on the list
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You're already on the waitlist." },
          { status: 409 }
        );
      }
      console.error("[waitlist] insert error", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[waitlist] unexpected error", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
