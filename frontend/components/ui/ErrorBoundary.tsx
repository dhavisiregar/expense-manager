"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#ff5c7c20",
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
              margin: "0 0 20px",
              fontSize: "14px",
              color: "var(--color-text-muted)",
              maxWidth: "360px",
            }}
          >
            {this.state.message ||
              "An unexpected error occurred. Please try again."}
          </p>
          <Button onClick={this.reset}>Try Again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
