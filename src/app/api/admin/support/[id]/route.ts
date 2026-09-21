import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MAX_MESSAGE, UUID_RE } from "@/lib/support-constants";
import { buyerRequestUrl, getRequestContext, safeSend } from "@/lib/support";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

  let body: { action?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const action = body.action;
  const message = String(body.message ?? "").trim();
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE} characters or fewer.` }, { status: 400 });
  }

  const { data: request } = await supabaseAdmin.from("support_requests").select("*").eq("id", id).single();
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const closed = request.status === "resolved" || request.status === "denied";
  const ctx = await getRequestContext(request.order_id, request.product_id);
  const nowIso = new Date().toISOString();
  const link = buyerRequestUrl(request.access_token);

  if (action === "reply") {
    if (closed) return NextResponse.json({ error: "This request is closed." }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    await supabaseAdmin.from("support_messages").insert({ request_id: id, author_role: "admin", body: message });
    await supabaseAdmin.from("support_requests").update({ updated_at: nowIso }).eq("id", id);
    await safeSend({
      toEmail: request.buyer_email,
      subject: `Update on your request about ${ctx.productName}`,
      label: "Support Reply",
      heading: "Our team replied to your request.",
      paragraphs: [`You have a new reply about ${ctx.productName} (order ${ctx.orderNumber}).`],
      quote: message,
      ctaLabel: "View and reply",
      ctaUrl: link,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "resolve" || action === "deny") {
    if (closed) return NextResponse.json({ ok: true });
    if (action === "deny" && !message) {
      return NextResponse.json({ error: "Add a message explaining the decision." }, { status: 400 });
    }
    if (message) {
      await supabaseAdmin.from("support_messages").insert({ request_id: id, author_role: "admin", body: message });
    }
    await supabaseAdmin
      .from("support_requests")
      .update({ status: action === "resolve" ? "resolved" : "denied", resolved_at: nowIso, updated_at: nowIso })
      .eq("id", id);
    await safeSend({
      toEmail: request.buyer_email,
      subject: `Your request about ${ctx.productName} was reviewed`,
      label: "Request Closed",
      heading: action === "resolve" ? "Your request was marked resolved." : "We reviewed your request.",
      paragraphs: [
        action === "resolve"
          ? `Our team marked your request about ${ctx.productName} (order ${ctx.orderNumber}) as resolved.`
          : `Our team reviewed your request about ${ctx.productName} (order ${ctx.orderNumber}) and closed it.`,
      ],
      quote: message || null,
      ctaLabel: "View your request",
      ctaUrl: link,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}