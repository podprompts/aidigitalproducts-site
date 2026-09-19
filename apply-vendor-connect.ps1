# Creates the 3 new Stripe Connect files and replaces the 3 existing ones.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\api\vendor\connect" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\vendor\connect\status" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\vendor\(protected)\connect" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("stripe_account_id, email, business_name")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  let accountId = profile.stripe_account_id as string | null;

  // Create the Connect account only if this vendor doesn't already have one
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: profile.email ?? user.email ?? undefined,
      business_profile: profile.business_name ? { name: profile.business_name } : undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await supabaseAdmin
      .from("vendor_profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Account Links are single-use and short-lived — generate a fresh one
  // every time, whether this is a first-time setup or resuming an
  // incomplete onboarding.
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/vendor/connect?refresh=true`,
    return_url: `${appUrl}/vendor/connect?complete=true`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\connect\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\vendor\connect\route.ts" -ForegroundColor Green

$content = @'
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ connected: false, onboardingComplete: false });
  }

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);
  const onboardingComplete = !!account.charges_enabled && !!account.payouts_enabled;

  // Keep the cached display flag in sync with what Stripe actually reports
  await supabaseAdmin
    .from("vendor_profiles")
    .update({ stripe_onboarding_complete: onboardingComplete })
    .eq("id", user.id);

  return NextResponse.json({
    connected: true,
    onboardingComplete,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\connect\status\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\vendor\connect\status\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useState, useEffect } from "react";

type Status = {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
};

export default function VendorConnectPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/connect/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Couldn't check your payout status. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleConnect() {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start setup");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setStarting(false);
    }
  }

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1 className="display" style={{ fontSize: "28px", color: "var(--ink)", marginBottom: "8px" }}>
        Payouts
      </h1>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px" }}>
        Connect a Stripe account to receive your share of each sale automatically. The platform
        keeps a commission on every order; the rest is transferred to you directly by Stripe.
      </p>

      {loading && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Checking your status…</p>}

      {!loading && status && (
        <div style={{ border: "1px solid var(--line)", padding: "24px", marginBottom: "24px" }}>
          {!status.connected && (
            <p style={{ fontSize: "14px", color: "var(--ink-faded)", margin: 0 }}>
              You haven&apos;t connected a Stripe account yet.
            </p>
          )}
          {status.connected && !status.onboardingComplete && (
            <p style={{ fontSize: "14px", color: "var(--ink-faded)", margin: 0 }}>
              Your Stripe account setup is incomplete — Stripe still needs some information from
              you before you can receive payouts.
            </p>
          )}
          {status.connected && status.onboardingComplete && (
            <p style={{ fontSize: "14px", color: "#166534", fontWeight: 600, margin: 0 }}>
              ✓ Connected and ready to receive payouts.
            </p>
          )}
        </div>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "#e53e3e", marginBottom: "16px" }}>{error}</p>
      )}

      {!loading && status && !status.onboardingComplete && (
        <button
          onClick={handleConnect}
          disabled={starting}
          className="btn btn-primary"
          style={{ opacity: starting ? 0.6 : 1 }}
        >
          {starting ? "Redirecting to Stripe…" : status.connected ? "Finish Setup" : "Connect Stripe Account"}
        </button>
      )}
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\connect\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\vendor\(protected)\connect\page.tsx" -ForegroundColor Green

$content = @'
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
'@
Set-Content -LiteralPath "src\app\api\checkout\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\checkout\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/email";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Record the raw event for idempotency / audit
  const { error: webhookInsertError } = await supabaseAdmin
    .from("webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
    });

  if (webhookInsertError) {
    // Duplicate event_id means we already processed this — acknowledge and stop
    if (webhookInsertError.code === "23505") {
      return NextResponse.json({ received: true });
    }
    console.error("[webhook] failed to record event", webhookInsertError);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productId = session.metadata?.productId ?? null;
    const licenseType: "personal" | "plr" =
      session.metadata?.licenseType === "plr" ? "plr" : "personal";

    // Vendor payout split — only present when checkout actually applied one.
    // Absent for the platform's own products or a vendor with no connected
    // Stripe account, in which case these all stay null, matching today's
    // behavior exactly.
    const vendorId = session.metadata?.vendorId || null;
    const platformFeeCentsRaw = session.metadata?.platformFeeCents;
    const platformFeeCents =
      platformFeeCentsRaw && platformFeeCentsRaw !== "" ? parseInt(platformFeeCentsRaw, 10) : null;
    const vendorPayoutCents =
      platformFeeCents !== null && session.amount_total !== null
        ? session.amount_total - platformFeeCents
        : null;

    const { data: order, error } = await supabaseAdmin.from("orders").insert({
      stripe_checkout_session_id: session.id,
      email: session.customer_details?.email ?? null,
      amount_cents: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      license_type: licenseType,
      vendor_id: vendorId,
      platform_fee_cents: platformFeeCents,
      vendor_payout_cents: vendorPayoutCents,
      metadata: { product_id: productId, license_type: licenseType },
    }).select("id").single();

    if (error) {
      console.error("[webhook] failed to insert order", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    // Increment purchase counter — non-fatal if it fails
    if (productId) {
      const { error: rpcError } = await supabaseAdmin.rpc("increment_purchases", {
        product_id: productId,
      });
      if (rpcError) {
        console.error("[webhook] increment_purchases failed", rpcError);
      }
    }

    // Generate download token and send confirmation email — non-fatal if either fails
    if (productId && order?.id) {
      const token     = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: tokenError } = await supabaseAdmin.from("download_tokens").insert({
        order_id:       order.id,
        product_id:     productId,
        token,
        expires_at:     expiresAt,
        download_count: 0,
        max_downloads:  15,
      });

      if (tokenError) {
        console.error("[webhook] failed to create download token", tokenError);
      } else {
        const customerEmail = session.customer_details?.email;
        const customerName  = session.customer_details?.name ?? undefined;

        if (customerEmail) {
          const { data: product } = await supabaseAdmin
            .from("products")
            .select("name")
            .eq("id", productId)
            .single();

          const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
          const downloadUrl = `${siteUrl}/checkout/success?token=${token}`;

          // Check for multi-file product_files rows
          const { data: productFiles } = await supabaseAdmin
            .from("product_files")
            .select("file_name, sort_order")
            .eq("product_id", productId)
            .order("sort_order", { ascending: true });

          // Build downloadFiles array if multi-file product, otherwise fall back to single URL
          const downloadFiles =
            productFiles && productFiles.length > 0
              ? productFiles.map((f, i) => ({
                  file_name: f.file_name,
                  url: `${siteUrl}/api/download/${token}?file=${i}`,
                }))
              : [{ file_name: product?.name ?? "Your product", url: downloadUrl }];

          // NOTE: sendOrderConfirmation needs to accept and render these two new
          // fields — see the follow-up note about src/lib/email.ts below.
          sendOrderConfirmation({
            toEmail:      customerEmail,
            toName:       customerName,
            productName:  product?.name ?? "Your product",
            amountCents:  session.amount_total ?? 0,
            currency:     session.currency ?? "usd",
            downloadFiles,
            orderId:      order.id,
            licenseType,
            licenseUrl: licenseType === "plr" ? `${siteUrl}/plr-license` : undefined,
          }).catch((err) => {
            console.error("[webhook] failed to send confirmation email", err);
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
'@
Set-Content -LiteralPath "src\app\api\webhooks\stripe\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\webhooks\stripe\route.ts" -ForegroundColor Green

$content = @'
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signOutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/vendor/login");
  }

  // Confirm this logged-in user actually has a vendor_profiles row —
  // being a valid Supabase Auth user isn't enough on its own; only
  // real vendors should get past this point.
  const { data: vendorProfile } = await supabaseAdmin
    .from("vendor_profiles")
    .select("display_name, is_active")
    .eq("id", user.id)
    .single();

  if (!vendorProfile || !vendorProfile.is_active) {
    redirect("/vendor/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
          Vendor Portal — {vendorProfile.display_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="/vendor/products" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Products
          </a>
          <a href="/vendor/connect" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-faded)", textDecoration: "none" }}>
            Payouts
          </a>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign Out
            </button>
          </form>
        </div>
      </div>
      <div style={{ padding: "32px" }}>{children}</div>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\layout.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\layout.tsx" -ForegroundColor Green

Write-Host "`nAll 6 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan