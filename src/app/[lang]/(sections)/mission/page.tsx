import type { Metadata } from "next";
import { MissionHub } from "@/components/missions/MissionHub";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";

const COPY = localized({
  "pt-BR": {
    meta: {
      title: "Missão 404 do Dia",
      description: "Todo dia tem uma missão diferente em um jogo do Canal 404, igual para todo mundo. Conclua o desafio, suba no placar do dia e guarde suas fitas.",
    },
    kicker: "Programa especial",
    title: "Missão 404 do Dia",
    lede: "Todo dia tem uma missão diferente em um dos jogos do canal. Todo mundo recebe o mesmo desafio, que fica disponível até a meia-noite.",
  },
  en: {
    meta: {
      title: "Mission 404 of the Day",
      description: "Every day there's a different mission in a Canal 404 game, the same for everyone. Beat the challenge, climb today's board and keep your tapes.",
    },
    kicker: "Special program",
    title: "Mission 404 of the Day",
    lede: "Every day there's a different mission in one of the channel's games. Everyone gets the same challenge, available until midnight in Brazil (UTC−3).",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({ ...COPY[locale].meta, path: "/mission", locale });
}

export default async function MissionPage() {
  const copy = COPY[await getLocale()];
  return (
    <div>
      <div className="mb-8 text-center">
        <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-lime px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,4.6rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          {copy.title}
        </h1>
        <p className="mx-auto copy-lede mt-3 max-w-2xl text-cream-2">{copy.lede}</p>
      </div>
      <MissionHub />
    </div>
  );
}
