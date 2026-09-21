import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  ESCALATION_REASONS, GENERAL_REASONS, MAX_MESSAGE, REASON_LABELS, firstName, hasKey,
} from "@/lib/support-constants";
import { adminAlertAddress, buyerRequestUrl, getVendorContact, safeSend, siteUrl } from "@/lib/support";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_RE = /^ADP-\d{3,10}$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; orderNumber?: string; name?: string; reason?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const orderNumber = String(body.orderNumber ?? "").trim().toUpperCase();
  const name = String(body.name ?? "").trim().slice(0, 80);
  const reason = String(body.reason ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (!ORDER_RE.test(orderNumber)) {
    return NextResponse.json({ error: "Enter your order number, for example ADP-00019." }, { status: 400 });
  }
  if (!hasKey(GENERAL_REASONS, reason) && !hasKey(ESCALATION_REASONS, reason)) {
    return NextResponse.json({ error: "Please choose a reason." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Please describe the problem (at least a sentence)." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE} characters or fewer.` }, { status: 400 });
  }

  // Same answer whether or not the order matches, so order numbers can't be probed.
  const OK = NextResponse.json({ ok: true });

  // Light rate limit per email
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("support_requests")
    .select("id", { count: "exact", head: true })
    .eq("buyer_email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) return OK;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, email, status, vendor_id, metadata")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (
    !order ||
    String(order.email ?? "").toLowerCase() !== email ||
    order.status === "refunded" ||
    order.status === "chargeback"
  ) {
    return OK;
  }

  const productId = (order.metadata as { product_id?: string } | null)?.product_id ?? null;
  let productName = "the product";
  let productVendorId: string | null = null;
  if (productId) {
    const { data: p } = await supabaseAdmin.from("products").select("name, vendor_id").eq("id", productId).single();
    if (p?.name) productName = p.name as string;
    productVendorId = (p?.vendor_id as string | null) ?? null;
  }
  const vendorId: string | null = (order.vendor_id as string | null) ?? productVendorId;

  // Already an open request for this order? Re-send the link instead of duplicating.
  const { data: existing } = await supabaseAdmin
    .from("support_requests")
    .select("access_token")
    .eq("order_id", order.id)
    .in("status", ["open", "escalated"])
    .limit(1)
    .maybeSingle();
  if (existing) {
    await safeSend({
      toEmail: email,
      subject: `Your support request for order ${orderNumber}`,
      label: "Support Request",
      heading: "Here is your open request.",
      paragraphs: [
        `You already have an open support request for order ${orderNumber}. Use the link below to see replies or add details.`,
      ],
      ctaLabel: "View your request",
      ctaUrl: buyerRequestUrl(existing.access_token as string),
    });
    return OK;
  }

  const escalated = hasKey(ESCALATION_REASONS, reason) || !vendorId;
  const nowIso = new Date().toISOString();

  const { data: created, error } = await supabaseAdmin
    .from("support_requests")
    .insert({
      order_id: order.id,
      product_id: productId,
      vendor_id: vendorId,
      buyer_email: email,
      buyer_name: name,
      reason,
      status: escalated ? "escalated" : "open",
      escalated_at: escalated ? nowIso : null,
      escalation_reason: escalated ? (hasKey(ESCALATION_REASONS, reason) ? reason : "no_vendor") : null,
    })
    .select("id, access_token")
    .single();

  if (error || !created) {
    console.error("[support/request] insert failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const { error: msgError } = await supabaseAdmin
    .from("support_messages")
    .insert({ request_id: created.id, author_role: "buyer", body: message });
  if (msgError) console.error("[support/request] message insert failed", msgError);

  const reasonLabel = REASON_LABELS[reason] ?? reason;

  await safeSend({
    toEmail: email,
    subject: `We received your request about ${productName}`,
    label: "Support Request",
    heading: "We received your request.",
    paragraphs: [
      `Hi ${firstName(name)}, thanks for reaching out about ${productName} (order ${orderNumber}).`,
      escalated
        ? "Your request has been sent to our team for review."
        : "It has been sent to the creator, who is required to respond within 48 hours. If they do not, you can ask us to step in from the same page.",
      "Use the link below to see replies and add details. Keep this link private: anyone who has it can view this request.",
    ],
    quote: message,
    ctaLabel: "View your request",
    ctaUrl: buyerRequestUrl(created.access_token as string),
  });

  const vendor = await getVendorContact(vendorId);
  if (vendor) {
    await safeSend({
      toEmail: vendor.email,
      subject: `Support request: ${productName} (${orderNumber})`,
      label: "New Support Request",
      heading: "A buyer needs help with an order.",
      paragraphs: [
        `${firstName(name)} opened a support request about ${productName} (order ${orderNumber}).`,
        `Reason: ${reasonLabel}.`,
        "Our Buyer Protection Policy requires creators to respond within 48 hours. Reply from your Support page in the vendor portal.",
        escalated ? "The buyer has also asked our team to review this request." : "",
      ].filter(Boolean),
      quote: message,
      ctaLabel: "Open Support",
      ctaUrl: `${siteUrl()}/vendor/support`,
    });
  }

  if (escalated) {
    await safeSend({
      toEmail: adminAlertAddress(),
      subject: `[Escalated] ${productName} (${orderNumber})`,
      label: "Escalated Request",
      heading: "A support request needs review.",
      paragraphs: [
        `Order ${orderNumber}, ${productName}. Reason: ${reasonLabel}.`,
        vendorId ? "" : "This product has no creator, so it came straight to you.",
      ].filter(Boolean),
      quote: message,
      ctaLabel: "Open Support Requests",
      ctaUrl: `${siteUrl()}/admin/support`,
    });
  }

  return OK;
}