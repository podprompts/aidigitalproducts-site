import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";
import SaleNotification from "@/emails/SaleNotification";
 
const resend = new Resend(process.env.RESEND_API_KEY);
 
export async function POST(req: NextRequest) {
  try {
    const { productId, productName, salePrice, wasPrice, expiresAt } =
      await req.json();
 
    if (!productId || !productName || !salePrice || !expiresAt) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
 
    // Fetch all subscribers for this product who haven't been notified yet
    const { data: signups, error: fetchError } = await supabaseAdmin
      .from("email_signups")
      .select("id, email")
      .eq("product_id", productId)
      .is("notified_at", null);
 
    if (fetchError) throw fetchError;
    if (!signups || signups.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }
 
    const productUrl = "https://aidigitalproducts.com/products";
 
    // Send emails in batches of 50 to stay within Resend rate limits
    const BATCH_SIZE = 50;
    let totalSent = 0;
 
    for (let i = 0; i < signups.length; i += BATCH_SIZE) {
      const batch = signups.slice(i, i + BATCH_SIZE);
 
      await Promise.allSettled(
        batch.map((signup) =>
          resend.emails.send({
            from: "AI Digital Products <deals@aidigitalproducts.com>",
            to: signup.email,
            subject: "🔥 Your deal is LIVE — 30 minutes only",
            react: SaleNotification({
              productName,
              productUrl,
              expiresAt,
              salePrice,
              wasPrice: wasPrice ?? "",
            }),
          })
        )
      );
 
      totalSent += batch.length;
    }
 
    // Stamp notified_at so we never double-send
    const ids = signups.map((s) => s.id);
    await supabaseAdmin
      .from("email_signups")
      .update({ notified_at: new Date().toISOString() })
      .in("id", ids);
 
    return NextResponse.json({ success: true, sent: totalSent });
  } catch (err) {
    console.error("[send-sale-notification]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}