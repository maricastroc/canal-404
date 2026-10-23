import type { Metadata } from "next";
import { CharacterSelect } from "@/components/characters/CharacterSelect";

export const metadata: Metadata = {
  title: "Personagens",
  description: "Conheça o 404, a Lina, o Bruno, o Déco e a Mila — a turma do CANAL 404.",
};

export default function PersonagensPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 text-center">
        <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-bubblegum px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          Elenco oficial
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,4.6rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          Personagens do canal
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-hand text-xl text-cream-2">
          Escolha alguém da turma. Clique no retrato para ver como cada um reage.
        </p>
      </div>
      <CharacterSelect />
    </div>
  );
}
