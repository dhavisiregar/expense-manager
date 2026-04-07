"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  Tag,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  LogOut,
  Menu,
  X,
  BarChart2,
  Crown,
} from "lucide-react";
import { useSubscription } from "@/components/ui/SubscriptionProvider";
import { useAuth } from "@/components/ui/AuthProvider";
import { useToast } from "@/components/ui/Toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/report", label: "Report", icon: BarChart2 },
  { href: "/categories", label: "Categories", icon: Tag },
];

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const toast = useToast();
  const { isPro } = useSubscription();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    router.replace("/auth");
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div
        style={{
          padding: "24px 24px 20px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <img
          src="/logo.png"
          alt="DuitFlow Logo"
          style={{
            height: "44px", // control logo size
            width: "164px", // keep aspect ratio (important for wide logo)
            objectFit: "contain",
          }}
        />
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
                  onClick={onNav}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 10px",
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

      {/* Upgrade CTA */}
      {!isPro && (
        <div style={{ padding: "10px 12px" }}>
          <button
            onClick={() => {
              router.push("/upgrade");
              if (onNav) onNav();
            }}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #f59e0b22, #f9731622)",
              border: "1px solid #f59e0b44",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#f59e0b",
              fontWeight: 600,
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              transition: "opacity 0.15s",
            }}
          >
            <Crown size={14} /> Upgrade to Pro
          </button>
        </div>
      )}

      {/* User + sign out */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-accent)44",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-accent)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--color-text-muted)",
            }}
          >
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-danger)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-muted)")
          }
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarStyle: React.CSSProperties = {
    width: "220px",
    background: "var(--color-surface)",
    borderRight: "1px solid var(--color-border)",
    flexShrink: 0,
  };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────── */}
      <aside
        style={{ ...sidebarStyle, minHeight: "100vh", display: "none" }}
        className="desktop-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ───────────────────────── */}
      <div
        className="mobile-topbar"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          height: "56px",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingDown size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 600, fontSize: "15px" }}>DuitFlow</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text)",
            padding: "6px",
            borderRadius: "8px",
          }}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile overlay ───────────────────────── */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile slide-in drawer ───────────────── */}
      <aside
        style={{
          ...sidebarStyle,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
        }}
        className="mobile-drawer"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "12px 12px 0",
          }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <SidebarContent onNav={() => setMobileOpen(false)} />
        </div>
      </aside>

      <style>{`
        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; flex-direction: column; }
          .mobile-topbar   { display: none !important; }
          .mobile-drawer   { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar   { display: flex !important; }
        }
      `}</style>
    </>
  );
}
