import type { Metadata } from "next";
import { Suspense } from "react";
import { RecordArcade } from "@/components/records/RecordArcade";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";

const COPY = localized({
  "pt-BR": {
    meta: {
      title: "Fliperama de recordes",
      description: "Os melhores do CANAL 404 em cada jogo: apelidos, recordes, posições e as regras de desempate de cada placar.",
    },
    kicker: "Quadro dos campeões",
    title: "Fliperama de recordes",
    lede: "Cada jogo tem sua própria regra. Jogue, escolha um apelido no fim da partida e tente tirar o primeiro lugar de alguém.",
    loading: "Ligando o fliperama…",
  },
  en: {
    meta: {
      title: "Record arcade",
      description: "The best of CANAL 404 in every game: nicknames, records, rankings and the tiebreak rules for each board.",
    },
    kicker: "Hall of champions",
    title: "Record arcade",
    lede: "Every game has its own rule. Play, pick a nickname at the end of the run and try to take first place from someone.",
    loading: "Switching on the arcade…",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({ ...COPY[locale].meta, path: "/records", locale });
}

export default async function RecordsPage() {
  const copy = COPY[await getLocale()];
  return (
    <div>
      <div className="mb-8 text-center">
        <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-tomato px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,4.6rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          {copy.title}
        </h1>
        <p className="mx-auto copy-lede mt-3 max-w-2xl text-cream-2">{copy.lede}</p>
      </div>
      <Suspense fallback={<p className="text-center font-display uppercase tracking-wider text-cream-2">{copy.loading}</p>}>
        <RecordArcade />
      </Suspense>
    </div>
  );
}
