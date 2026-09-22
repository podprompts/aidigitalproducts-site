import { supabaseAdmin } from "@/lib/supabase/server";
import { sendSupportNotification, type SupportEmailData } from "@/lib/email";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
}

export function contactRequestUrl(token: string): string {
  return `${siteUrl()}/contact-seller/request/${token}`;
}

// Never throws: the request/reply has already been saved by the time we email.
export async function safeSend(data: SupportEmailData): Promise<void> {
  try {
    await sendSupportNotification(data);
  } catch (err) {
    console.error("[contact-seller-email] failed", err);
  }
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

// Separate from getActiveVendor (src/lib/vendor.ts) so the public-facing
// vendor lookup never selects email; only this server-only path does.
export async function getVendorEmail(vendorId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("vendor_profiles")
    .select("email")
    .eq("id", vendorId)
    .single();
  return (data?.email as string | null) ?? null;
}