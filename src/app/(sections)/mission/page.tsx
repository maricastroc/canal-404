import type { Metadata } from "next";
import { MissionHub } from "@/components/missions/MissionHub";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Missão 404 do Dia",
  description: "Um desafio novo por dia em um jogo do CANAL 404, igual para todo mundo. Cumpra a missão, entre no placar do dia e guarde suas fitas.",
  path: "/mission",
});

export default function MissionPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-lime px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          Programa especial
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,4.6rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          Missão 404 do Dia
        </h1>
        <p className="mx-auto copy-lede mt-3 max-w-2xl text-cream-2">
          Todo dia o canal escolhe um desafio em um dos jogos. É o mesmo para todo mundo e troca à meia-noite.
        </p>
      </div>
      <MissionHub />
    </div>
  );
}
