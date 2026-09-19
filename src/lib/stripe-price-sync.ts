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

// Logs everything Stripe's SDK gives us about an error — type, code, status,
// request ID — not just the generic message, so a failure is actually
// diagnosable from Vercel's function logs instead of a vague string.
function logStripeError(step: string, err: unknown) {
  const e = err as {
    type?: string;
    code?: string;
    statusCode?: number;
    requestId?: string;
    message?: string;
    detail?: unknown;
    cause?: unknown;
  };
  console.error(`[syncStripePrice] Failed at step: ${step}`, {
    type: e?.type,
    code: e?.code,
    statusCode: e?.statusCode,
    requestId: e?.requestId,
    message: e?.message,
    // The actual underlying network error (DNS/TLS/timeout) for a
    // StripeConnectionError lives here, not in the fields above.
    detail: e?.detail,
    cause: e?.cause,
  });
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
      } catch (err) {
        logStripeError("deactivate old price (clearing)", err);
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
    try {
      const existingPrice = await stripe.prices.retrieve(currentStripePriceId);
      stripeProductId = typeof existingPrice.product === "string"
        ? existingPrice.product
        : existingPrice.product.id;
    } catch (err) {
      logStripeError(`retrieve existing price (${currentStripePriceId})`, err);
      throw err;
    }
  }

  if (!stripeProductId) {
    try {
      const newStripeProduct = await stripe.products.create({
        name: productRow?.name ?? "Untitled Product",
      });
      stripeProductId = newStripeProduct.id;
    } catch (err) {
      logStripeError("create new Stripe Product", err);
      throw err;
    }
  }

  if (!productRow?.stripe_product_id) {
    await supabaseAdmin.from("products").update({ stripe_product_id: stripeProductId }).eq("id", productId);
  }

  let newPrice;
  try {
    newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: newPriceCents,
      currency,
    });
  } catch (err) {
    logStripeError(`create new price ($${(newPriceCents / 100).toFixed(2)} for product ${stripeProductId})`, err);
    throw err;
  }

  if (currentStripePriceId) {
    try {
      await stripe.prices.update(currentStripePriceId, { active: false });
    } catch (err) {
      const stripeErr = err as { message?: string };
      const blockedByDefault = stripeErr?.message?.includes(
        "cannot be archived because it is the default price"
      );

      if (blockedByDefault) {
        // Only promote the new price to default when it's actually needed to
        // unblock archiving — not unconditionally on every save. This keeps
        // two different price fields on the same product (e.g. regular and
        // PLR) from stomping each other's default status when both change
        // in the same request.
        try {
          await stripe.products.update(stripeProductId, { default_price: newPrice.id });
          await stripe.prices.update(currentStripePriceId, { active: false });
        } catch (retryErr) {
          logStripeError("deactivate old price (after promoting new one to default)", retryErr);
        }
      } else {
        logStripeError("deactivate old price (after creating new one)", err);
      }
    }
  }

  return { priceCents: newPriceCents, stripePriceId: newPrice.id };
}