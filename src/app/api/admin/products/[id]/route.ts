import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { syncStripePrice } from "@/lib/stripe-price-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!isAdminAuthed(req)) return unauthorized();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!isAdminAuthed(req)) return unauthorized();
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Grab old slug + current price/Stripe-ID state before overwriting
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("slug, sale_price_cents, sale_stripe_price_id, regular_price_cents, regular_stripe_price_id, plr_price_cents, plr_stripe_price_id")
    .eq("id", id)
    .single();

  const oldSlug = existing?.slug as string | undefined;
  const newSlug = body.slug as string | undefined;

  // If the slug changed, store the old one so the product page can redirect
  if (oldSlug && newSlug && oldSlug !== newSlug) {
    body.old_slug = oldSlug;
  }

  // Keep each price amount and its Stripe Price ID in sync — whenever a price
  // number is present in the save payload, always derive the Stripe Price ID
  // from it via syncStripePrice() rather than trusting whatever ID (if any)
  // was also submitted in the same request. This closes the gap where the
  // displayed amount and the actual Stripe charge could silently disagree.
  //
  // NOTE: this means manually pasting a different Stripe Price ID into the
  // admin form no longer has any effect by itself — only changing the price
  // number (or clearing it) changes which Stripe Price gets used.
  if (existing) {
    try {
      if (typeof body.sale_price_cents === "number" || body.sale_price_cents === null) {
        const synced = await syncStripePrice({
          productId: id,
          newPriceCents: body.sale_price_cents as number | null,
          currentPriceCents: existing.sale_price_cents,
          currentStripePriceId: existing.sale_stripe_price_id,
        });
        body.sale_price_cents = synced.priceCents;
        body.sale_stripe_price_id = synced.stripePriceId;
      }
      if (typeof body.regular_price_cents === "number" || body.regular_price_cents === null) {
        const synced = await syncStripePrice({
          productId: id,
          newPriceCents: body.regular_price_cents as number | null,
          currentPriceCents: existing.regular_price_cents,
          currentStripePriceId: existing.regular_stripe_price_id,
        });
        body.regular_price_cents = synced.priceCents;
        body.regular_stripe_price_id = synced.stripePriceId;
      }
      if (typeof body.plr_price_cents === "number" || body.plr_price_cents === null) {
        const synced = await syncStripePrice({
          productId: id,
          newPriceCents: body.plr_price_cents as number | null,
          currentPriceCents: existing.plr_price_cents,
          currentStripePriceId: existing.plr_stripe_price_id,
        });
        body.plr_price_cents = synced.priceCents;
        body.plr_stripe_price_id = synced.stripePriceId;
      }
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to sync price with Stripe: ${err instanceof Error ? err.message : "Unknown error"}` },
        { status: 502 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bust the cache for both the old and new slug paths
  if (oldSlug) revalidatePath(`/products/${oldSlug}`);
  if (data?.slug) revalidatePath(`/products/${data.slug}`);
  revalidatePath("/products");

  return NextResponse.json({ product: data });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!isAdminAuthed(req)) return unauthorized();
  const { id } = await params;

  // Fetch image records so we can remove files from storage
  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("id, url")
    .eq("product_id", id);

  if (images && images.length > 0) {
    const paths: string[] = [];
    for (const img of images) {
      try {
        const u = new URL(img.url);
        const parts = u.pathname.split("/");
        const bucketIdx = parts.indexOf("product-images");
        if (bucketIdx >= 0) paths.push(parts.slice(bucketIdx + 1).join("/"));
      } catch { /* skip unparseable URL */ }
    }
    if (paths.length > 0) {
      await supabaseAdmin.storage.from("product-images").remove(paths);
    }
    await supabaseAdmin.from("product_images").delete().eq("product_id", id);
  }

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}