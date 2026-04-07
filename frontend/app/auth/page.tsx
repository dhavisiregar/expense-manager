"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button, Input } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(
          "Account created! Check your email to confirm, then log in.",
        );
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Seed default categories only if user has none yet
        const session = (await supabase.auth.getSession()).data.session;
        if (session) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const headers = {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          };
          // Check existing categories first
          const existing = await fetch(`${apiUrl}/categories`, {
            headers,
          }).catch(() => null);
          if (existing?.ok) {
            const json = await existing.json().catch(() => null);
            const count = json?.data?.length ?? 0;
            if (count === 0) {
              await fetch(`${apiUrl}/categories/seed`, {
                method: "POST",
                headers,
              }).catch(() => {});
            }
          }
        }
        router.replace("/dashboard");
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src="/logo.png"
            alt="DuitFlow Logo"
            style={{
              width: "308px",
              height: "68px",
              objectFit: "contain",
              margin: "0 auto 12px",
              display: "block",
            }}
          />
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "20px",
              color: "var(--color-text-muted)",
            }}
          >
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "28px",
          }}
        >
          {/* Error / Success */}
          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#ff5c7c18",
                border: "1px solid #ff5c7c33",
                fontSize: "13px",
                color: "var(--color-danger)",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#22d3a018",
                border: "1px solid #22d3a033",
                fontSize: "13px",
                color: "var(--color-success)",
              }}
            >
              {success}
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <div style={{ position: "relative" }}>
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{ paddingRight: "40px" }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "10px",
                  bottom: "9px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "2px",
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Button
              onClick={handleSubmit}
              loading={loading}
              style={{ marginTop: "4px" }}
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </div>

          {/* Toggle mode */}
          <p
            style={{
              margin: "20px 0 0",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setSuccess("");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-accent)",
                fontWeight: 500,
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
