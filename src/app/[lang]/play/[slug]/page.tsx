import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameShell } from "@/components/game-shell/GameShell";
import { getGame, PLAYABLE } from "@/games/registry";
import { localized } from "@/i18n/copy";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { ogImage, pageMetadata } from "@/lib/site";

const META = localized({
  "pt-BR": { fallbackTitle: "Jogar", title: (game: string) => `Jogando ${game}` },
  en: { fallbackTitle: "Play", title: (game: string) => `Playing ${game}` },
});

export function generateStaticParams() {
  return PLAYABLE.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[lang]/play/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const meta = META[locale];
  const game = getGame(slug, locale);
  if (!game) return { title: meta.fallbackTitle };
  return pageMetadata({
    title: meta.title(game.title),
    description: game.tagline,
    path: `/play/${game.slug}`,
    locale,
    canonical: `/games/${game.slug}`,
    image: ogImage(game.slug, `${game.title}: ${game.tagline}`, locale),
    index: false,
  });
}

export default async function PlayPage({ params }: PageProps<"/[lang]/play/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const game = getGame(slug, lang);
  if (!game || game.status !== "available") notFound();
  return (
    <main id="content">
      <GameShell slug={slug} />
    </main>
  );
}
