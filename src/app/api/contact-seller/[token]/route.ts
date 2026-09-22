import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MAX_MESSAGE, UUID_RE, firstName } from "@/lib/support-constants";
import { contactRequestUrl, getVendorEmail, safeSend, siteUrl } from "@/lib/contact-seller";

type Props = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const { token } = await params;
  if (!UUID_RE.test(token)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE} characters or fewer.` }, { status: 400 });
  }

  const { data: request } = await supabaseAdmin
    .from("seller_contact_requests")
    .select("id, vendor_id, buyer_name, access_token")
    .eq("access_token", token)
    .single();
  if (!request) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("seller_contact_messages")
    .insert({ request_id: request.id, author_role: "buyer", body: message });
  if (error) {
    console.error("[contact-seller/token] insert failed", error);
    return NextResponse.json({ error: "Could not send. Please try again." }, { status: 500 });
  }

  await supabaseAdmin
    .from("seller_contact_requests")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", request.id);

  const vendorEmail = await getVendorEmail(request.vendor_id as string);
  if (vendorEmail) {
    await safeSend({
      toEmail: vendorEmail,
      subject: `${firstName(request.buyer_name as string)} sent a follow-up message`,
      label: "New Message",
      heading: "You have a new message.",
      paragraphs: [`${firstName(request.buyer_name as string)} added to their message to you.`],
      quote: message,
      ctaLabel: "Open Messages",
      ctaUrl: `${siteUrl()}/vendor/messages`,
    });
  }

  return NextResponse.json({ ok: true });
}