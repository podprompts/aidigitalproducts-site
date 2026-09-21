"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MAX_MESSAGE, UUID_RE } from "@/lib/support-constants";
import { adminAlertAddress, buyerRequestUrl, getRequestContext, safeSend, siteUrl } from "@/lib/support";

export async function replyToSupportAction(requestId: string, text: string) {
  const body = (text ?? "").trim();
  if (!body) return { ok: false as const, error: "Reply cannot be empty." };
  if (body.length > MAX_MESSAGE) return { ok: false as const, error: `Reply must be ${MAX_MESSAGE} characters or fewer.` };
  if (!UUID_RE.test(requestId)) return { ok: false as const, error: "Invalid request." };

  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "You are signed out. Please log in again." };

  const { data: vendor } = await supabaseAdmin.from("vendor_profiles").select("is_active").eq("id", user.id).single();
  if (!vendor?.is_active) return { ok: false as const, error: "Not authorized." };

  const { data: request } = await supabaseAdmin.from("support_requests").select("*").eq("id", requestId).single();
  if (!request || request.vendor_id !== user.id) {
    return { ok: false as const, error: "You can only reply to requests on your own products." };
  }
  if (request.status === "resolved" || request.status === "denied") {
    return { ok: false as const, error: "This request is closed." };
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("support_messages")
    .insert({ request_id: requestId, author_role: "seller", body });
  if (error) {
    console.error("[vendor/support] reply failed", error);
    return { ok: false as const, error: "Could not send reply. Please try again." };
  }

  await supabaseAdmin
    .from("support_requests")
    .update({
      updated_at: nowIso,
      first_response_at: request.first_response_at ?? nowIso,
    })
    .eq("id", requestId);

  const ctx = await getRequestContext(request.order_id, request.product_id);
  await safeSend({
    toEmail: request.buyer_email,
    subject: `The creator replied about ${ctx.productName}`,
    label: "Support Reply",
    heading: "The creator replied to your request.",
    paragraphs: [`You have a new reply about ${ctx.productName} (order ${ctx.orderNumber}).`],
    quote: body,
    ctaLabel: "View and reply",
    ctaUrl: buyerRequestUrl(request.access_token),
  });

  revalidatePath("/vendor/support");
  return { ok: true as const };
}

export async function approveRefundAction(requestId: string) {
  if (!UUID_RE.test(requestId)) return { ok: false as const, error: "Invalid request." };

  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "You are signed out. Please log in again." };

  const { data: vendor } = await supabaseAdmin.from("vendor_profiles").select("is_active").eq("id", user.id).single();
  if (!vendor?.is_active) return { ok: false as const, error: "Not authorized." };

  const { data: request } = await supabaseAdmin.from("support_requests").select("*").eq("id", requestId).single();
  if (!request || request.vendor_id !== user.id) {
    return { ok: false as const, error: "You can only approve refunds on your own products." };
  }
  if (request.status === "resolved" || request.status === "denied") {
    return { ok: false as const, error: "This request is closed." };
  }
  if (request.seller_refund_approved_at) return { ok: true as const };

  const { data: order } = await supabaseAdmin.from("orders").select("status").eq("id", request.order_id).single();
  if (order?.status === "refunded" || order?.status === "chargeback") {
    return { ok: false as const, error: "This order has already been refunded." };
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabaseAdmin
    .from("support_requests")
    .update({
      seller_refund_approved_at: nowIso,
      first_response_at: request.first_response_at ?? nowIso,
      updated_at: nowIso,
    })
    .eq("id", requestId)
    .is("seller_refund_approved_at", null)
    .select("id");
  if (error) {
    console.error("[vendor/support] approve refund failed", error);
    return { ok: false as const, error: "Could not record your approval. Please try again." };
  }
  // Someone else already recorded it: nothing more to do, and no duplicate emails.
  if (!updated || updated.length === 0) return { ok: true as const };

  await supabaseAdmin.from("support_messages").insert({
    request_id: requestId,
    author_role: "seller",
    body: "I approve a refund for this order.",
  });

  const ctx = await getRequestContext(request.order_id, request.product_id);

  await safeSend({
    toEmail: adminAlertAddress(),
    subject: `[Refund approved] ${ctx.productName} (${ctx.orderNumber})`,
    label: "Refund Approved",
    heading: "A seller approved a refund.",
    paragraphs: [
      `The seller approved a refund for order ${ctx.orderNumber}, ${ctx.productName}. Nothing has been refunded yet: review the request and issue the refund from Support Requests.`,
    ],
    ctaLabel: "Open Support Requests",
    ctaUrl: `${siteUrl()}/admin/support`,
  });

  await safeSend({
    toEmail: request.buyer_email,
    subject: `The creator approved a refund for ${ctx.productName}`,
    label: "Refund Approved",
    heading: "The creator approved your refund.",
    paragraphs: [
      `The creator agreed to a refund for ${ctx.productName} (order ${ctx.orderNumber}). Our team will process it and email you when it has been issued.`,
    ],
    ctaLabel: "View your request",
    ctaUrl: buyerRequestUrl(request.access_token),
  });

  revalidatePath("/vendor/support");
  return { ok: true as const };
}
