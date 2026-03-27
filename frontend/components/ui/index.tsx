"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

// ─── Button ──────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: "none",
    borderRadius: "8px",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 0.15s",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "13px" },
    md: { padding: "9px 16px", fontSize: "14px" },
    lg: { padding: "12px 22px", fontSize: "15px" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--color-accent)", color: "#fff" },
    secondary: {
      background: "var(--color-surface-2)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
    },
    ghost: { background: "transparent", color: "var(--color-text-muted)" },
    danger: {
      background: "#ff5c7c20",
      color: "var(--color-danger)",
      border: "1px solid #ff5c7c30",
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        ...base,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted)",
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          background: "var(--color-surface-2)",
          border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
          borderRadius: "8px",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          padding: "9px 12px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: "12px", color: "var(--color-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({
  label,
  error,
  children,
  style,
  ...props
}: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted)",
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <select
        style={{
          background: "var(--color-surface-2)",
          border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
          borderRadius: "8px",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          padding: "9px 12px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span style={{ fontSize: "12px", color: "var(--color-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Textarea ────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted)",
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <textarea
        style={{
          background: "var(--color-surface-2)",
          border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
          borderRadius: "8px",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          padding: "9px 12px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          resize: "vertical",
          minHeight: "80px",
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: "12px", color: "var(--color-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────
export function Card({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="modal-inner"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "24px",
          width: "100%",
          maxWidth: "480px",
          margin: "0 16px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────
export function Badge({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 500,
        background: color ? `${color}22` : "var(--color-surface-2)",
        color: color || "var(--color-text-muted)",
        border: `1px solid ${color ? `${color}33` : "var(--color-border)"}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <Loader2
        size={size}
        style={{
          animation: "spin 1s linear infinite",
          color: "var(--color-accent)",
        }}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="page-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.4px",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "14px",
              color: "var(--color-text-muted)",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ color: "var(--color-text-muted)", marginBottom: "12px" }}>
        {icon}
      </div>
      <p
        style={{
          fontWeight: 500,
          margin: "0 0 4px",
          color: "var(--color-text)",
        }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
