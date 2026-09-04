"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminContext } from "./AdminContext";

const NAV = [
  { label: "Dashboard",           href: "/admin" },
  { label: "Products",            href: "/admin/products" },
  { label: "Orders",              href: "/admin/orders" },
  { label: "Subscribers",         href: "/admin/subscribers" },
  { label: "Contacts",            href: "/admin/contacts" },
  { label: "Seller Applications", href: "/admin/seller-applications" },
];

interface Props { title: string; children: React.ReactNode }

export default function AdminShell({ title, children }: Props) {
  const [token,       setToken]       = useState<string | null>(null);
  const [checked,     setChecked]     = useState(false);
  const [pw,          setPw]          = useState("");
  const [error,       setError]       = useState("");
  const [loggingIn,   setLoggingIn]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("admin_auth");
    setToken(stored);
    setChecked(true);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) { setError("Invalid password."); return; }
      localStorage.setItem("admin_auth", pw);
      setToken(pw);
    } catch {
      setError("Network error.");
    } finally {
      setLoggingIn(false);
    }
  }

  function logout() {
    // Clears the httpOnly admin_session cookie server-side (can't be
    // cleared from client JS directly) so maintenance mode kicks back
    // in for you on every route, not just /admin.
    fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("admin_auth");
    setToken(null);
  }

  if (!checked) return null;

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: "100%", maxWidth: "360px", padding: "0 24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "24px", textAlign: "center" }}>
            — Admin —
          </div>
          <h1 className="display" style={{ fontSize: "36px", lineHeight: 1, color: "var(--ink)", textAlign: "center", marginBottom: "40px" }}>
            Sign in.
          </h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="field">
              <label htmlFor="admin-pw">Password</label>
              <input
                id="admin-pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Admin password"
                required
                autoFocus
              />
            </div>
            {error && <p style={{ fontSize: "13px", fontWeight: 600, color: "#e53e3e", marginTop: "-8px" }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loggingIn} style={{ opacity: loggingIn ? 0.6 : 1 }}>
              {loggingIn ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const showSidebar = !isMobile || sidebarOpen;

  return (
    <AdminContext.Provider value={{ token, logout }}>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", position: "relative" }}>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(20,20,20,0.45)",
              zIndex: 40,
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            background: "var(--bg-alt)",
            borderRight: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            position: isMobile ? "fixed" : "sticky",
            top: 0,
            left: 0,
            height: "100vh",
            overflowY: "auto",
            zIndex: 50,
            transform: showSidebar ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Brand */}
          <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--line)" }}>
            <Link
              href="/"
              style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.18em", textDecoration: "none", display: "block", marginBottom: "4px" }}
            >
              ← Store
            </Link>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              Admin Panel
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "16px 0", flex: 1 }}>
            {NAV.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--ink)" : "var(--ink-faded)",
                    textDecoration: "none",
                    background: active ? "var(--bg-soft)" : "transparent",
                    borderLeft: active ? "2px solid var(--ink)" : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)" }}>
            <button
              onClick={logout}
              style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: "var(--ink-faded)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ink)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-faded)"; }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: isMobile ? 0 : undefined }}>

          {/* Top bar */}
          <div
            style={{
              padding: isMobile ? "14px 16px" : "16px 32px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg)",
              position: isMobile ? "sticky" : undefined,
              top: isMobile ? 0 : undefined,
              zIndex: 30,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Hamburger — mobile only */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen((o) => !o)}
                  aria-label="Toggle menu"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", gap: "5px" }}
                >
                  {[0,1,2].map((i) => (
                    <span key={i} style={{ display: "block", width: "20px", height: "2px", background: "var(--ink)", borderRadius: "2px" }} />
                  ))}
                </button>
              )}
              <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                {title}
              </h1>
            </div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-mute)", letterSpacing: "0.06em" }}>
              AI Digital Products
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, padding: isMobile ? "20px 16px" : "32px", overflowY: "auto" }}>
            {children}
          </div>

        </div>
      </div>
    </AdminContext.Provider>
  );
}