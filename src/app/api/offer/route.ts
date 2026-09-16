import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// This address is only ever read on the server. It is never sent to the
// browser in any response, so it can't be viewed in page source, dev tools,
// or network responses. Swap this for process.env.OFFER_NOTIFY_EMAIL if you
// prefer to keep it out of source control entirely.
const OFFER_NOTIFY_EMAIL = "adrien1@gmail.com";

// Reuse your existing Resend client/setup if you already have one
// (e.g. `import { resend } from "@/lib/resend"`) instead of instantiating
// a second one here.
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, amount, message, company, agree } = body ?? {};

    // Honeypot: bots fill hidden fields. Pretend success, send nothing.
    if (company) {
      return NextResponse.json({ ok: true });
    }

    // Basic validation
    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof amount !== "string" || !amount.trim() ||
      agree !== true && agree !== "on" && agree !== "true"
    ) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    // Very light rate-limit hook point: if you already have IP-based
    // throttling middleware elsewhere in the app, this route benefits
    // from it automatically since it's just another API route.

    const { data, error } = await resend.emails.send({
      from: "AiDigitalProducts.com <offers@aidigitalproducts.com>", // must be a verified sending domain in Resend
      to: OFFER_NOTIFY_EMAIL,
      replyTo: email,
      subject: `New domain offer: $${amount.trim()} — ${name.trim()}`,
      text: [
        `New offer submitted on AiDigitalProducts.com`,
        ``,
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Offer: $${amount.trim()}`,
        `Message: ${message?.trim() || "(none)"}`,
      ].join("\n"),
    });

    if (error) {
      // This is the case that was silently slipping through before:
      // Resend accepted the request but rejected the send itself
      // (most commonly an unverified sending domain).
      console.error("Resend rejected the send:", error);
      return NextResponse.json({ error: "Email send failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("Offer submission failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}