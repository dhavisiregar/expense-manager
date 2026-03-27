"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  // Auth page renders full-screen, no sidebar
  if (isAuthPage || !user) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
