"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/components/ui/SubscriptionProvider";
import { Crown, Check, Zap, BarChart2, Tag, FileText } from "lucide-react";

declare global {
  interface Window {
    snap: any;
  }
}

const PRO_FEATURES = [
  { icon: <FileText size={16} />, text: "Full report history (all periods)" },
  { icon: <BarChart2 size={16} />, text: "Advanced analytics & charts" },
  { icon: <Tag size={16} />, text: "Unlimited categories" },
  { icon: <Zap size={16} />, text: "Export to CSV / PDF" },
  { icon: <Crown size={16} />, text: "Priority support" },
];

const FREE_FEATURES = [
  "Unlimited expenses & income",
  "10 default categories",
  "Current period report only",
  "Day-by-day view",
  "Dashboard overview",
];

export default function UpgradePage() {
  const { isPro, subscription, loading, refresh } = useSubscription();
  const [paying, setPaying] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");

  useEffect(() => {
    // Load Midtrans Snap.js
    const isDev = process.env.NEXT_PUBLIC_MIDTRANS_ENV !== "production";
    const scriptSrc = isDev
      ? "https://app.sandbox.midtrans.com/snap/snap.js"
      : "https://app.midtrans.com/snap/snap.js";

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    );
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (status === "success") {
      refresh();
    }
  }, [status]);

  const handleUpgrade = async () => {
    setPaying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscription/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: session.user.email }),
        },
      );

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const { snap_token } = json.data;

      window.snap.pay(snap_token, {
        onSuccess: () => {
          refresh();
          router.push("/upgrade?status=success");
        },
        onPending: () => {
          router.push("/upgrade?status=pending");
        },
        onError: () => {
          router.push("/upgrade?status=error");
        },
        onClose: () => {
          setPaying(false);
        },
      });
    } catch (e: any) {
      alert(e.message || "Payment failed");
      setPaying(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Status banner */}
      {status === "success" && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#22d3a018",
            border: "1px solid #22d3a033",
            color: "var(--color-success)",
            fontWeight: 600,
          }}
        >
          🎉 Payment successful! Your Pro plan is now active.
        </div>
      )}
      {status === "pending" && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#ffb54718",
            border: "1px solid #ffb54733",
            color: "var(--color-warning)",
            fontWeight: 600,
          }}
        >
          ⏳ Payment pending. We'll activate your Pro plan once confirmed.
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#ff5c7c18",
            border: "1px solid #ff5c7c33",
            color: "var(--color-danger)",
            fontWeight: 600,
          }}
        >
          ❌ Payment failed. Please try again.
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Crown size={28} color="#fff" />
        </div>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
          }}
        >
          Upgrade to Pro
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            color: "var(--color-text-muted)",
          }}
        >
          Unlock the full DuitFlow experience
        </p>
      </div>

      {/* Plan cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {/* Free */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>
            Free
          </p>
          <p style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: 800 }}>
            Rp 0
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {FREE_FEATURES.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                }}
              >
                <Check size={14} color="var(--color-success)" />
                {f}
              </div>
            ))}
          </div>
          {!isPro && (
            <div
              style={{
                marginTop: "24px",
                padding: "10px",
                borderRadius: "8px",
                background: "var(--color-surface-2)",
                textAlign: "center",
                fontSize: "13px",
                color: "var(--color-text-muted)",
                fontWeight: 500,
              }}
            >
              Current plan
            </div>
          )}
        </div>

        {/* Pro */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a1520, #1e1a2e)",
            border: "1px solid #f59e0b44",
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "120px",
              height: "120px",
              background: "radial-gradient(circle, #f59e0b22, transparent)",
              borderRadius: "50%",
              transform: "translate(30%, -30%)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Pro</p>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              POPULAR
            </span>
          </div>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "28px",
              fontWeight: 800,
              color: "#f59e0b",
            }}
          >
            Rp 29.000
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--color-text-muted)",
              }}
            >
              /bulan
            </span>
          </p>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "12px",
              color: "var(--color-text-muted)",
            }}
          >
            Semua fitur Free, plus:
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            {PRO_FEATURES.map((f) => (
              <div
                key={f.text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#f59e0b", flexShrink: 0 }}>
                  {f.icon}
                </span>
                {f.text}
              </div>
            ))}
          </div>

          {isPro ? (
            <div>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#f59e0b22",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#f59e0b",
                  fontWeight: 600,
                }}
              >
                ✓ Active Pro Plan
              </div>
              {subscription?.expires_at && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    marginTop: "8px",
                  }}
                >
                  Expires{" "}
                  {new Date(subscription.expires_at).toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={paying || loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: paying ? "not-allowed" : "pointer",
                opacity: paying ? 0.8 : 1,
                fontFamily: "var(--font-sans)",
                transition: "opacity 0.15s",
              }}
            >
              {paying ? "Processing..." : "Upgrade Sekarang →"}
            </button>
          )}
        </div>
      </div>

      {/* Payment methods */}
      <p
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "var(--color-text-muted)",
        }}
      >
        Pembayaran aman via Midtrans · GoPay · OVO · QRIS · Transfer Bank ·
        Kartu Kredit
      </p>
    </div>
  );
}
