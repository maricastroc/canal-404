"use client";

import { useEffect } from "react";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { reportError } from "@/lib/telemetry";

const COPY = localized({
  "pt-BR": {
    title: "Sinal perdido",
    text: "Alguém tropeçou no cabo da antena. Já estou ajeitando! Tenta sintonizar de novo?",
    retry: "Sintonizar de novo",
    room: "Voltar para a sala",
  },
  en: {
    title: "Signal lost",
    text: "Somebody tripped over the antenna cable. I'm fixing it! Want to try tuning in again?",
    retry: "Tune in again",
    room: "Back to the room",
  },
});

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const copy = useCopy(COPY);

  useEffect(() => {
    reportError("route", error);
  }, [error]);

  return (
    <main id="content" className="on-dark grid min-h-svh place-items-center px-4 py-10">
      <div className="grid max-w-3xl items-center gap-6 rounded-[28px] border-[3px] border-ink bg-plum-800 p-6 shadow-[var(--shadow-ink-lg)] sm:grid-cols-[auto_1fr] sm:p-10">
        <Mascot404 expression="static" pose="peek" className="mx-auto w-48 sm:w-56" />
        <div>
          <p className="font-display text-5xl leading-none text-sun [text-shadow:4px_5px_0_var(--color-ink)]">CH ???</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-cream">{copy.title}</h1>
          <SpeechBubble tail="top" className="mt-5 font-hand text-xl leading-snug">
            {copy.text}
          </SpeechBubble>
          <div className="mt-6 flex flex-wrap gap-3">
            <InkButton tone="sun" onClick={reset}>
              {copy.retry}
            </InkButton>
            <InkLink href="/" tone="mint">
              {copy.room}
            </InkLink>
          </div>
        </div>
      </div>
    </main>
  );
}
