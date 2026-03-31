"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { Spinner } from "@/components/ui";

function InactivityWatcher() {
  // Only mounts when user is authenticated — starts the inactivity timer
  useInactivityLogout();
  return null;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/auth") {
      router.replace("/auth");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size={32} />
      </div>
    );
  }

  if (!user && pathname !== "/auth") return null;

  return (
    <>
      {user && <InactivityWatcher />}
      {children}
    </>
  );
}
