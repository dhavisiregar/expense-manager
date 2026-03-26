"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Tag,
  TrendingDown,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/categories", label: "Categories", icon: Tag },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "28px 24px 24px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrendingDown size={18} color="#fff" />
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: "15px",
            letterSpacing: "-0.3px",
            color: "var(--color-text)",
          }}
        >
          ExpenseOS
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--color-text-muted)",
            padding: "0 8px",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}
        >
          Menu
        </p>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 10px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: active ? 500 : 400,
                    color: active
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                    background: active
                      ? "var(--color-accent-dim)"
                      : "transparent",
                    transition: "all 0.15s",
                    border: active
                      ? "1px solid var(--color-accent)30"
                      : "1px solid transparent",
                  }}
                >
                  <Icon
                    size={16}
                    color={
                      active ? "var(--color-accent)" : "var(--color-text-muted)"
                    }
                  />
                  {label}
                  {active && (
                    <ChevronRight
                      size={14}
                      color="var(--color-accent)"
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--color-border)",
          fontSize: "11px",
          color: "var(--color-text-muted)",
        }}
      >
        v1.0.0
      </div>
    </aside>
  );
}
