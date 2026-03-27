import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/ui/AuthProvider";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "DuitFlow",
  description: "Track your expenses with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          background: "var(--color-bg)",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
          margin: 0,
          minHeight: "100vh",
        }}
      >
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <AuthGuard>
                <AppShell>{children}</AppShell>
              </AuthGuard>
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
