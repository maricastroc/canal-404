import type { Metadata } from "next";
import { localized } from "@/i18n/copy";
import { getLocale } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";
import { Sparkle, Squiggle } from "@/components/art/Badges";
import { GameCatalog } from "@/components/catalog/GameCatalog";
import { MissionTeaser } from "@/components/missions/MissionTeaser";
import { PageTitle, PaperPanel } from "@/components/ui/Primitives";

const META = localized({
  "pt-BR": {
    title: "Catálogo de jogos",
    description: "Todos os jogos do CANAL 404: Rua Sem Saída, Laboratório de Péssimas Ideias, Guerra de Lanche, Operação: Recreio, Guerra do Pijama, Férias Fora do Ar e Ladeira Abaixo.",
  },
  en: {
    title: "Game catalog",
    description: "Every CANAL 404 game: Dead End Street, Bad Ideas Lab, Food Fight, Operation: Recess, Pajama War, Off-Air Vacation and Downhill Derby.",
  },
});

const COPY = localized({
  "pt-BR": {
    kicker: "Fliperama do canal",
    title: "Catálogo de jogos",
    intro: "Sete jogos prontos para jogar. Escolha um e boa sorte!",
  },
  en: {
    kicker: "The channel's arcade",
    title: "Game catalog",
    intro: "Seven games ready to play. Pick one and good luck!",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({ ...META[locale], path: "/games", locale });
}

export default async function GamesPage() {
  const copy = COPY[await getLocale()];
  return (
    <PaperPanel className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-8">
      <Sparkle className="absolute -left-4 -top-5 w-12 rotate-12" />
      <Sparkle className="absolute -right-3 top-16 w-9" color="#63d6c1" />
      <PageTitle kicker={copy.kicker}>{copy.title}</PageTitle>
      <Squiggle className="mx-auto mt-2 w-40" color="#ff8a3d" />
      <p className="mx-auto mt-3 max-w-xl text-center text-lg leading-snug text-ink-soft">
        {copy.intro}
      </p>
      <MissionTeaser />
      <div className="mt-8">
        <GameCatalog />
      </div>
    </PaperPanel>
  );
}
