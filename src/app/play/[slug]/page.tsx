import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameShell } from "@/components/game-shell/GameShell";
import { getGame, PLAYABLE } from "@/games/registry";
import { ogImage, pageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return PLAYABLE.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/play/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return { title: "Jogar" };
  return pageMetadata({
    title: `Jogando ${game.title}`,
    description: game.tagline,
    path: `/play/${game.slug}`,
    canonical: `/games/${game.slug}`,
    image: ogImage(game.slug, `${game.title}: ${game.tagline}`),
    index: false,
  });
}

export default async function PlayPage({ params }: PageProps<"/play/[slug]">) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game || game.status !== "available") notFound();
  return (
    <main id="content">
      <GameShell slug={slug} />
    </main>
  );
}
