"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "./AdminShell";
import { useAdmin, adminHeaders } from "./AdminContext";

interface Stats {
  totalProducts: number;
  activeProducts: number;
  comingSoon: number;
  totalOrders: number;
  totalSubscribers: number;
  totalContacts: number;
}

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div
      style={{
        background: "var(--bg-alt)",
        border: "1px solid var(--line)",
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => href && ((e.currentTarget as HTMLDivElement).style.background = "var(--bg-soft)")}
      onMouseLeave={(e) => href && ((e.currentTarget as HTMLDivElement).style.background = "var(--bg-alt)")}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
        {label}
      </div>
      <div style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

function DashboardContent() {
  const { token } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p style={{ color: "var(--ink-faded)", fontSize: "14px" }}>Loading…</p>;
  if (!stats)  return <p style={{ color: "#e53e3e", fontSize: "14px" }}>Failed to load stats.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px", maxWidth: "900px" }}>

      {/* Overview cards */}
      <div>
        <SectionHeading>Overview</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1px", background: "var(--line)" }}>
          <StatCard label="Total Products"    value={stats.totalProducts}    href="/admin/products" />
          <StatCard label="Active"            value={stats.activeProducts}   href="/admin/products" />
          <StatCard label="Coming Soon"       value={stats.comingSoon}       href="/admin/products" />
          <StatCard label="Total Orders"      value={stats.totalOrders}      href="/admin/orders" />
          <StatCard label="Subscribers"       value={stats.totalSubscribers} href="/admin/subscribers" />
          <StatCard label="Contact Messages"  value={stats.totalContacts}    href="/admin/contacts" />
        </div>
      </div>

      {/* Quick links */}
      <div>
        <SectionHeading>Quick Links</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--line)", border: "1px solid var(--line)" }}>
          {[
            { label: "Add New Product",            href: "/admin/products/new",  desc: "Create a new product listing" },
            { label: "Browse All Products",        href: "/admin/products",      desc: "View, edit, and manage products" },
            { label: "View Orders",                href: "/admin/orders",        desc: "Review purchase history" },
            { label: "Newsletter Subscribers",     href: "/admin/subscribers",   desc: "Manage email subscribers" },
            { label: "Contact Submissions",        href: "/admin/contacts",      desc: "Review incoming messages" },
            { label: "Seller Applications",        href: "/admin/seller-applications", desc: "Review seller waitlist submissions" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                background: "var(--bg)",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-soft)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--bg)")}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{item.label}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-faded)", marginTop: "2px" }}>{item.desc}</div>
              </div>
              <span style={{ color: "var(--ink-mute)", fontSize: "16px" }}>→</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "16px" }}>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminShell title="Dashboard">
      <DashboardContent />
    </AdminShell>
  );
}
