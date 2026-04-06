"use client";

export default function Nav() {
  return (
    <nav className="nav">
      {/* Logo */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: 800,
          letterSpacing: "0.02em",
          color: "var(--ink)",
        }}
      >
        AI
        <Dot />
        DIGITAL
        <Dot />
        PRODUCTS
      </div>

      {/* Links */}
      <ul className="flex items-center gap-9 list-none">
        <li className="nav-mobile-hide">
          <NavLink href="#products">Products</NavLink>
        </li>
        <li className="nav-mobile-hide">
          <NavLink href="#sell">Sell</NavLink>
        </li>
        <li className="nav-mobile-hide">
          <NavLink href="#pricing">Pricing</NavLink>
        </li>
        <li>
          <a
            href="#"
            style={{
              color: "var(--ink)",
              border: "1px solid var(--ink)",
              padding: "8px 18px",
              borderRadius: "980px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.25s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--ink)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)";
            }}
          >
            Get Started
          </a>
        </li>
      </ul>
    </nav>
  );
}

function Dot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "4px",
        height: "4px",
        background: "var(--ink)",
        borderRadius: "50%",
        margin: "0 3px 3px 2px",
        verticalAlign: "middle",
      }}
    />
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        color: "var(--ink-faded)",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 600,
        transition: "color 0.25s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-faded)";
      }}
    >
      {children}
    </a>
  );
}
