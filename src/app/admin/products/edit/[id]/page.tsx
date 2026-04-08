"use client";

import { use, useEffect, useState } from "react";
import AdminShell from "../../../AdminShell";
import ProductForm, { type AdminProductData } from "@/components/admin/ProductForm";
import { useAdmin, adminHeaders } from "@/app/admin/AdminContext";
import { type UIImage } from "@/components/admin/ImageUploader";

function EditProductContent({ id }: { id: string }) {
  const { token } = useAdmin();
  const [initial,  setInitial]  = useState<Partial<AdminProductData> | null>(null);
  const [images,   setImages]   = useState<UIImage[] | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [productRes, imagesRes] = await Promise.all([
          fetch(`/api/admin/products/${id}?single=1`, { headers: adminHeaders(token) }),
          fetch(`/api/admin/images?productId=${id}`,  { headers: adminHeaders(token) }),
        ]);

        if (!productRes.ok) { setNotFound(true); return; }

        const { product } = await productRes.json();
        const imgs = imagesRes.ok ? (await imagesRes.json()).images ?? [] : [];

        setInitial({
          id:               product.id,
          name:             product.name ?? "",
          slug:             product.slug ?? "",
          description:      product.description ?? "",
          category:         product.category ?? "",
          price:            product.sale_price_cents ? (product.sale_price_cents / 100).toFixed(2) : "",
          regular_price:    product.regular_price_cents ? (product.regular_price_cents / 100).toFixed(2) : "",
          sale_stripe_price_id:    product.sale_stripe_price_id ?? "",
          regular_stripe_price_id: product.regular_stripe_price_id ?? "",
          seller:           product.seller ?? "",
          features:         Array.isArray(product.features) ? product.features.join("\n") : (product.features ?? ""),
          status:           product.status ?? "active",
          is_featured:      product.is_featured ?? false,
          thumbnail_url:    product.thumbnail_url ?? "",
          attributes:       (product.attributes as Record<string, unknown>) ?? {},
        });

        setImages(
          (imgs as { id: string; url: string; is_primary: boolean; display_order: number }[])
            .sort((a, b) => a.display_order - b.display_order)
            .map((img) => ({
              id:            img.id,
              url:           img.url,
              is_primary:    img.is_primary,
              display_order: img.display_order,
            }))
        );
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);

  if (loading) return <p style={{ color: "var(--ink-faded)", fontSize: "14px" }}>Loading product…</p>;
  if (notFound) return <p style={{ color: "#e53e3e", fontSize: "14px" }}>Product not found.</p>;

  return <ProductForm initial={initial!} initialImages={images!} />;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AdminShell title="Edit Product">
      <EditProductContent id={id} />
    </AdminShell>
  );
}
