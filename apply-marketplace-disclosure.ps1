# Marketplace seller disclosure system: new Refund & Buyer Protection
# Policy page, Stripe checkout disclosure text, and an optional vendor-
# editable Creator Refund Terms field threaded through content moderation.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\refund-buyer-protection" | Out-Null

$content = @'
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Refund & Buyer Protection Policy — AI Digital Products",
  description:
    "How refunds, support requests, and marketplace escalation actually work at AiDigitalProducts.com.",
};

const toc = [
  { id: "overview",      label: "1. Overview" },
  { id: "creator-first", label: "2. Contact the Creator First" },
  { id: "response-time", label: "3. 48-Hour Response Requirement" },
  { id: "escalation",    label: "4. When AI Digital Products Steps In" },
  { id: "listing-terms", label: "5. Listing-Specific Refund Terms" },
  { id: "consumer-rights", label: "6. Your Statutory Rights" },
  { id: "how-to",        label: "7. How to Request a Refund" },
  { id: "contact",       label: "8. Contact Information" },
];

export default function RefundBuyerProtectionPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: "100px" }}>
        <section className="page-hero">
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "24px" }}>
              — Legal —
            </div>
            <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 80px)", lineHeight: 0.98, color: "var(--ink)", maxWidth: "900px", margin: "0 auto" }}>
              Refund &amp; Buyer Protection Policy.
            </h1>
            <p style={{ marginTop: "28px", fontSize: "14px", fontWeight: 500, color: "var(--ink-faded)" }}>
              Last Updated: September 19, 2026
            </p>
          </div>
        </section>

        <section className="block">
          <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "64px" }}>

            <div
              style={{
                background: "#fff8e1", border: "1px solid #f0d878", padding: "16px 20px",
                fontSize: "13px", color: "#6b5a1a",
              }}
            >
              <strong>Draft — not yet reviewed by an attorney.</strong> This describes the practical
              process; it doesn't override or restate the legal terms in the Terms of Service,
              which governs in the event of any conflict.
            </div>

            <div
              style={{ background: "var(--bg-alt)", border: "1px solid var(--line)", padding: "36px 40px" }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-mute)", marginBottom: "20px" }}>
                Contents
              </div>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-faded)", textDecoration: "none" }}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            <LegalSection id="overview" number="1" title="Overview">
              <p>
                Most products on AI Digital Products are created and sold by independent Creators.
                This page explains, in practical terms, what happens if you have a problem with a
                purchase — who to contact, how long they have to respond, and when the platform
                itself gets involved.
              </p>
            </LegalSection>

            <LegalSection id="creator-first" number="2" title="Contact the Creator First">
              <p>
                If a product doesn't work as described, is missing files, or otherwise has a
                genuine problem, contact the Creator listed on the product page first. Most issues
                are resolved quickly this way — a corrected file, a missing download link fixed,
                or a straightforward refund.
              </p>
            </LegalSection>

            <LegalSection id="response-time" number="3" title="48-Hour Response Requirement">
              <p>
                Creators selling on this marketplace are required to respond to legitimate support
                and refund requests within 48 hours. This is a response requirement, not a
                resolution requirement — a Creator may reasonably need more time to investigate or
                fix an issue, but they must acknowledge your request and make a genuine effort to
                address it within that window.
              </p>
            </LegalSection>

            <LegalSection id="escalation" number="4" title="When AI Digital Products Steps In">
              <p>
                Buyers and Creators are expected to resolve ordinary issues directly. We'll review
                and step into a dispute when:
              </p>
              <ul>
                <li>A Creator hasn't responded within 48 hours</li>
                <li>A Creator repeatedly ignores legitimate messages</li>
                <li>A product is materially different from its description, or materially defective</li>
                <li>A Creator refuses to address a legitimate, genuine problem</li>
                <li>There's evidence of fraud, deception, or abuse</li>
              </ul>
              <p>
                To escalate, contact us through the{" "}
                <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>Contact page</Link>{" "}
                with your order number and a summary of what's happened so far.
              </p>
            </LegalSection>

            <LegalSection id="listing-terms" number="5" title="Listing-Specific Refund Terms">
              <p>
                Some Creators set additional refund terms specific to their own products — these
                appear directly on the product page and at checkout when present. Listing-specific
                terms can only add to what's offered here; they can never take away rights this
                policy or your Terms of Service already provide you.
              </p>
            </LegalSection>

            <LegalSection id="consumer-rights" number="6" title="Your Statutory Rights">
              <p>
                Nothing in this policy, a Creator's own refund terms, or any product listing is
                intended to exclude or restrict consumer rights that cannot legally be excluded or
                restricted. Where mandatory law in your jurisdiction gives you stronger rights than
                described here, those rights apply.
              </p>
            </LegalSection>

            <LegalSection id="how-to" number="7" title="How to Request a Refund">
              <p>Reach out to the Creator directly using the contact details on the product page or in your order confirmation email. If you don't hear back within 48 hours, or the issue meets one of the escalation criteria above, contact us directly with your order number.</p>
            </LegalSection>

            <LegalSection id="contact" number="8" title="Contact Information">
              <p>Questions about this policy or an active dispute? Reach us here:</p>
              <ContactBlock />
            </LegalSection>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function LegalSection({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ scrollMarginTop: "100px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-mute)", marginBottom: "10px" }}>
        {number}
      </div>
      <h2 style={{ fontSize: "clamp(18px, 2vw, 24px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--line)" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}

function ContactBlock() {
  return (
    <div style={{ marginTop: "8px", padding: "24px 28px", background: "var(--bg-alt)", border: "1px solid var(--line)", fontSize: "14px", fontWeight: 500, color: "var(--ink-faded)", lineHeight: 2 }}>
      <strong style={{ color: "var(--ink)" }}>HONNYDO LLC d/b/a AI Digital Products</strong>
      <br />
      Arizona, USA
      <br />
      Contact:{" "}
      <Link href="/contact" style={{ color: "var(--ink)", fontWeight: 600 }}>
        AiDigitalProducts.com/contact
      </Link>
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\refund-buyer-protection\page.tsx" -Value $content -NoNewline
Write-Host "NEW: src\app\refund-buyer-protection\page.tsx" -ForegroundColor Green

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

    // Seller disclosure info — fetched independent of the payout split
    // above, since even a vendor who hasn't connected Stripe yet is still
    // the Creator of this product and the buyer should still see who
    // they're actually buying from.
    let sellerName: string | null = null;
    let creatorRefundTerms: string | null = null;

    if (productId) {
      const { data: productInfo } = await supabaseAdmin
        .from("products")
        .select("vendor_id, creator_refund_terms")
        .eq("id", productId)
        .single();
      creatorRefundTerms = productInfo?.creator_refund_terms ?? null;
      if (productInfo?.vendor_id) {
        vendorId = productInfo.vendor_id;
        const { data: vendorProfile } = await supabaseAdmin
          .from("vendor_profiles")
          .select("display_name")
          .eq("id", productInfo.vendor_id)
          .single();
        sellerName = vendorProfile?.display_name ?? null;
      }

      payoutInfo = await getVendorPayoutInfo(productId as string);
      if (payoutInfo) {
        const totalCents = Math.round(Number(priceInDollars ?? productPrice) * 100);
        const commissionPercent = getPlatformCommissionPercent();
        platformFeeCents = Math.round(totalCents * (commissionPercent / 100));
      }
    }

    const disclosureMessage = sellerName
      ? (
          `You're purchasing a digital product from ${sellerName}. The Creator is responsible ` +
          `for this product and its refund terms` +
          (creatorRefundTerms ? ` (${creatorRefundTerms})` : "") +
          `. If you experience a problem, contact the Creator first — Creators must respond ` +
          `within 48 hours. If they don't respond or the issue can't be resolved, you may ` +
          `escalate to AI Digital Products support. Your statutory consumer rights are not affected.`
        ).slice(0, 1200)
      : undefined;

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
      ...(disclosureMessage ? { custom_text: { submit: { message: disclosureMessage } } } : {}),
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
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

async function getVendorUser() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getVendorUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url, pending_changes, review_status, review_rejected_reason, last_approved_changes, last_approved_at, creator_refund_terms"
    )
    .eq("id", id)
    .eq("vendor_id", user.id) // scoped — a vendor can only ever fetch their own product
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

/**
 * Every vendor edit is staged, never written live. This route only ever
 * touches pending_changes / review_status / review_submitted_at — the
 * actual product columns (and product_images) are only updated when an
 * admin approves the submission, via the separate admin approval route.
 * Stripe price syncing also happens at approval time, not here, so a
 * price change never takes effect until it's actually approved either.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getVendorUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  // Verify ownership BEFORE allowing any update — never trust the client's
  // claim about which product this is.
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("id, vendor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.vendor_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Same field whitelist as before — a vendor can propose changes to their
  // own listing's content, pricing amounts, images, video, and file, but
  // never Stripe price IDs directly, site-level curation flags, the
  // coming-soon/archived states, or is_not_ai. Those stay admin-only.
  // "images" is a full array of { url, is_primary, display_order } — the
  // vendor's complete desired image set, not an incremental change.
  const proposed: Record<string, unknown> = {};
  if (typeof body.name === "string") proposed.name = body.name;
  if (typeof body.slug === "string") proposed.slug = body.slug;
  if (typeof body.category === "string") proposed.category = body.category;
  if (typeof body.description === "string") proposed.description = body.description;
  if (Array.isArray(body.features)) proposed.features = body.features;
  if (typeof body.sale_price_cents === "number" || body.sale_price_cents === null) {
    proposed.sale_price_cents = body.sale_price_cents;
  }
  if (typeof body.regular_price_cents === "number" || body.regular_price_cents === null) {
    proposed.regular_price_cents = body.regular_price_cents;
  }
  if (typeof body.is_active === "boolean") proposed.is_active = body.is_active;
  if (typeof body.is_plr_available === "boolean") proposed.is_plr_available = body.is_plr_available;
  if (typeof body.plr_price_cents === "number" || body.plr_price_cents === null) {
    proposed.plr_price_cents = body.plr_price_cents;
  }
  if (body.attributes && typeof body.attributes === "object") {
    proposed.attributes = body.attributes;
  }
  if (typeof body.video_url === "string" || body.video_url === null) {
    proposed.video_url = body.video_url;
  }
  if (typeof body.download_url === "string" || body.download_url === null) {
    proposed.download_url = body.download_url;
  }
  if (Array.isArray(body.images)) {
    proposed.images = body.images;
  }
  if (typeof body.creator_refund_terms === "string" || body.creator_refund_terms === null) {
    proposed.creator_refund_terms = body.creator_refund_terms;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      pending_changes: proposed,
      review_status: "pending",
      review_submitted_at: new Date().toISOString(),
      review_rejected_reason: null,
    })
    .eq("id", id)
    .eq("vendor_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
'@
Set-Content -LiteralPath "src\app\api\vendor\products\[id]\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\vendor\products\[id]\route.ts" -ForegroundColor Green

$content = @'
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import VendorProductEditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditVendorProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url, review_status, review_rejected_reason, last_approved_changes, last_approved_at, creator_refund_terms")
    .eq("id", id)
    .single();

  // Ownership check — a vendor can only ever land here for their own product
  if (!product || product.vendor_id !== user.id) notFound();

  // The rejection/approval banners are shown exactly once — capture their
  // current values for THIS render, then clear them immediately so a
  // refresh or a later visit doesn't keep showing a decision the vendor
  // has already seen. The permanent record still lives in
  // product_review_log regardless of this clearing.
  const bannerData = {
    review_status: product.review_status,
    review_rejected_reason: product.review_rejected_reason,
    last_approved_changes: product.last_approved_changes,
    last_approved_at: product.last_approved_at,
  };

  const hasApprovedBanner = Array.isArray(product.last_approved_changes) && product.last_approved_changes.length > 0;
  if (product.review_status === "rejected" || hasApprovedBanner) {
    await supabaseAdmin
      .from("products")
      .update({
        // "pending" is an ongoing state, not a past decision — only ever
        // clear review_status if it was specifically "rejected".
        review_status: product.review_status === "rejected" ? "none" : product.review_status,
        review_rejected_reason: null,
        last_approved_changes: null,
        last_approved_at: null,
      })
      .eq("id", id);
  }

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("id, url, is_primary, display_order")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  return (
    <VendorProductEditForm
      product={{ ...product, ...bannerData }}
      initialImages={images ?? []}
    />
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\products\[id]\edit\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\products\[id]\edit\page.tsx" -ForegroundColor Green

$content = @'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ImageUploader, { type UIImage } from "@/components/admin/ImageUploader";

const PREDEFINED_ATTR_KEYS = [
  "promptsIncluded","worksWith","license","format","lastUpdated",
  "version","instantDownload","support","difficultyLevel","builtWith",
  "requirements","aiModel",
];

const WORKS_WITH_OPTIONS = [
  "Midjourney", "DALL-E 3", "Ideogram", "Stable Diffusion",
  "ChatGPT", "Claude", "GPT-4",
];

interface AttributeState {
  promptsIncluded: string;
  worksWith: string[];
  license: string;
  format: string;
  lastUpdated: string;
  version: string;
  instantDownload: string;
  support: string;
  difficultyLevel: string;
  builtWith: string;
  requirements: string;
  aiModel: string;
  custom: { key: string; value: string }[];
}

function attrsFromRecord(a: Record<string, unknown>): AttributeState {
  const custom = Object.entries(a)
    .filter(([k]) => !PREDEFINED_ATTR_KEYS.includes(k))
    .map(([k, v]) => ({ key: k, value: String(v) }));
  return {
    promptsIncluded: a.promptsIncluded != null ? String(a.promptsIncluded) : "",
    worksWith:       Array.isArray(a.worksWith) ? (a.worksWith as string[]) : [],
    license:         (a.license as string)         ?? "",
    format:          (a.format as string)           ?? "",
    lastUpdated:     (a.lastUpdated as string)      ?? "",
    version:         (a.version as string)          ?? "",
    instantDownload: a.instantDownload === true ? "true" : a.instantDownload === false ? "false" : "",
    support:         (a.support as string)          ?? "",
    difficultyLevel: (a.difficultyLevel as string)  ?? "",
    builtWith:       (a.builtWith as string)        ?? "",
    requirements:    (a.requirements as string)     ?? "",
    aiModel:         (a.aiModel as string)          ?? "",
    custom,
  };
}

function buildAttributesPayload(attrs: AttributeState): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (attrs.promptsIncluded)        result.promptsIncluded = Number(attrs.promptsIncluded);
  if (attrs.worksWith.length > 0)   result.worksWith = attrs.worksWith;
  if (attrs.license)                result.license = attrs.license;
  if (attrs.format)                 result.format = attrs.format;
  if (attrs.lastUpdated)            result.lastUpdated = attrs.lastUpdated;
  if (attrs.version)                result.version = attrs.version;
  if (attrs.instantDownload !== "") result.instantDownload = attrs.instantDownload === "true";
  if (attrs.support)                result.support = attrs.support;
  if (attrs.difficultyLevel)        result.difficultyLevel = attrs.difficultyLevel;
  if (attrs.builtWith)              result.builtWith = attrs.builtWith;
  if (attrs.requirements)           result.requirements = attrs.requirements;
  if (attrs.aiModel)                result.aiModel = attrs.aiModel;
  for (const c of attrs.custom) {
    if (c.key.trim() && c.value.trim()) result[c.key.trim()] = c.value.trim();
  }
  return result;
}

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    description: string | null;
    features: string[] | null;
    sale_price_cents: number | null;
    regular_price_cents: number | null;
    is_plr_available: boolean | null;
    plr_price_cents: number | null;
    is_active: boolean;
    video_url: string | null;
    download_url: string | null;
    attributes: Record<string, unknown> | null;
    review_status?: string;
    review_rejected_reason?: string | null;
    last_approved_changes?: { label: string; oldValue: string; newValue: string }[] | null;
    last_approved_at?: string | null;
    creator_refund_terms?: string | null;
  };
  initialImages: UIImage[];
}

export default function VendorProductEditForm({ product, initialImages }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [category, setCategory] = useState(product.category ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [features, setFeatures] = useState((product.features ?? []).join("\n"));
  const [price, setPrice] = useState(
    product.sale_price_cents ? (product.sale_price_cents / 100).toFixed(2) : ""
  );
  const [regularPrice, setRegularPrice] = useState(
    product.regular_price_cents ? (product.regular_price_cents / 100).toFixed(2) : ""
  );
  const [isPlrAvailable, setIsPlrAvailable] = useState(product.is_plr_available ?? false);
  const [creatorRefundTerms, setCreatorRefundTerms] = useState(product.creator_refund_terms ?? "");
  const [plrPrice, setPlrPrice] = useState(
    product.plr_price_cents ? (product.plr_price_cents / 100).toFixed(2) : ""
  );
  const [isActive, setIsActive] = useState(product.is_active);
  const [images, setImages] = useState<UIImage[]>(initialImages);
  const [attrs, setAttrs] = useState<AttributeState>(() =>
    product.attributes ? attrsFromRecord(product.attributes) : {
      promptsIncluded: "", worksWith: [], license: "", format: "", lastUpdated: "",
      version: "", instantDownload: "", support: "", difficultyLevel: "",
      builtWith: "", requirements: "", aiModel: "", custom: [],
    }
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  async function buildFinalImages(): Promise<{ url: string; is_primary: boolean; display_order: number }[]> {
    const result: { url: string; is_primary: boolean; display_order: number }[] = [];
    for (const img of images) {
      if (!img.file) {
        result.push({ url: img.url, is_primary: img.is_primary, display_order: img.display_order });
        continue;
      }

      const presignRes = await fetch("/api/vendor/images/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          fileName: img.file.name,
          contentType: img.file.type,
        }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to get image upload URL");
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": img.file.type || "image/jpeg" },
        body: img.file,
      });
      if (!uploadRes.ok) throw new Error("Image upload to storage failed");

      result.push({ url: publicUrl, is_primary: img.is_primary, display_order: img.display_order });
    }
    return result;
  }

  async function getVideoUrl(): Promise<string | null> {
    if (!videoFile) return product.video_url;

    const presignRes = await fetch("/api/vendor/upload-video/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, fileName: videoFile.name }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to get upload URL");
    }
    const { uploadUrl, publicUrl } = await presignRes.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: videoFile,
    });
    if (!uploadRes.ok) throw new Error("Video upload to storage failed");

    return publicUrl;
  }

  async function getDownloadUrl(): Promise<string | null> {
    if (!downloadFile) return product.download_url;

    const presignRes = await fetch("/api/vendor/upload-file/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, fileName: downloadFile.name }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to get upload URL");
    }
    const { token: uploadToken, path } = await presignRes.json();

    const { error: uploadError } = await supabase.storage
      .from("product-files")
      .uploadToSignedUrl(path, uploadToken, downloadFile);
    if (uploadError) throw new Error(uploadError.message ?? "File upload to storage failed");

    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      // Build the submission from scratch, including ONLY fields that
      // actually differ from the original — never send an unchanged field
      // just because the form happens to hold its current value. This is
      // what keeps the admin's review screen honest about what really
      // changed, and keeps pending_changes free of noise.
      const payload: Record<string, unknown> = {};

      if (name !== product.name) payload.name = name;
      if (slug !== product.slug) payload.slug = slug;
      if (category !== (product.category ?? "")) payload.category = category;
      if (description !== (product.description ?? "")) payload.description = description;

      const newFeatures = features.split("\n").map((f) => f.trim()).filter(Boolean);
      if (JSON.stringify(newFeatures) !== JSON.stringify(product.features ?? [])) {
        payload.features = newFeatures;
      }

      const newSalePrice = price ? Math.round(parseFloat(price) * 100) : null;
      if (newSalePrice !== product.sale_price_cents) payload.sale_price_cents = newSalePrice;

      const newRegularPrice = regularPrice ? Math.round(parseFloat(regularPrice) * 100) : null;
      if (newRegularPrice !== product.regular_price_cents) payload.regular_price_cents = newRegularPrice;

      if (isActive !== product.is_active) payload.is_active = isActive;
      if (isPlrAvailable !== (product.is_plr_available ?? false)) payload.is_plr_available = isPlrAvailable;

      const newPlrPrice = isPlrAvailable && plrPrice ? Math.round(parseFloat(plrPrice) * 100) : null;
      if (newPlrPrice !== product.plr_price_cents) payload.plr_price_cents = newPlrPrice;

      const newAttributes = buildAttributesPayload(attrs);
      if (JSON.stringify(newAttributes) !== JSON.stringify(product.attributes ?? {})) {
        payload.attributes = newAttributes;
      }

      const newRefundTerms = creatorRefundTerms.trim() || null;
      if (newRefundTerms !== (product.creator_refund_terms ?? null)) {
        payload.creator_refund_terms = newRefundTerms;
      }

      // Upload any new files to storage first — this does NOT make them
      // live. Nothing becomes visible on the site until an admin approves
      // the submission this builds up. Only touched at all if the vendor
      // actually selected something new.
      setUploading(true);
      if (videoFile) {
        payload.video_url = await getVideoUrl();
      }
      if (downloadFile) {
        payload.download_url = await getDownloadUrl();
      }

      const finalImages = await buildFinalImages();
      const originalImages = initialImages.map((img) => ({
        url: img.url,
        is_primary: img.is_primary,
        display_order: img.display_order,
      }));
      if (JSON.stringify(finalImages) !== JSON.stringify(originalImages)) {
        payload.images = finalImages;
      }
      setUploading(false);

      if (Object.keys(payload).length === 0) {
        setToast({ msg: "No changes to submit.", ok: false });
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save");
      }

      setToast({ msg: "Submitted for admin review!", ok: true });
      setTimeout(() => router.push("/vendor/products"), 1200);
    } catch (err) {
      setToast({ msg: (err as Error).message, ok: false });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid var(--ink-soft)",
    fontSize: "14px",
    background: "transparent",
    color: "var(--ink)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--ink-faded)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <h1 className="display" style={{ fontSize: "26px", color: "var(--ink)" }}>
        Edit Product
      </h1>

      {product.review_status === "pending" && (
        <div style={{ background: "#fff8e1", border: "1px solid #f0d878", padding: "14px 18px", fontSize: "13px", color: "#6b5a1a" }}>
          Your last submission is awaiting admin review. The live listing still shows your
          previously approved version until it's reviewed.
        </div>
      )}
      {product.review_status === "rejected" && (
        <div style={{ background: "#fdecea", border: "1px solid #e5a19a", padding: "14px 18px", fontSize: "13px", color: "#7a2e26" }}>
          <strong>Your last submission was not approved.</strong>
          {product.review_rejected_reason && <> Reason: {product.review_rejected_reason}</>}
        </div>
      )}
      {product.last_approved_changes && product.last_approved_changes.length > 0 && (
        <div style={{ background: "#eaf6ec", border: "1px solid #9dd6a8", padding: "14px 18px", fontSize: "13px", color: "#1e5e2f" }}>
          <strong>
            The following {product.last_approved_changes.length === 1 ? "change is" : "changes are"} now live
            {product.last_approved_at && <> (approved {new Date(product.last_approved_at).toLocaleString()})</>}:
          </strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
            {product.last_approved_changes.map((c, i) => (
              <li key={i}>
                {c.label}: {c.oldValue} → {c.newValue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label style={labelStyle}>Slug</label>
        <input style={inputStyle} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <p style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "4px" }}>
          This controls the product's URL — changing it breaks any existing links or bookmarks to this page.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Category</label>
        <input style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Voice Agents" />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Features — one per line</label>
        <textarea
          style={{ ...inputStyle, minHeight: "90px", resize: "vertical", fontFamily: "monospace", fontSize: "13px" }}
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Price ($)</label>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Regular Price ($) — optional</label>
        <input
          style={inputStyle}
          type="number"
          step="0.01"
          min="0"
          value={regularPrice}
          onChange={(e) => setRegularPrice(e.target.value)}
          placeholder={'Shown as a strikethrough "was" price'}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>Active (visible on the site)</span>
      </label>

      {/* PLR Licensing */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <div style={{ ...labelStyle, marginBottom: "12px" }}>PLR Licensing</div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: isPlrAvailable ? "16px" : 0 }}>
          <input type="checkbox" checked={isPlrAvailable} onChange={(e) => setIsPlrAvailable(e.target.checked)} />
          <span style={{ fontSize: "13px", color: "var(--ink-faded)" }}>Offer a PLR (resale) license for this product</span>
        </label>
        {isPlrAvailable && (
          <div>
            <label style={labelStyle}>PLR Price ($)</label>
            <input
              style={inputStyle}
              type="number"
              step="0.01"
              min="0"
              value={plrPrice}
              onChange={(e) => setPlrPrice(e.target.value)}
            />
            <p style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "4px" }}>
              This sets the displayed price. The site owner still needs to confirm a matching Stripe price is set up before this goes live for real checkout.
            </p>
          </div>
        )}
      </div>

      {/* Creator Refund Terms */}
      <div>
        <label style={labelStyle}>Refund Terms (optional)</label>
        <textarea
          style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
          value={creatorRefundTerms}
          onChange={(e) => setCreatorRefundTerms(e.target.value)}
          placeholder="e.g. 14-day satisfaction guarantee, free revisions on request…"
        />
        <p style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "4px" }}>
          Optional. Shown to buyers on the product page and at checkout, alongside the
          platform&apos;s standard{" "}
          <a href="/refund-buyer-protection" target="_blank" rel="noreferrer" style={{ color: "var(--ink)" }}>
            Refund &amp; Buyer Protection Policy
          </a>
          . This can only add to what buyers are offered, never take anything away.
        </p>
      </div>

      {/* Product Images */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <div style={{ ...labelStyle, marginBottom: "12px" }}>Product Images</div>
        <ImageUploader images={images} onChange={setImages} uploading={uploading} />
      </div>

      {/* Download file */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <label style={labelStyle}>Download File</label>
        {product.download_url && !downloadFile && (
          <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
            Current file on record
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
          <input type="file" style={{ display: "none" }} onChange={(e) => setDownloadFile(e.target.files?.[0] ?? null)} />
          {downloadFile
            ? <><strong style={{ color: "var(--ink)" }}>{downloadFile.name}</strong> — {(downloadFile.size / 1024 / 1024).toFixed(2)} MB</>
            : <>{product.download_url ? "Replace file…" : "Choose file to upload…"}</>
          }
        </label>
      </div>

      {/* Video */}
      <div>
        <label style={labelStyle}>Preview Video (.mp4)</label>
        {product.video_url && !videoFile && (
          <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginBottom: "10px", padding: "8px 12px", background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
            Current video on record
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px dashed var(--ink-soft)", cursor: "pointer", fontSize: "13px", color: "var(--ink-faded)" }}>
          <input type="file" accept="video/mp4" style={{ display: "none" }} onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
          {videoFile
            ? <><strong style={{ color: "var(--ink)" }}>{videoFile.name}</strong> — {(videoFile.size / 1024 / 1024).toFixed(2)} MB</>
            : <>{product.video_url ? "Replace video…" : "Choose .mp4 to upload…"}</>
          }
        </label>
      </div>

      {/* Attributes */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <div style={{ ...labelStyle, marginBottom: "16px" }}>Product Attributes</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Prompts Included</label>
            <input style={inputStyle} type="number" min="0" value={attrs.promptsIncluded} onChange={(e) => setAttrs((a) => ({ ...a, promptsIncluded: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>License</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.license} onChange={(e) => setAttrs((a) => ({ ...a, license: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="Personal Use">Personal Use</option>
              <option value="Commercial Use">Commercial Use</option>
              <option value="Extended Commercial">Extended Commercial</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Format</label>
            <input style={inputStyle} value={attrs.format} onChange={(e) => setAttrs((a) => ({ ...a, format: e.target.value }))} placeholder="e.g. PDF + TXT" />
          </div>
          <div>
            <label style={labelStyle}>Version</label>
            <input style={inputStyle} value={attrs.version} onChange={(e) => setAttrs((a) => ({ ...a, version: e.target.value }))} placeholder="e.g. 1.0" />
          </div>
          <div>
            <label style={labelStyle}>Difficulty Level</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.difficultyLevel} onChange={(e) => setAttrs((a) => ({ ...a, difficultyLevel: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>AI Model</label>
            <input style={inputStyle} value={attrs.aiModel} onChange={(e) => setAttrs((a) => ({ ...a, aiModel: e.target.value }))} placeholder="e.g. GPT-4, Claude" />
          </div>
          <div>
            <label style={labelStyle}>Last Updated</label>
            <input style={inputStyle} type="date" value={attrs.lastUpdated} onChange={(e) => setAttrs((a) => ({ ...a, lastUpdated: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Instant Download</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.instantDownload} onChange={(e) => setAttrs((a) => ({ ...a, instantDownload: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Support</label>
            <select style={{ ...inputStyle, appearance: "auto" }} value={attrs.support} onChange={(e) => setAttrs((a) => ({ ...a, support: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="Email">Email</option>
              <option value="Community">Community</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Built With</label>
            <input style={inputStyle} value={attrs.builtWith} onChange={(e) => setAttrs((a) => ({ ...a, builtWith: e.target.value }))} placeholder="e.g. Notion" />
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Requirements</label>
          <input style={inputStyle} value={attrs.requirements} onChange={(e) => setAttrs((a) => ({ ...a, requirements: e.target.value }))} placeholder="e.g. Node.js 18+, Python 3" />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Works With</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {WORKS_WITH_OPTIONS.map((opt) => {
              const checked = attrs.worksWith.includes(opt);
              return (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: `1px solid ${checked ? "var(--ink)" : "var(--ink-soft)"}`, background: checked ? "var(--ink)" : "transparent", cursor: "pointer" }}>
                  <input type="checkbox" checked={checked} onChange={() => setAttrs((a) => ({ ...a, worksWith: checked ? a.worksWith.filter((w) => w !== opt) : [...a.worksWith, opt] }))} style={{ display: "none" }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: checked ? "var(--bg)" : "var(--ink-faded)" }}>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Custom Attributes</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {attrs.custom.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: "8px" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Key"
                  value={c.key}
                  onChange={(e) => setAttrs((a) => ({
                    ...a,
                    custom: a.custom.map((x, xi) => xi === i ? { ...x, key: e.target.value } : x),
                  }))}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Value"
                  value={c.value}
                  onChange={(e) => setAttrs((a) => ({
                    ...a,
                    custom: a.custom.map((x, xi) => xi === i ? { ...x, value: e.target.value } : x),
                  }))}
                />
                <button
                  type="button"
                  onClick={() => setAttrs((a) => ({ ...a, custom: a.custom.filter((_, xi) => xi !== i) }))}
                  style={{ padding: "0 14px", border: "1px solid var(--ink-soft)", background: "transparent", cursor: "pointer", color: "var(--ink-faded)" }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAttrs((a) => ({ ...a, custom: [...a.custom, { key: "", value: "" }] }))}
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: "flex-start" }}
            >
              + Add Custom Attribute
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <p style={{ fontSize: "13px", color: toast.ok ? "#166534" : "#e53e3e", margin: 0 }}>
          {toast.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn btn-primary"
        style={{ opacity: saving ? 0.6 : 1, alignSelf: "flex-start" }}
      >
        {saving ? (uploading ? "Uploading…" : "Submitting…") : "Submit for Review"}
      </button>
    </form>
  );
}
'@
Set-Content -LiteralPath "src\app\vendor\(protected)\products\[id]\edit\EditForm.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\vendor\(protected)\products\[id]\edit\EditForm.tsx" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, video_url, download_url, attributes, creator_refund_terms, vendor_id, pending_changes, review_status, review_submitted_at"
    )
    .eq("review_status", "pending")
    .order("review_submitted_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vendorIds = [...new Set((products ?? []).map((p) => p.vendor_id).filter(Boolean))];
  let vendorMap: Record<string, string> = {};
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabaseAdmin
      .from("vendor_profiles")
      .select("id, display_name")
      .in("id", vendorIds);
    vendorMap = Object.fromEntries((vendors ?? []).map((v) => [v.id, v.display_name]));
  }

  // Current live images, for comparing against each submission's proposed set
  const productIds = (products ?? []).map((p) => p.id);
  let currentImagesByProduct: Record<string, { url: string; is_primary: boolean }[]> = {};
  if (productIds.length > 0) {
    const { data: images } = await supabaseAdmin
      .from("product_images")
      .select("product_id, url, is_primary, display_order")
      .in("product_id", productIds)
      .order("display_order", { ascending: true });
    currentImagesByProduct = (images ?? []).reduce((acc, img) => {
      (acc[img.product_id] ??= []).push({ url: img.url, is_primary: img.is_primary });
      return acc;
    }, {} as Record<string, { url: string; is_primary: boolean }[]>);
  }

  const enriched = (products ?? []).map((p) => ({
    ...p,
    vendor_name: p.vendor_id ? vendorMap[p.vendor_id] ?? "Unknown vendor" : "—",
    current_images: currentImagesByProduct[p.id] ?? [],
  }));

  return NextResponse.json({ products: enriched });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\pending\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\admin\products\pending\route.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized, getAdminUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { syncStripePrice } from "@/lib/stripe-price-sync";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_CDN = process.env.R2_CDN_URL!;

/** Deletes an orphaned R2 object by its public URL. Safe no-op if the URL
 * doesn't actually live under our own CDN, or if deletion fails for any
 * reason — an orphaned file is just storage bloat, never worth blocking
 * the actual review decision over. */
async function deleteR2ObjectByUrl(url: string): Promise<void> {
  if (!url || !url.startsWith(R2_CDN)) return;
  const key = url.slice(R2_CDN.length).replace(/^\/+/, "");
  if (!key) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch (err) {
    console.error("[approve] Failed to delete orphaned R2 object", key, err);
  }
}

type Ctx = { params: Promise<{ id: string }> };

const FIELD_LABELS: Record<string, string> = {
  name: "Name", slug: "Slug", category: "Category", description: "Description",
  features: "Features", sale_price_cents: "Sale Price", regular_price_cents: "Regular Price",
  plr_price_cents: "PLR Price", is_active: "Active", is_plr_available: "PLR Available",
  video_url: "Preview Video", download_url: "Download File", images: "Images",
  creator_refund_terms: "Creator Refund Terms",
};

const ATTR_LABELS: Record<string, string> = {
  promptsIncluded: "Prompts Included", worksWith: "Works With", license: "License",
  format: "Format", lastUpdated: "Last Updated", version: "Version",
  instantDownload: "Instant Download", support: "Support", difficultyLevel: "Difficulty Level",
  builtWith: "Built With", requirements: "Requirements", aiModel: "AI Model",
};

function formatPrice(cents: unknown): string {
  return typeof cents === "number" ? `$${(cents / 100).toFixed(2)}` : "—";
}
function formatBool(v: unknown): string {
  return v ? "Yes" : "No";
}
function formatAttrValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
interface ApprovedSummaryItem { label: string; oldValue: string; newValue: string }

function labelForPath(path: string): string {
  if (path.startsWith("attributes.")) {
    const key = path.slice("attributes.".length);
    return ATTR_LABELS[key] ?? key;
  }
  return FIELD_LABELS[path] ?? path;
}

/**
 * Applies a vendor submission field by field. Each entry in pending_changes
 * (and each individual key inside pending_changes.attributes) is its own
 * independently approvable "path" — e.g. "sale_price_cents", "images", or
 * "attributes.license". Only paths listed in approvedPaths actually get
 * written; anything else in the submission is discarded. This is what lets
 * an admin approve 3 of 5 requested changes and decline the other 2 in one
 * action, rather than an all-or-nothing decision.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  let body: { approvedPaths?: string[]; rejectedPaths?: string[]; reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const approvedPaths = new Set(body.approvedPaths ?? []);
  const rejectedPaths = body.rejectedPaths ?? [];

  const { data: product, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.review_status !== "pending" || !product.pending_changes) {
    return NextResponse.json(
      { error: "This product has no pending submission to review" },
      { status: 400 }
    );
  }

  const pending = product.pending_changes as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  const approvedSummary: ApprovedSummaryItem[] = [];

  // Plain fields — applied only if their exact path was approved
  const plainFields = [
    "name", "slug", "category", "description", "features",
    "is_active", "is_plr_available", "video_url", "download_url", "creator_refund_terms",
  ];
  for (const field of plainFields) {
    if (field in pending && approvedPaths.has(field)) {
      updates[field] = pending[field];
      if (field === "video_url") {
        approvedSummary.push({ label: "Preview Video", oldValue: product.video_url ? "Had a video" : "No video", newValue: "New video is now live" });
      } else if (field === "download_url") {
        approvedSummary.push({ label: "Download File", oldValue: product.download_url ? "Had a file" : "No file", newValue: "New file is now live" });
      } else if (field === "is_active" || field === "is_plr_available") {
        approvedSummary.push({ label: FIELD_LABELS[field], oldValue: formatBool((product as Record<string, unknown>)[field]), newValue: formatBool(pending[field]) });
      } else if (field === "features") {
        approvedSummary.push({ label: "Features", oldValue: ((product.features as string[]) ?? []).join(", ") || "—", newValue: ((pending.features as string[]) ?? []).join(", ") || "—" });
      } else {
        approvedSummary.push({ label: FIELD_LABELS[field] ?? field, oldValue: String((product as Record<string, unknown>)[field] ?? "—"), newValue: String(pending[field] ?? "—") });
      }
    }
  }

  // Attributes — merge ONLY the approved individual keys on top of the
  // current live attributes. A rejected attribute key simply keeps its
  // existing value, while an approved one nearby still goes through.
  if ("attributes" in pending && pending.attributes && typeof pending.attributes === "object") {
    const pendingAttrs = pending.attributes as Record<string, unknown>;
    const currentAttrs = (product.attributes as Record<string, unknown>) ?? {};
    const mergedAttrs = { ...currentAttrs };
    let anyAttrApproved = false;
    for (const key of Object.keys(pendingAttrs)) {
      if (approvedPaths.has(`attributes.${key}`)) {
        mergedAttrs[key] = pendingAttrs[key];
        anyAttrApproved = true;
        approvedSummary.push({
          label: ATTR_LABELS[key] ?? key,
          oldValue: formatAttrValue(currentAttrs[key]),
          newValue: formatAttrValue(pendingAttrs[key]),
        });
      }
    }
    if (anyAttrApproved) updates.attributes = mergedAttrs;
  }

  // Price fields — Stripe sync only runs for a field that was actually approved
  try {
    if ("sale_price_cents" in pending && approvedPaths.has("sale_price_cents")) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.sale_price_cents as number | null,
        currentPriceCents: product.sale_price_cents,
        currentStripePriceId: product.sale_stripe_price_id,
      });
      updates.sale_price_cents = synced.priceCents;
      updates.sale_stripe_price_id = synced.stripePriceId;
      approvedSummary.push({ label: "Sale Price", oldValue: formatPrice(product.sale_price_cents), newValue: formatPrice(synced.priceCents) });
    }
    if ("regular_price_cents" in pending && approvedPaths.has("regular_price_cents")) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.regular_price_cents as number | null,
        currentPriceCents: product.regular_price_cents,
        currentStripePriceId: product.regular_stripe_price_id,
      });
      updates.regular_price_cents = synced.priceCents;
      updates.regular_stripe_price_id = synced.stripePriceId;
      approvedSummary.push({ label: "Regular Price", oldValue: formatPrice(product.regular_price_cents), newValue: formatPrice(synced.priceCents) });
    }
    if ("plr_price_cents" in pending && approvedPaths.has("plr_price_cents")) {
      const synced = await syncStripePrice({
        productId: id,
        newPriceCents: pending.plr_price_cents as number | null,
        currentPriceCents: product.plr_price_cents,
        currentStripePriceId: product.plr_stripe_price_id,
      });
      updates.plr_price_cents = synced.priceCents;
      updates.plr_stripe_price_id = synced.stripePriceId;
      approvedSummary.push({ label: "PLR Price", oldValue: formatPrice(product.plr_price_cents), newValue: formatPrice(synced.priceCents) });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to sync price with Stripe: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 502 }
    );
  }

  // Images — one all-or-nothing line item, applied only if "images" itself was approved
  if ("images" in pending && approvedPaths.has("images")) {
    const images = (pending.images as { url: string; is_primary?: boolean; display_order?: number }[]) ?? [];
    await supabaseAdmin.from("product_images").delete().eq("product_id", id);
    if (images.length > 0) {
      await supabaseAdmin.from("product_images").insert(
        images.map((img, i) => ({
          product_id: id,
          url: img.url,
          is_primary: !!img.is_primary,
          display_order: img.display_order ?? i,
        }))
      );
      const primary = images.find((img) => img.is_primary) ?? images[0];
      updates.thumbnail_url = primary.url;
    } else {
      updates.thumbnail_url = null;
    }
    approvedSummary.push({ label: "Images", oldValue: "Previous images", newValue: `${images.length} image(s) now live` });
  }

  const admin = await getAdminUser(req);

  // Clean up files that were already uploaded to storage but got rejected —
  // they'll never be referenced by anything now, so delete them instead of
  // leaving orphaned storage bloat behind.
  if (rejectedPaths.includes("video_url") && typeof pending.video_url === "string") {
    await deleteR2ObjectByUrl(pending.video_url);
  }
  if (rejectedPaths.includes("download_url") && typeof pending.download_url === "string") {
    try {
      await supabaseAdmin.storage.from("product-files").remove([pending.download_url as string]);
    } catch (err) {
      console.error("[approve] Failed to delete orphaned download file", err);
    }
  }
  if (rejectedPaths.includes("images")) {
    const rejectedImages = (pending.images as { url: string }[]) ?? [];
    const { data: liveImages } = await supabaseAdmin.from("product_images").select("url").eq("product_id", id);
    const liveUrls = new Set((liveImages ?? []).map((r) => r.url));
    // Only delete images that aren't still part of the current live set —
    // an image the vendor kept unchanged should never be touched here.
    for (const img of rejectedImages) {
      if (img.url && !liveUrls.has(img.url)) {
        await deleteR2ObjectByUrl(img.url);
      }
    }
  }

  updates.pending_changes = null;
  updates.review_status = rejectedPaths.length > 0 ? "rejected" : "none";
  updates.review_rejected_reason =
    rejectedPaths.length > 0 ? (body.reason || `Not approved: ${rejectedPaths.join(", ")}`) : null;
  updates.reviewed_by = admin?.sub ?? null;
  updates.reviewed_at = new Date().toISOString();

  if (approvedSummary.length > 0) {
    updates.last_approved_changes = approvedSummary;
    updates.last_approved_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Write a permanent record of this decision, independent of the
  // vendor-facing banner fields above, which get cleared once viewed.
  if (approvedSummary.length > 0 || rejectedPaths.length > 0) {
    await supabaseAdmin.from("product_review_log").insert({
      product_id: id,
      vendor_id: product.vendor_id,
      approved_changes: approvedSummary.length > 0 ? approvedSummary : null,
      rejected_reason: rejectedPaths.length > 0 ? (updates.review_rejected_reason as string) : null,
      rejected_fields: rejectedPaths.length > 0 ? rejectedPaths.map(labelForPath) : null,
      reviewed_by: admin?.sub ?? null,
    });
  }

  return NextResponse.json({ product: updated });
}
'@
Set-Content -LiteralPath "src\app\api\admin\products\[id]\approve\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\admin\products\[id]\approve\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useState, useEffect, useContext } from "react";
import AdminShell from "../AdminShell";
import { AdminContext } from "../AdminContext";

interface PendingProduct {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  features: string[] | null;
  sale_price_cents: number | null;
  regular_price_cents: number | null;
  is_plr_available: boolean | null;
  plr_price_cents: number | null;
  is_active: boolean;
  video_url: string | null;
  download_url: string | null;
  attributes: Record<string, unknown> | null;
  creator_refund_terms: string | null;
  vendor_name: string;
  pending_changes: Record<string, unknown>;
  review_submitted_at: string;
  current_images: { url: string; is_primary: boolean }[];
}

function formatPrice(cents: unknown): string {
  return typeof cents === "number" ? `$${(cents / 100).toFixed(2)}` : "—";
}

function formatBool(v: unknown): string {
  return v ? "Yes" : "No";
}

const ATTR_LABELS: Record<string, string> = {
  promptsIncluded: "Prompts Included",
  worksWith: "Works With",
  license: "License",
  format: "Format",
  lastUpdated: "Last Updated",
  version: "Version",
  instantDownload: "Instant Download",
  support: "Support",
  difficultyLevel: "Difficulty Level",
  builtWith: "Built With",
  requirements: "Requirements",
  aiModel: "AI Model",
};

function formatAttrValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

interface FieldDiff {
  path: string;
  label: string;
  oldValue: string;
  newValue: string;
}

function buildAttributeDiffs(current: Record<string, unknown> | null, pending: Record<string, unknown>): FieldDiff[] {
  const cur = current ?? {};
  const diffs: FieldDiff[] = [];
  const keys = new Set([...Object.keys(cur), ...Object.keys(pending)]);
  for (const key of keys) {
    const oldStr = formatAttrValue(cur[key]);
    const newStr = formatAttrValue(pending[key]);
    if (oldStr !== newStr) {
      diffs.push({ path: `attributes.${key}`, label: ATTR_LABELS[key] ?? key, oldValue: oldStr, newValue: newStr });
    }
  }
  return diffs;
}

/** Every returned diff is its own independently approvable line item — the
 * "path" is what gets sent back to the server to say exactly which of these
 * the admin decided to approve versus reject. */
function buildDiffs(p: PendingProduct): FieldDiff[] {
  const pending = p.pending_changes || {};
  const diffs: FieldDiff[] = [];

  const push = (path: string, label: string, oldValue: string, newValue: string) => {
    if (oldValue !== newValue) diffs.push({ path, label, oldValue, newValue });
  };

  if ("name" in pending) push("name", "Name", p.name ?? "—", String(pending.name ?? "—"));
  if ("slug" in pending) push("slug", "Slug", p.slug ?? "—", String(pending.slug ?? "—"));
  if ("category" in pending) push("category", "Category", p.category ?? "—", String(pending.category ?? "—"));
  if ("description" in pending) push("description", "Description", p.description ?? "—", String(pending.description ?? "—"));
  if ("features" in pending) {
    push("features", "Features", (p.features ?? []).join(", ") || "—", ((pending.features as string[]) ?? []).join(", ") || "—");
  }
  if ("sale_price_cents" in pending) push("sale_price_cents", "Sale Price", formatPrice(p.sale_price_cents), formatPrice(pending.sale_price_cents));
  if ("regular_price_cents" in pending) push("regular_price_cents", "Regular Price", formatPrice(p.regular_price_cents), formatPrice(pending.regular_price_cents));
  if ("plr_price_cents" in pending) push("plr_price_cents", "PLR Price", formatPrice(p.plr_price_cents), formatPrice(pending.plr_price_cents));
  if ("is_active" in pending) push("is_active", "Active", formatBool(p.is_active), formatBool(pending.is_active));
  if ("is_plr_available" in pending) push("is_plr_available", "PLR Available", formatBool(p.is_plr_available), formatBool(pending.is_plr_available));

  if ("video_url" in pending && pending.video_url !== p.video_url) {
    push("video_url", "Preview Video", p.video_url ? "Has a video" : "No video", "New video uploaded");
  }
  if ("download_url" in pending && pending.download_url !== p.download_url) {
    push("download_url", "Download File", p.download_url ? "Has a file" : "No file", "New file uploaded");
  }
  if ("creator_refund_terms" in pending) {
    push(
      "creator_refund_terms", "Creator Refund Terms",
      p.creator_refund_terms || "None set",
      (pending.creator_refund_terms as string) || "None set"
    );
  }

  if ("attributes" in pending && pending.attributes && typeof pending.attributes === "object") {
    diffs.push(...buildAttributeDiffs(p.attributes, pending.attributes as Record<string, unknown>));
  }

  return diffs;
}

function imagesChanged(p: PendingProduct): boolean {
  const pending = p.pending_changes || {};
  if (!("images" in pending)) return false;
  const proposed = (pending.images as { url: string; is_primary?: boolean }[]) ?? [];
  const current = p.current_images ?? [];
  if (proposed.length !== current.length) return true;
  for (let i = 0; i < proposed.length; i++) {
    if (proposed[i].url !== current[i].url || !!proposed[i].is_primary !== !!current[i].is_primary) return true;
  }
  return false;
}

export default function PendingReviewsPage() {
  return (
    <AdminShell title="Pending Reviews">
      <PendingReviewsContent />
    </AdminShell>
  );
}

function PendingReviewsContent() {
  const { token } = useContext(AdminContext);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/pending", {
        headers: { "x-admin-key": token ?? "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setProducts(data.products ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "24px", maxWidth: "640px" }}>
        Vendor edits wait here until reviewed. Uncheck anything you don&apos;t want to approve —
        everything checked gets applied, everything unchecked gets declined, in one action. The
        live site keeps showing the previously approved version until you act.
      </p>

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
      {loading && <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Loading…</p>}
      {!loading && !error && products.length === 0 && (
        <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>Nothing pending review right now.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {products.map((p) => (
          <PendingProductCard key={p.id} product={p} token={token ?? ""} onDone={load} />
        ))}
      </div>
    </>
  );
}

function PendingProductCard({
  product: p,
  token,
  onDone,
}: {
  product: PendingProduct;
  token: string;
  onDone: () => void;
}) {
  const diffs = buildDiffs(p);
  const hasImageChange = imagesChanged(p);
  const proposedImages = (p.pending_changes?.images as { url: string; is_primary?: boolean }[]) ?? [];

  const allPaths = [...diffs.map((d) => d.path), ...(hasImageChange ? ["images"] : [])];

  const [checked, setChecked] = useState<Set<string>>(new Set(allPaths));
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  function toggle(path: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function handleApply() {
    setWorking(true);
    setError("");
    try {
      const approvedPaths = allPaths.filter((path) => checked.has(path));
      const rejectedPaths = allPaths.filter((path) => !checked.has(path));

      const res = await fetch(`/api/admin/products/${p.id}/approve`, {
        method: "POST",
        headers: { "x-admin-key": token, "Content-Type": "application/json" },
        body: JSON.stringify({ approvedPaths, rejectedPaths, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to apply decisions");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  const anyUnchecked = allPaths.some((path) => !checked.has(path));

  return (
    <div style={{ border: "1px solid var(--line)", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>{p.name}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
            Vendor: {p.vendor_name} · Submitted {new Date(p.review_submitted_at).toLocaleString()}
          </div>
        </div>
        <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--ink-faded)" }}>
          View live listing ↗
        </a>
      </div>

      {diffs.length === 0 && !hasImageChange && (
        <p style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "16px" }}>No visible field changes detected.</p>
      )}

      {diffs.length > 0 && (
        <div style={{ border: "1px solid var(--line)", marginBottom: hasImageChange ? "16px" : "16px" }}>
          {diffs.map((d, i) => (
            <label
              key={d.path}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 130px 1fr 24px 1fr",
                gap: "12px",
                alignItems: "start",
                padding: "10px 14px",
                borderBottom: i < diffs.length - 1 || hasImageChange ? "1px solid var(--line)" : "none",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked.has(d.path)}
                onChange={() => toggle(d.path)}
                style={{ marginTop: "2px" }}
              />
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{d.label}</div>
              <div style={{ color: "var(--ink-mute)", textDecoration: "line-through" }}>{d.oldValue}</div>
              <div style={{ color: "var(--ink-mute)", textAlign: "center" }}>→</div>
              <div style={{ color: checked.has(d.path) ? "#166534" : "var(--ink-mute)", fontWeight: 600 }}>{d.newValue}</div>
            </label>
          ))}

          {hasImageChange && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checked.has("images")}
                onChange={() => toggle("images")}
                style={{ marginTop: "2px" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink)", marginBottom: "8px" }}>Images</div>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--ink-mute)", marginBottom: "6px" }}>Current ({p.current_images.length})</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {p.current_images.length === 0 && <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>None</span>}
                      {p.current_images.map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={img.url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", border: img.is_primary ? "2px solid var(--ink)" : "1px solid var(--line)" }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#166534", marginBottom: "6px" }}>Proposed ({proposedImages.length})</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {proposedImages.length === 0 && <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>None</span>}
                      {proposedImages.map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={img.url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", border: img.is_primary ? "2px solid #166534" : "1px solid var(--line)" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </label>
          )}
        </div>
      )}

      {anyUnchecked && (
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for declining the unchecked item(s) — shown to the vendor"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--ink-soft)", fontSize: "13px", marginBottom: "12px", boxSizing: "border-box" }}
        />
      )}

      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      {(diffs.length > 0 || hasImageChange) && (
        <button onClick={handleApply} disabled={working} className="btn btn-primary btn-sm">
          {working ? "Applying…" : "Apply Decisions"}
        </button>
      )}
    </div>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\pending-reviews\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\pending-reviews\page.tsx" -ForegroundColor Green

Write-Host "`nAll 8 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan