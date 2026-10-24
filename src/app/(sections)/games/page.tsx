import type { Metadata } from "next";
import { Sparkle, Squiggle } from "@/components/art/Badges";
import { GameCatalog } from "@/components/catalog/GameCatalog";
import { PageTitle, PaperPanel } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "Catálogo de jogos",
  description: "Todos os jogos do CANAL 404: Rua Sem Saída, Laboratório de Péssimas Ideias, Guerra de Lanche e os próximos lançamentos.",
};

export default function GamesPage() {
  return (
    <PaperPanel className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-8">
      <Sparkle className="absolute -left-4 -top-5 w-12 rotate-12" />
      <Sparkle className="absolute -right-3 top-16 w-9" color="#63d6c1" />
      <PageTitle kicker="Fliperama do canal">Catálogo de jogos</PageTitle>
      <Squiggle className="mx-auto mt-2 w-40" color="#ff8a3d" />
      <p className="mx-auto mt-3 max-w-xl text-center text-lg leading-snug text-ink-soft">
        Três jogos estão prontos para jogar. Os outros ainda estão sendo desenhados à mão. Dá pra espiar como eles vão ser.
      </p>
      <div className="mt-8">
        <GameCatalog />
      </div>
    </PaperPanel>
  );
}
