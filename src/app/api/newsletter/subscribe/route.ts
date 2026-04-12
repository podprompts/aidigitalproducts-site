import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabaseAdmin
      .from("newsletter_signups")
      .upsert({ email: normalizedEmail }, { onConflict: "email" });

    if (error) {
      console.error("[newsletter] Supabase error:", error);
      return NextResponse.json({ error: "Failed to save. Try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[newsletter] Fatal error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}