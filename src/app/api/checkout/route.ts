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
}> {
  const { data } = await supabaseAdmin
    .from("products")
    .select("sale_stripe_price_id, regular_stripe_price_id, sale_price_cents, regular_price_cents")
    .eq("id", productId)
    .single();

  return {
    salePriceId:         data?.sale_stripe_price_id     ?? null,
    regularPriceId:      data?.regular_stripe_price_id  ?? null,
    salePriceDollars:    data?.sale_price_cents    ? data.sale_price_cents / 100    : null,
    regularPriceDollars: data?.regular_price_cents ? data.regular_price_cents / 100 : null,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceId: clientPriceId, productId, productName, productPrice } = body;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Resolve the correct price server-side when a productId is provided
    const { priceId, priceInDollars } = productId
      ? await resolvePrice(req, productId as string, clientPriceId as string)
      : { priceId: clientPriceId as string | undefined, priceInDollars: Number(productPrice) };

    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(Number(priceInDollars ?? productPrice) * 100),
              product_data: {
                name: (productName as string) ?? "Digital Product",
                metadata: { productId: (productId as string) ?? "" },
              },
            },
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/checkout/cancel`,
      metadata:    { productId: productId ?? "" },
      automatic_tax: { enabled: false },
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