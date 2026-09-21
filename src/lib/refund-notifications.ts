import { supabaseAdmin } from "@/lib/supabase/server";
import { sendVendorRefundNotification } from "@/lib/email";

export interface RefundedOrderRow {
  id: string;
  vendor_id: string | null;
  platform_fee_cents: number | null;
  vendor_payout_cents: number | null;
  amount_cents: number | null;
  currency: string | null;
  metadata: unknown;
}

// Emails the vendor about a refunded order. Never throws.
export async function notifyVendorOfRefund(order: RefundedOrderRow): Promise<void> {
  try {
    if (!order.vendor_id || order.platform_fee_cents == null) return;

    const { data: vendorProfile } = await supabaseAdmin
      .from("vendor_profiles")
      .select("email, display_name")
      .eq("id", order.vendor_id)
      .single();
    if (!vendorProfile?.email) return;

    const productId = (order.metadata as { product_id?: string } | null)?.product_id;
    const { data: product } = productId
      ? await supabaseAdmin.from("products").select("name").eq("id", productId).single()
      : { data: null };

    await sendVendorRefundNotification({
      toEmail: vendorProfile.email,
      toName: vendorProfile.display_name ?? undefined,
      productName: product?.name ?? "Your product",
      amountCents: order.amount_cents ?? 0,
      currency: order.currency ?? "usd",
      vendorPayoutCents: order.vendor_payout_cents ?? 0,
      orderId: order.id,
    });
  } catch (err) {
    console.error("[refund-notify] failed (non-fatal)", err);
  }
}