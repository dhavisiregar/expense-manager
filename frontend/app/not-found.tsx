import Link from "next/link";

export default function NotFound() {
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
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "72px",
          fontWeight: 700,
          color: "var(--color-accent)",
          margin: "0 0 8px",
          lineHeight: 1,
        }}
      >
        404
      </p>
      <h1 style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 10px" }}>
        Page not found
      </h1>
      <p
        style={{
          color: "var(--color-text-muted)",
          fontSize: "14px",
          margin: "0 0 28px",
        }}
      >
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--color-accent)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
