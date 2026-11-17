import type { Metadata } from "next";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";
import { CharacterSelect } from "@/components/characters/CharacterSelect";

const META = localized({
  "pt-BR": {
    title: "Personagens",
    description: "Conheça o 404, a Lina, o Bruno, o Déco e a Mila — a turma do CANAL 404.",
  },
  en: {
    title: "Characters",
    description: "Meet 404, Lina, Bruno, Déco and Mila — the CANAL 404 crew.",
  },
});

const COPY = localized({
  "pt-BR": {
    kicker: "Elenco oficial",
    title: "Personagens do canal",
    intro: "Escolha alguém da turma. Clique no retrato para ver como cada um reage.",
  },
  en: {
    kicker: "Official cast",
    title: "The channel's characters",
    intro: "Pick someone from the crew. Click the portrait to see how each one reacts.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({ ...META[locale], path: "/characters", locale });
}

export default async function CharactersPage() {
  const copy = COPY[await getLocale()];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 text-center">
        <p className="inline-block -rotate-2 rounded-md border-[3px] border-ink bg-bubblegum px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,7vw,4.6rem)] uppercase leading-[0.95] tracking-wide text-cream [text-shadow:4px_5px_0_var(--color-ink)]">
          {copy.title}
        </h1>
        <p className="mx-auto copy-lede mt-3 max-w-xl text-cream-2">
          {copy.intro}
        </p>
      </div>
      <CharacterSelect />
    </div>
  );
}
