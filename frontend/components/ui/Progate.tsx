"use client";

import { useRouter } from "next/navigation";
import { useSubscription } from "@/components/ui/SubscriptionProvider";
import { Crown, Lock } from "lucide-react";

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function ProGate({ children, feature }: ProGateProps) {
  const { isPro, loading } = useSubscription();
  const router = useRouter();

  if (loading) return <>{children}</>;
  if (isPro) return <>{children}</>;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Blurred content behind */}
      <div
        style={{
          filter: "blur(4px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.4,
        }}
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(10,10,15,0.75)",
          backdropFilter: "blur(2px)",
          gap: "12px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Crown size={24} color="#fff" />
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "16px" }}>
            Pro Feature
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            {feature || "Upgrade to Pro"} to unlock this feature
          </p>
        </div>
        <button
          onClick={() => router.push("/upgrade")}
          style={{
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            padding: "10px 24px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "var(--font-sans)",
          }}
        >
          Upgrade to Pro — Rp 29.000/mo
        </button>
      </div>
    </div>
  );
}

// Inline lock badge for features
export function ProBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "10px",
        fontWeight: 700,
        background: "linear-gradient(135deg, #f59e0b22, #f9731622)",
        color: "#f59e0b",
        border: "1px solid #f59e0b44",
        padding: "2px 7px",
        borderRadius: "20px",
      }}
    >
      <Crown size={9} /> PRO
    </span>
  );
}
