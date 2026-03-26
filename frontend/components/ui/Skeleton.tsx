"use client";

import React from "react";

function pulse(style: React.CSSProperties) {
  return (
    <div
      style={{
        background:
          "linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-border) 50%, var(--color-surface-2) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        borderRadius: "6px",
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      {pulse({ height: "12px", width: "40%", marginBottom: "12px" })}
      {pulse({ height: "28px", width: "65%", marginBottom: "8px" })}
      {pulse({ height: "10px", width: "30%" })}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[80, 60, 50, 40, 55, 30].map((w, i) => (
        <td key={i} style={{ padding: "13px 16px" }}>
          {pulse({ height: "14px", width: `${w}%` })}
        </td>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </tr>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div style={{ padding: "32px" }}>
      {pulse({ height: "26px", width: "200px", marginBottom: "8px" })}
      {pulse({ height: "14px", width: "300px", marginBottom: "32px" })}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "16px",
        }}
      >
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
