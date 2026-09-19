import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { mockProducts } from "@/lib/mock-data";
import { getActiveOverride } from "@/lib/timer-overrides";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Fetch live Price IDs from Supabase — always the source of truth for Stripe keys. */
async function getDbPriceIds(productId: string): Promise<{
  salePriceId: string | null;
  regularPriceId: string | null;
  salePriceDollars: number | null;
  regularPriceDollars: number | null;
  plrPriceId: string | null;
  plrPriceDollars: number | null;
  plrAvailable: boolean;
}> {
  const { data } = await supabaseAdmin
    .from("products")
    .select(
      "sale_stripe_price_id, regular_stripe_price_id, sale_price_cents, regular_price_cents, plr_stripe_price_id, plr_price_cents, is_plr_available"
    )
    .eq("id", productId)
    .single();

  return {
    salePriceId:         data?.sale_stripe_price_id     ?? null,
    regularPriceId:      data?.regular_stripe_price_id  ?? null,
    salePriceDollars:    data?.sale_price_cents    ? data.sale_price_cents / 100    : null,
    regularPriceDollars: data?.regular_price_cents ? data.regular_price_cents / 100 : null,
    plrPriceId:          data?.plr_stripe_price_id ?? null,
    plrPriceDollars:     data?.plr_price_cents ? data.plr_price_cents / 100 : null,
    plrAvailable:        data?.is_plr_available ?? false,
  };
}

/** Returns the correct Stripe Price ID based on live timer state for this visitor. */
async function resolvePrice(
  req: NextRequest,
  productId: string,
  clientPriceId: string | undefined
): Promise<{ priceId: string | undefined; priceInDollars: number | undefined }> {
  const mockProduct = mockProducts.find((p) => p.id === productId);

  // Always fetch live Price IDs from Supabase — mock-data IDs may be stale test keys
  const db = await getDbPriceIds(productId);

  // Prefer Supabase Price IDs; fall back to mock only if Supabase has nothing
  const salePriceId      = db.salePriceId      ?? mockProduct?.priceId       ?? undefined;
  const regularPriceId   = db.regularPriceId   ?? mockProduct?.regularPriceId ?? undefined;
  const salePriceDollars    = db.salePriceDollars    ?? mockProduct?.price          ?? undefined;
  const regularPriceDollars = db.regularPriceDollars ?? mockProduct?.regularPrice   ?? undefined;

  // No sale configured — return the sale price (only active price)
  if (!regularPriceId || !salePriceId) {
    return { priceId: salePriceId ?? clientPriceId, priceInDollars: salePriceDollars };
  }

  // Product has a sale — check admin override first, then visitor timer
  const ip = getIp(req);

  const override = await getActiveOverride(productId, ip);
  if (override === "force_sale") {
    return { priceId: salePriceId, priceInDollars: salePriceDollars };
  }
  if (override === "force_regular") {
    return { priceId: regularPriceId, priceInDollars: regularPriceDollars };
  }

  const { data } = await supabaseAdmin
    .from("visitor_timers")
    .select("expires_at")
    .eq("ip_address", ip)
    .eq("product_id", productId)
    .maybeSingle();

  const now = Date.now();

  // No record → new visitor (or post-reset) → sale price
  if (!data) {
    return { priceId: salePriceId, priceInDollars: salePriceDollars };
  }

  const expiryMs = new Date(data.expires_at as string).getTime();
  const resetMs  = expiryMs + 24 * 60 * 60 * 1000;

  // Phase 1: sale window active → sale price
  if (now < expiryMs) {
    return { priceId: salePriceId, priceInDollars: salePriceDollars };
  }

  // Phase 3: past 24-hr reset window → sale price (timer will reset on next page load)
  if (now >= resetMs) {
    return { priceId: salePriceId, priceInDollars: salePriceDollars };
  }

  // Phase 2: in the 24-hr regular window → regular price
  return { priceId: regularPriceId, priceInDollars: regularPriceDollars };
}

/**
 * PLR pricing is a fixed tier — deliberately bypasses the countdown/urgency
 * timer logic entirely. A resale license isn't the kind of purchase that
 * should feel like an impulse-buy discount race; it's a flat, considered price.
 */
