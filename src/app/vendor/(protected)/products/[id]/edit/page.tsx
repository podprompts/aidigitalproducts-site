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
    .select("id, name, slug, category, description, features, sale_price_cents, regular_price_cents, is_plr_available, plr_price_cents, is_active, vendor_id, video_url, download_url, attributes, thumbnail_url")
    .eq("id", id)
    .single();

  // Ownership check — a vendor can only ever land here for their own product
  if (!product || product.vendor_id !== user.id) notFound();

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("id, url, is_primary, display_order")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  return <VendorProductEditForm product={product} initialImages={images ?? []} />;
}