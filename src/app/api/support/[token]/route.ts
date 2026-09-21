import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  ESCALATION_REASONS, MAX_MESSAGE, REASON_LABELS, UUID_RE, firstName, hasKey, isOverdue,
} from "@/lib/support-constants";
import { adminAlertAddress, getRequestContext, getVendorContact, safeSend, siteUrl } from "@/lib/support";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID_RE.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { action?: string; message?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const message = String(body.message ?? "").trim();
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE} characters or fewer.` }, { status: 400 });
  }

  const { data: request } = await supabaseAdmin
    .from("support_requests")
    .select("*")
    .eq("access_token", token)
    .single();
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const closed = request.status === "resolved" || request.status === "denied";
  const ctx = await getRequestContext(request.order_id, request.product_id);
  const vendor = await getVendorContact(request.vendor_id);
  const who = firstName(request.buyer_name);
  const nowIso = new Date().toISOString();

  async function tellSeller(heading: string, paragraphs: string[], quote?: string) {
    if (!vendor) return;
    await safeSend({
      toEmail: vendor.email,
      subject: `${heading}: ${ctx.productName} (${ctx.orderNumber})`,
      label: "Support Update",
      heading,
      paragraphs,
      quote: quote ?? null,
      ctaLabel: "Open Support",
      ctaUrl: `${siteUrl()}/vendor/support`,
    });
  }

  async function tellAdmin(heading: string, paragraphs: string[], quote?: string) {
    await safeSend({
      toEmail: adminAlertAddress(),
      subject: `[Support] ${heading}: ${ctx.orderNumber}`,
      label: "Support Update",
      heading,
      paragraphs,
      quote: quote ?? null,
      ctaLabel: "Open Support Requests",
      ctaUrl: `${siteUrl()}/admin/support`,
    });
  }

  if (body.action === "reply") {
    if (closed) return NextResponse.json({ error: "This request is closed." }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

    await supabaseAdmin.from("support_messages").insert({ request_id: request.id, author_role: "buyer", body: message });
    await supabaseAdmin.from("support_requests").update({ updated_at: nowIso }).eq("id", request.id);

    await tellSeller("The buyer replied", [`${who} added a message to their request about ${ctx.productName}.`], message);
    if (request.status === "escalated") {
      await tellAdmin("Buyer replied on an escalated request", [`Order ${ctx.orderNumber}, ${ctx.productName}.`], message);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "escalate") {
    if (request.status !== "open") {
      return NextResponse.json({ error: "This request cannot be escalated." }, { status: 400 });
    }
    const reason = String(body.reason ?? "");
    const allowedNoResponse = reason === "no_response" && isOverdue(request);
    if (!hasKey(ESCALATION_REASONS, reason) && !allowedNoResponse) {
      return NextResponse.json({ error: "Please choose a valid reason." }, { status: 400 });
    }

    await supabaseAdmin
      .from("support_requests")
      .update({ status: "escalated", escalated_at: nowIso, escalation_reason: reason, updated_at: nowIso })
      .eq("id", request.id);
    if (message) {
      await supabaseAdmin.from("support_messages").insert({ request_id: request.id, author_role: "buyer", body: message });
    }

    const label = REASON_LABELS[reason] ?? reason;
    await tellAdmin("A buyer escalated a request", [`Order ${ctx.orderNumber}, ${ctx.productName}. Reason: ${label}.`], message || undefined);
    await tellSeller("A request was escalated", [`${who} asked our team to review their request about ${ctx.productName}. Reason: ${label}.`]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resolve") {
    if (closed) return NextResponse.json({ ok: true });
    await supabaseAdmin
      .from("support_requests")
      .update({ status: "resolved", resolved_at: nowIso, updated_at: nowIso })
      .eq("id", request.id);
    await tellSeller("Request marked resolved", [`${who} marked their request about ${ctx.productName} as resolved.`]);
    if (request.status === "escalated") {
      await tellAdmin("Buyer marked an escalated request resolved", [`Order ${ctx.orderNumber}, ${ctx.productName}.`]);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}