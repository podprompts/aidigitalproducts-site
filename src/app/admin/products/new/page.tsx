"use client";

import AdminShell from "../../AdminShell";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <AdminShell title="Add New Product">
      <ProductForm />
    </AdminShell>
  );
}