async function resolvePlrPrice(
  productId: string
): Promise<{ priceId: string | undefined; priceInDollars: number | undefined; available: boolean }> {
  const db = await getDbPriceIds(productId);
  return {
    priceId: db.plrPriceId ?? undefined,
    priceInDollars: db.plrPriceDollars ?? undefined,
    available: db.plrAvailable && !!db.plrPriceId,
  };
}

/**
 * Checks whether this product's vendor has a Stripe Connect account that's
 * actually ready to receive transfers. Always verified live against Stripe —
 * never trusts a cached "onboarding complete" flag alone, since that could
 * be stale (e.g. Stripe later restricted the account for some reason).
 */
async function getVendorPayoutInfo(
  productId: string
): Promise<{ stripeAccountId: string } | null> {
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("vendor_id")
    .eq("id", productId)
    .single();

  if (!product?.vendor_id) return null;

  const { data: vendor } = await supabaseAdmin
    .from("vendor_profiles")
    .select("stripe_account_id")
    .eq("id", product.vendor_id)
    .single();

  if (!vendor?.stripe_account_id) return null;

  try {
    const account = await stripe.accounts.retrieve(vendor.stripe_account_id);
    if (!account.charges_enabled || !account.payouts_enabled) return null;
    return { stripeAccountId: vendor.stripe_account_id };
  } catch {
    // Account retrieval failed for any reason — fail safe by not splitting
    // rather than risking a broken transfer destination.
    return null;
  }
}

function getPlatformCommissionPercent(): number {
  const raw = process.env.PLATFORM_COMMISSION_PERCENT;
  const parsed = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 20;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      priceId: clientPriceId,
      productId,
      productName,
      productPrice,
      licenseType, // "personal" (default) | "plr"
    } = body;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resolvedLicenseType: "personal" | "plr" = licenseType === "plr" ? "plr" : "personal";

    let priceId: string | undefined;
    let priceInDollars: number | undefined;

    if (resolvedLicenseType === "plr" && productId) {
      const plr = await resolvePlrPrice(productId as string);
      if (!plr.available) {
        return NextResponse.json(
          { error: "A PLR license is not available for this product" },
          { status: 400 }
        );
      }
      priceId = plr.priceId;
      priceInDollars = plr.priceInDollars;
    } else if (productId) {
      const resolved = await resolvePrice(req, productId as string, clientPriceId as string);
      priceId = resolved.priceId;
      priceInDollars = resolved.priceInDollars;
    } else {
      priceId = clientPriceId as string | undefined;
      priceInDollars = Number(productPrice);
    }

    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(Number(priceInDollars ?? productPrice) * 100),
              product_data: {
                name:
                  ((productName as string) ?? "Digital Product") +
                  (resolvedLicenseType === "plr" ? " (PLR License)" : ""),
                metadata: { productId: (productId as string) ?? "" },
              },
            },
          },
        ];

    // Determine whether this product's vendor is set up to receive a split
    // payout. If not — including the common case of no vendor at all, or
    // the platform's own products — checkout proceeds exactly as it does
    // today, with no split whatsoever.
    let platformFeeCents: number | null = null;
    let vendorId: string | null = null;
    let payoutInfo: { stripeAccountId: string } | null = null;

    if (productId) {
      payoutInfo = await getVendorPayoutInfo(productId as string);
      if (payoutInfo) {
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("vendor_id")
          .eq("id", productId)
          .single();
        vendorId = product?.vendor_id ?? null;

        const totalCents = Math.round(Number(priceInDollars ?? productPrice) * 100);
        const commissionPercent = getPlatformCommissionPercent();
        platformFeeCents = Math.round(totalCents * (commissionPercent / 100));
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/checkout/cancel`,
      metadata: {
        productId: productId ?? "",
        licenseType: resolvedLicenseType,
        vendorId: vendorId ?? "",
        platformFeeCents: platformFeeCents !== null ? String(platformFeeCents) : "",
      },
      automatic_tax: { enabled: false },
      ...(payoutInfo && platformFeeCents !== null
        ? {
            payment_intent_data: {
              application_fee_amount: platformFeeCents,
              transfer_data: { destination: payoutInfo.stripeAccountId },
            },
          }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout/route]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}