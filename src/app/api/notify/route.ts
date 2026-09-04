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
        deals_list: true,
        notified_at: null,
      },
      { onConflict: "email,product_id" }
    );

    if (error) throw error;

    // Site-launch signups get an immediate confirmation email via Resend,
    // on top of the normal notified_at flow. Best-effort — a failed send
    // shouldn't fail the signup itself.
    if (productId === "site-launch" && process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            // TODO: replace with your verified Resend sending domain/address.
            from: "AI Digital Products <hello@aidigitalproducts.com>",
            to: email.toLowerCase().trim(),
            subject: "You're on the list",
            html: `<p>Thanks for signing up — we'll email you the moment AI Digital Products launches.</p>`,
          }),
        });
      } catch (err) {
        console.error("[notify] resend error", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}