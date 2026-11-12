import type { Metadata } from "next";
import { Suspense } from "react";
import { RecordArcade } from "@/components/records/RecordArcade";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Fliperama de recordes",
  description: "Os melhores do CANAL 404 em cada jogo: apelidos, recordes, posições e as regras de desempate de cada placar.",
  path: "/records",
});

export default function RecordsPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-tomato px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          Quadro dos campeões
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,4.6rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          Fliperama de recordes
        </h1>
        <p className="mx-auto copy-lede mt-3 max-w-2xl text-cream-2">
          Cada jogo tem sua própria regra. Jogue, escolha um apelido no fim da partida e tente tirar o primeiro lugar de alguém.
        </p>
      </div>
      <Suspense fallback={<p className="text-center font-display uppercase tracking-wider text-cream-2">Ligando o fliperama…</p>}>
        <RecordArcade />
      </Suspense>
    </div>
  );
}
