// app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; source_page?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const source_page = (body.source_page ?? "").slice(0, 255) || "/";

  const { error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .insert({ email, source_page });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You're already subscribed!" }, { status: 409 });
    }
    console.error("[newsletter]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ message: "Subscribed!" }, { status: 201 });
}