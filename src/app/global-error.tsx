"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/telemetry";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError("root", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#1f1839", color: "#f7ecd4", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 520, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 56, fontWeight: 900, color: "#ffc83d", margin: 0 }}>CH ???</p>
          <h1 style={{ fontSize: 28, textTransform: "uppercase", margin: "8px 0 16px" }}>Sinal perdido</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, margin: "0 0 24px" }}>O canal caiu de vez por um instante. Tenta sintonizar de novo.</p>
          <button
            type="button"
            onClick={reset}
            style={{ font: "inherit", fontWeight: 800, fontSize: 18, padding: "12px 24px", borderRadius: 12, border: "3px solid #1d1830", background: "#ffc83d", color: "#1d1830", cursor: "pointer" }}
          >
            Sintonizar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
