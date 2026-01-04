"use client";

/**
 * Global error boundary for catastrophic errors.
 * This replaces the root layout, so must include <html> and <body> tags.
 * Must not use any React contexts to avoid static export issues.
 * See: https://github.com/vercel/next.js/issues/82366
 */
export default function GlobalError({
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Noe gikk galt</h1>
          <p style={{ marginBottom: "2rem", color: "#666" }}>
            En uventet feil oppstod. Vennligst prøv igjen.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Prøv igjen
          </button>
        </div>
      </body>
    </html>
  );
}

