"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary. Renders only when the root layout itself throws,
 * so it must supply its own <html>/<body> and cannot rely on the app's global
 * CSS — styles are inlined and kept minimal.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0b0b0c",
          color: "#e5e5e5",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", color: "#a3a3a3", margin: 0 }}>
          The application hit an unexpected error and couldn&apos;t render. Please try again.
        </p>
        {error?.digest && (
          <p style={{ fontSize: "0.75rem", color: "#737373", margin: 0 }}>Reference: {error.digest}</p>
        )}
        <button
          onClick={() => reset()}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#e5e5e5",
            color: "#0b0b0c",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
