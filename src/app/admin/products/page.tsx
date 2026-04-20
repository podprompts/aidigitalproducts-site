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
  sale_price_cents: number | null;
  status: string | null;
  thumbnail_url: string | null;
  created_at: string;
}
 
type Filter = "all" | "active" | "coming_soon" | "archived";
 
const PAGE_SIZE = 14;
 
function ProductsTable() {
  const { token } = useAdmin();
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<Filter>("all");
  const [search,    setSearch]    = useState("");
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);
  const [page,      setPage]      = useState(1);
 
  useEffect(() => {
    fetch("/api/admin/products", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);
 
  // Reset to page 1 whenever filter or search changes
  useEffect(() => { setPage(1); }, [filter, search]);
 
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
 
  const filtered = products
    .filter((p) => filter === "all" || (p.status ?? "active") === filter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
 
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
 
      {/* Count + pagination info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ fontSize: "12px", color: "var(--ink-mute)", fontWeight: 600 }}>
          {loading ? "Loading…" : `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
        </div>
        {!loading && totalPages > 1 && (
          <div style={{ fontSize: "12px", color: "var(--ink-mute)", fontWeight: 600 }}>
            Page {page} of {totalPages}
          </div>
        )}
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
                        <Image src={p.thumbnail_url} alt={p.name} fill style={{ objectFit: "cover" }} sizes="48px" unoptimized />

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
                    {p.sale_price_cents ? `$${(p.sale_price_cents / 100).toFixed(2)}` : "—"}
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
 
      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", paddingTop: "8px" }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={pagerBtn(page === 1)}
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pagerBtn(page === 1)}
          >
            ‹ Prev
          </button>
 
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              style={{
                ...pagerBtn(false),
                background: n === page ? "var(--ink)" : "transparent",
                color: n === page ? "var(--bg)" : "var(--ink)",
                border: `1px solid ${n === page ? "var(--ink)" : "var(--ink-soft)"}`,
                minWidth: "32px",
              }}
            >
              {n}
            </button>
          ))}
 
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={pagerBtn(page === totalPages)}
          >
            Next ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            style={pagerBtn(page === totalPages)}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
 
function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid var(--ink-soft)",
    background: "transparent",
    color: disabled ? "var(--ink-mute)" : "var(--ink)",
    cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit",
    borderRadius: "2px",
    opacity: disabled ? 0.4 : 1,
    transition: "all 0.15s",
  };
}
 
export default function AdminProductsPage() {
  return (
    <AdminShell title="Products">
      <ProductsTable />
    </AdminShell>
  );
}
