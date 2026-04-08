"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  status: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

type Filter = "all" | "active" | "coming_soon" | "archived";

function ProductsTable() {
  const { token } = useAdmin();
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<Filter>("all");
  const [search,    setSearch]    = useState("");
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: adminHeaders(token),
      });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setToast("Product deleted.");
      setTimeout(() => setToast(null), 3000);
    } catch {
      alert("Failed to delete product.");
    } finally {
      setDeleting(null);
    }
  }

  const displayed = products
    .filter((p) => filter === "all" || (p.status ?? "active") === filter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (s: string | null) => {
    const label = s === "coming_soon" ? "Coming Soon" : s === "archived" ? "Archived" : "Active";
    const color = s === "archived" ? "#6b7280" : s === "coming_soon" ? "#d97706" : "#16a34a";
    return (
      <span style={{ fontSize: "11px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Toast */}
      {toast && (
        <div style={{ padding: "10px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "13px", fontWeight: 600, borderRadius: "2px" }}>
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm">
          + Add New Product
        </Link>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            fontSize: "13px",
            border: "1px solid var(--ink-soft)",
            background: "transparent",
            color: "var(--ink)",
            fontFamily: "inherit",
            outline: "none",
            width: "220px",
            borderRadius: "2px",
          }}
        />

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "active", "coming_soon", "archived"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                border: `1px solid ${filter === f ? "var(--ink)" : "var(--ink-soft)"}`,
                background: filter === f ? "var(--ink)" : "transparent",
                color: filter === f ? "var(--bg)" : "var(--ink-faded)",
                cursor: "pointer",
                fontFamily: "inherit",
                borderRadius: "2px",
                transition: "all 0.15s",
              }}
            >
              {f === "coming_soon" ? "Coming Soon" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", fontWeight: 600 }}>
        {loading ? "Loading…" : `${displayed.length} product${displayed.length !== 1 ? "s" : ""}`}
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--line)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-alt)" }}>
              {["Image", "Name", "Category", "Price", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--ink-faded)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-mute)", fontSize: "14px" }}>
                  {loading ? "Loading products…" : "No products found."}
                </td>
              </tr>
            ) : (
              displayed.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "1px solid var(--line-soft)",
                    background: i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-soft)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? "var(--bg)" : "var(--bg-alt)")}
                >
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ width: "48px", height: "48px", position: "relative", background: "var(--bg-soft)", flexShrink: 0, overflow: "hidden" }}>
                      {p.thumbnail_url ? (
                        <Image src={p.thumbnail_url} alt={p.name} fill style={{ objectFit: "cover" }} sizes="48px" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "10px", color: "var(--ink-mute)" }}>—</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ink-mute)", marginTop: "2px" }}>{p.slug}</div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--ink-faded)", whiteSpace: "nowrap" }}>{p.category}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>
                    ${p.price?.toFixed(2) ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>{statusBadge(p.status)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Link
                        href={`/admin/products/edit/${p.id}`}
                        style={{ padding: "5px 10px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--ink-soft)", color: "var(--ink)", textDecoration: "none", borderRadius: "2px" }}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        style={{ padding: "5px 10px", fontSize: "12px", fontWeight: 600, border: "1px solid var(--ink-soft)", color: "var(--ink-faded)", textDecoration: "none", borderRadius: "2px" }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deleting === p.id}
                        style={{ padding: "5px 10px", fontSize: "12px", fontWeight: 600, border: "1px solid #fecaca", color: "#dc2626", background: "transparent", cursor: "pointer", fontFamily: "inherit", borderRadius: "2px", opacity: deleting === p.id ? 0.5 : 1 }}
                      >
                        {deleting === p.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminShell title="Products">
      <ProductsTable />
    </AdminShell>
  );
}
