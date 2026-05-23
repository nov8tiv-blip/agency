"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    group: "CRM",
    items: [
      { label: "Contacts", href: "/contacts", icon: "👤" },
      { label: "Companies", href: "/companies", icon: "🏢" },
    ],
  },
  {
    group: "Sales",
    items: [
      { label: "Deals", href: "/deals", icon: "💼" },
      { label: "Proposals", href: "/proposals", icon: "📄" },
    ],
  },
  {
    group: "Marketing",
    items: [{ label: "Email Campaigns", href: "/marketing", icon: "📧" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: "var(--hs-navy)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--hs-navy-hover)",
        }}
      >
        <div
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "-0.3px",
          }}
        >
          <span style={{ color: "var(--hs-orange)" }}>Agency</span> CRM
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {NAV.map((group) => (
          <div key={group.group} style={{ marginBottom: 8 }}>
            <div
              style={{
                color: "#7c9bb5",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "12px 16px 4px",
              }}
            >
              {group.group}
            </div>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    color: active ? "white" : "#b8d0e8",
                    background: active ? "var(--hs-navy-hover)" : "transparent",
                    textDecoration: "none",
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 400,
                    borderRadius: 4,
                    margin: "1px 8px",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom links */}
      <div
        style={{
          borderTop: "1px solid var(--hs-navy-hover)",
          padding: "12px 8px",
        }}
      >
        <Link
          href="/api/auth/logout"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            color: "#7c9bb5",
            textDecoration: "none",
            fontSize: 13,
            borderRadius: 4,
          }}
        >
          <span>⚙️</span> Settings
        </Link>
      </div>
    </aside>
  );
}
