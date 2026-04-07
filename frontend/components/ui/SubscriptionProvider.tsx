"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

interface Subscription {
  plan: "free" | "pro";
  status: string;
  expires_at?: string;
}

interface SubscriptionContextValue {
  subscription: Subscription | null;
  isPro: boolean;
  loading: boolean;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscription/status`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (res.ok) {
        const json = await res.json();
        setSubscription(json.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isPro = (() => {
    if (!subscription || subscription.plan !== "pro") return false;
    if (subscription.status !== "active") return false;
    if (
      subscription.expires_at &&
      new Date() > new Date(subscription.expires_at)
    )
      return false;
    return true;
  })();

  return (
    <SubscriptionContext.Provider
      value={{ subscription, isPro, loading, refresh: load }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx)
    throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
