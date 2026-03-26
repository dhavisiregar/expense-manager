"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: "#ff5c7c18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <AlertTriangle size={24} color="var(--color-danger)" />
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>
        Something went wrong
      </h2>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: "14px",
          color: "var(--color-text-muted)",
          maxWidth: "360px",
        }}
      >
        {error.message}
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
