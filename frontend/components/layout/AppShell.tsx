"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  if (isAuthPage || !user) return <>{children}</>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}
        className="app-main"
      >
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .app-main { padding-top: 56px; }
        }
      `}</style>
    </div>
  );
}
