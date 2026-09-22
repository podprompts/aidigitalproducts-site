"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MAX_MESSAGE, UUID_RE, firstName } from "@/lib/support-constants";
import { contactRequestUrl, safeSend } from "@/lib/contact-seller";

export async function replyToContactAction(requestId: string, text: string) {
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

  const { data: request } = await supabaseAdmin.from("seller_contact_requests").select("*").eq("id", requestId).single();
  if (!request || request.vendor_id !== user.id) {
    return { ok: false as const, error: "You can only reply to your own messages." };
  }

  const { error } = await supabaseAdmin
    .from("seller_contact_messages")
    .insert({ request_id: requestId, author_role: "seller", body });
  if (error) {
    console.error("[vendor/messages] reply failed", error);
    return { ok: false as const, error: "Could not send reply. Please try again." };
  }

  await supabaseAdmin
    .from("seller_contact_requests")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", requestId);

  await safeSend({
    toEmail: request.buyer_email,
    subject: `${firstName(request.buyer_name)}, the seller replied`,
    label: "New Reply",
    heading: "The seller replied to your message.",
    paragraphs: ["You have a new reply to your message."],
    quote: body,
    ctaLabel: "View and reply",
    ctaUrl: contactRequestUrl(request.access_token),
  });

  revalidatePath("/vendor/messages");
  return { ok: true as const };
}