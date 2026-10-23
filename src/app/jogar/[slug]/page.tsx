import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameShell } from "@/components/game-shell/GameShell";
import { getGame, PLAYABLE } from "@/games/registry";

export function generateStaticParams() {
  return PLAYABLE.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/jogar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  return { title: game ? `Jogando ${game.title}` : "Jogar" };
}

export default async function PlayPage({ params }: PageProps<"/jogar/[slug]">) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game || game.status !== "disponivel") notFound();
  return (
    <main id="conteudo">
      <GameShell slug={slug} />
    </main>
  );
}
