"use client";

import { useEffect } from "react";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { reportError } from "@/lib/telemetry";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError("route", error);
  }, [error]);

  return (
    <main id="content" className="on-dark grid min-h-svh place-items-center px-4 py-10">
      <div className="grid max-w-3xl items-center gap-6 rounded-[28px] border-[3px] border-ink bg-plum-800 p-6 shadow-[var(--shadow-ink-lg)] sm:grid-cols-[auto_1fr] sm:p-10">
        <Mascot404 expression="static" pose="peek" className="mx-auto w-48 sm:w-56" />
        <div>
          <p className="font-display text-5xl leading-none text-sun [text-shadow:4px_5px_0_var(--color-ink)]">CH ???</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-cream">Sinal perdido</h1>
          <SpeechBubble tail="top" className="mt-5 font-hand text-xl leading-snug">
            Alguém tropeçou no cabo da antena. Já estou ajeitando! Tenta sintonizar de novo?
          </SpeechBubble>
          <div className="mt-6 flex flex-wrap gap-3">
            <InkButton tone="sun" onClick={reset}>
              Sintonizar de novo
            </InkButton>
            <InkLink href="/" tone="mint">
              Voltar para a sala
            </InkLink>
          </div>
        </div>
      </div>
    </main>
  );
}
