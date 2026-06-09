"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const INACTIVITY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export function useInactivityLogout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveKey = "duitflow_last_active";

  const logout = async () => {
    await signOut(auth);
    router.replace("/auth");
  };

  const reset = () => {
    localStorage.setItem(lastActiveKey, Date.now().toString());
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_LIMIT_MS);
  };

  useEffect(() => {
    const last = parseInt(localStorage.getItem(lastActiveKey) || "0", 10);
    if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
      logout();
      return;
    }

    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);
}
