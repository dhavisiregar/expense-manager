"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/ui/AuthProvider";
import { Button, Input } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user]);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const existing = await fetch(`${apiUrl}/categories`, { headers }).catch(() => null);
      if (existing?.ok) {
        const json = await existing.json().catch(() => null);
        if ((json?.data?.length ?? 0) === 0) {
          await fetch(`${apiUrl}/categories/seed`, { method: "POST", headers }).catch(() => {});
        }
      }
    } catch (e: any) {
      if (e.code !== "auth/popup-closed-by-user") {
        setError(e.message || "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

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
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account created! You can now sign in.");
        setMode("login");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        // Seed default categories if user has none
        const existing = await fetch(`${apiUrl}/categories`, { headers }).catch(() => null);
        if (existing?.ok) {
          const json = await existing.json().catch(() => null);
          const count = json?.data?.length ?? 0;
          if (count === 0) {
            await fetch(`${apiUrl}/categories/seed`, { method: "POST", headers }).catch(() => {});
          }
        }
      }
    } catch (e: any) {
      const msg = e.code
        ? e.code.replace("auth/", "").replace(/-/g, " ")
        : e.message || "Something went wrong";
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
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

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p
            style={{
              margin: "20px 0 0",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
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
