import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name    = (body.name    ?? "").trim();
  const email   = (body.email   ?? "").trim().toLowerCase();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name)                      return NextResponse.json({ error: "Name is required."            }, { status: 400 });
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (!subject)                   return NextResponse.json({ error: "Subject is required."         }, { status: 400 });
  if (!message)                   return NextResponse.json({ error: "Message is required."         }, { status: 400 });

  const { error } = await supabaseAdmin.from("contact_submissions").insert({
    name,
    email,
    subject,
    message,
  });

  if (error) {
    console.error("[contact]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ message: "Sent!" }, { status: 201 });
}
