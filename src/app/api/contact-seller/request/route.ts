import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MAX_MESSAGE } from "@/lib/support-constants";
import { contactRequestUrl, firstNameOf, getVendorEmail, safeSend, siteUrl } from "@/lib/contact-seller";
import { getActiveVendor } from "@/lib/vendor";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { vendorId?: string; name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const vendorId = String(body.vendorId ?? "").trim();
  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim();

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (message.length < 10) {
    return NextResponse.json({ error: "Please write a message (at least a sentence)." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE} characters or fewer.` }, { status: 400 });
  }

  const vendor = await getActiveVendor(vendorId);
  if (!vendor) return NextResponse.json({ error: "Seller not found." }, { status: 404 });

  // Light rate limit per email, same threshold as buyer support requests.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("seller_contact_requests")
    .select("id", { count: "exact", head: true })
    .eq("buyer_email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "Too many requests. Please try again tomorrow." }, { status: 429 });
  }

  const { data: created, error } = await supabaseAdmin
    .from("seller_contact_requests")
    .insert({ vendor_id: vendorId, buyer_email: email, buyer_name: name })
    .select("id, access_token")
    .single();

  if (error || !created) {
    console.error("[contact-seller/request] insert failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const { error: msgError } = await supabaseAdmin
    .from("seller_contact_messages")
    .insert({ request_id: created.id, author_role: "buyer", body: message });
  if (msgError) console.error("[contact-seller/request] message insert failed", msgError);

  await safeSend({
    toEmail: email,
    subject: `Your message to ${vendor.display_name}`,
    label: "Message Sent",
    heading: "We sent your message.",
    paragraphs: [
      `Hi ${firstNameOf(name)}, your message to ${vendor.display_name} has been sent. They will reply through the platform, and we will email you when they do.`,
      "Use the link below to see replies or add more details. Keep this link private: anyone who has it can view this conversation.",
    ],
    quote: message,
    ctaLabel: "View your message",
    ctaUrl: contactRequestUrl(created.access_token as string),
  });

  const vendorEmail = await getVendorEmail(vendorId);
  if (vendorEmail) {
    await safeSend({
      toEmail: vendorEmail,
      subject: `New message from ${firstNameOf(name)}`,
      label: "New Message",
      heading: "You have a new message.",
      paragraphs: [
        `${firstNameOf(name)} sent you a message through your storefront.`,
        "Reply from your Messages page in the vendor portal. The buyer's email address stays private.",
      ],
      quote: message,
      ctaLabel: "Open Messages",
      ctaUrl: `${siteUrl()}/vendor/messages`,
    });
  }

  return NextResponse.json({ ok: true });
}