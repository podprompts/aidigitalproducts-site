import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

interface SyncPriceParams {
  productId: string;
  newPriceCents: number | null; // the amount being saved, or null to clear/turn off this price
  currentPriceCents: number | null; // what's currently stored, to detect a no-op save
  currentStripePriceId: string | null;
  currency?: string;
}

interface SyncPriceResult {
  priceCents: number | null;
  stripePriceId: string | null;
}

/**
 * Keeps a *_price_cents field and its matching *_stripe_price_id in sync.
 * Call this BEFORE writing to the database, then write both returned values
 * together in the SAME update — never write priceCents without also writing
 * the stripePriceId this function returns alongside it.
 *
 * - If newPriceCents is null: deactivates any existing Stripe Price, returns nulls.
 * - If newPriceCents matches what's already stored: does nothing, returns the
 *   existing values unchanged (avoids creating a pointless new Stripe Price
 *   on every save when the amount wasn't actually touched).
 * - Otherwise: creates a new Stripe Price under the product's Stripe Product
 *   (looked up from the existing Price if not already cached, or created if
 *   this product has genuinely never had a Stripe Price at all), deactivates
 *   the old Price, and returns the new amount + new Price ID.
 */
export async function syncStripePrice(params: SyncPriceParams): Promise<SyncPriceResult> {
  const { productId, newPriceCents, currentPriceCents, currentStripePriceId, currency = "usd" } = params;

  if (newPriceCents === null) {
    if (currentStripePriceId) {
      try {
        await stripe.prices.update(currentStripePriceId, { active: false });
      } catch {
        // Non-fatal — if Stripe fails to deactivate, we still clear our own reference below
      }
    }
    return { priceCents: null, stripePriceId: null };
  }

  if (newPriceCents === currentPriceCents && currentStripePriceId) {
    return { priceCents: newPriceCents, stripePriceId: currentStripePriceId };
  }

  const { data: productRow } = await supabaseAdmin
    .from("products")
    .select("stripe_product_id, name")
    .eq("id", productId)
    .single();

  let stripeProductId: string | null = productRow?.stripe_product_id ?? null;

  if (!stripeProductId && currentStripePriceId) {
    const existingPrice = await stripe.prices.retrieve(currentStripePriceId);
    stripeProductId = typeof existingPrice.product === "string"
      ? existingPrice.product
      : existingPrice.product.id;
  }

  if (!stripeProductId) {
    // This product has genuinely never had any Stripe Price on record at all.
    const newStripeProduct = await stripe.products.create({
      name: productRow?.name ?? "Untitled Product",
    });
    stripeProductId = newStripeProduct.id;
  }

  if (!productRow?.stripe_product_id) {
    await supabaseAdmin.from("products").update({ stripe_product_id: stripeProductId }).eq("id", productId);
  }

  const newPrice = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: newPriceCents,
    currency,
  });

  if (currentStripePriceId) {
    try {
      await stripe.prices.update(currentStripePriceId, { active: false });
    } catch {
      // Non-fatal — an old Price staying active doesn't break anything;
      // new checkouts will use the new Price ID we're about to store.
    }
  }

  return { priceCents: newPriceCents, stripePriceId: newPrice.id };
}