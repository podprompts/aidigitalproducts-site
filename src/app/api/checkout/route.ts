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

/** Returns the correct Stripe Price ID based on live timer state for this visitor. */
async function resolvePrice(
  req: NextRequest,
  productId: string,
  clientPriceId: string | undefined
): Promise<{ priceId: string | undefined; priceInDollars: number | undefined }> {
  const product = mockProducts.find((p) => p.id === productId);

  // No known product or no sale configured — trust what the client sent
  if (!product || !product.regularPriceId || !product.priceId) {
    return { priceId: clientPriceId, priceInDollars: product?.price };
  }

  // Product has a sale — check admin override first, then visitor timer
  const ip = getIp(req);

  const override = await getActiveOverride(productId, ip);
  if (override === "force_sale") {
    return { priceId: product.priceId, priceInDollars: product.price };
  }
  if (override === "force_regular") {
    return { priceId: product.regularPriceId, priceInDollars: product.regularPrice };
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
    return { priceId: product.priceId, priceInDollars: product.price };
  }

  const expiryMs = new Date(data.expires_at as string).getTime();
  const resetMs = expiryMs + 24 * 60 * 60 * 1000;

  // Phase 1: sale window active → sale price
  if (now < expiryMs) {
    return { priceId: product.priceId, priceInDollars: product.price };
  }

  // Phase 3: past 24-hr reset window → sale price (timer will reset on next page load)
  if (now >= resetMs) {
    return { priceId: product.priceId, priceInDollars: product.price };
  }

  // Phase 2: in the 24-hr regular window → regular price
  return { priceId: product.regularPriceId, priceInDollars: product.regularPrice };
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
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: { productId: productId ?? "" },
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
