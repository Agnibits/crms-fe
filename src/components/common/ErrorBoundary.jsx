"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Class-based error boundary. Wrap route trees or risky widgets:
 *   <ErrorBoundary fallbackTitle="Chart failed to render">…</ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {this.props.fallbackTitle || "Something went wrong"}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred while rendering this view."}
          </p>
        </div>
        <button
          onClick={this.handleReset}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }
}
