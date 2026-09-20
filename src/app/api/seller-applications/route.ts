import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const MIN_MESSAGE_LENGTH = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, business_name, portfolio_url, product_types, message } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Please write at least ${MIN_MESSAGE_LENGTH} characters describing yourself and what you plan to sell` },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("seller_waitlist").insert({
      email: email.trim().toLowerCase(),
      name: name?.trim() ?? null,
      business_name: business_name?.trim() ?? null,
      portfolio_url: portfolio_url?.trim() || null,
      product_types: product_types ?? [],
      message: message.trim(),
    });

    if (error) {
      // Unique constraint means they're already on the list
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You've already applied with this email." },
          { status: 409 }
        );
      }
      console.error("[seller-applications] insert error", error);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[seller-applications] unexpected error", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}