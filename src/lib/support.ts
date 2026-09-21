import { supabaseAdmin } from "@/lib/supabase/server";
import { sendSupportNotification, type SupportEmailData } from "@/lib/email";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
}

export function adminAlertAddress(): string {
  return process.env.ADMIN_ALERT_EMAIL ?? "support@aidigitalproducts.com";
}

export function buyerRequestUrl(token: string): string {
  return `${siteUrl()}/support/request/${token}`;
}

// Never throws: the request/reply has already been saved by the time we email.
export async function safeSend(data: SupportEmailData): Promise<void> {
  try {
    await sendSupportNotification(data);
  } catch (err) {
    console.error("[support-email] failed", err);
  }
}

export async function getVendorContact(vendorId: string | null) {
  if (!vendorId) return null;
  const { data } = await supabaseAdmin
    .from("vendor_profiles")
    .select("email, display_name")
    .eq("id", vendorId)
    .single();
  if (!data?.email) return null;
  return { email: data.email as string, name: (data.display_name as string | null) ?? "Seller" };
}

export async function getRequestContext(orderId: string, productId: string | null) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("order_number")
    .eq("id", orderId)
    .single();
  let productName = "the product";
  if (productId) {
    const { data: p } = await supabaseAdmin.from("products").select("name").eq("id", productId).single();
    if (p?.name) productName = p.name as string;
  }
  return { orderNumber: (order?.order_number as string | null) ?? "", productName };
}