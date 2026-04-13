import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
 
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
 
  // Grab old slug before overwriting so we can redirect + revalidate
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("slug")
    .eq("id", id)
    .single();
 
  const oldSlug = existing?.slug as string | undefined;
  const newSlug = body.slug as string | undefined;
 
  // If the slug changed, store the old one so the product page can redirect
  if (oldSlug && newSlug && oldSlug !== newSlug) {
    body.old_slug = oldSlug;
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
