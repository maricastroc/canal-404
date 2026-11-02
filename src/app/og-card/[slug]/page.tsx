import { notFound } from "next/navigation";
import { COVERS } from "@/components/art/Covers";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { Logo } from "@/components/art/Logo";
import { GAMES, getGame } from "@/games/registry";
import { OG_SIZE } from "@/lib/site";

export const metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

const ACCENT: Record<string, string> = {
  sun: "#ffc83d",
  mint: "#63d6c1",
  bubblegum: "#f06ba8",
  tangerine: "#ff8a3d",
  plum: "#b9a6ef",
  sky: "#5cb9f0",
};

export default async function OgCard({ params }: PageProps<"/og-card/[slug]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug } = await params;
  const game = getGame(slug);
  const Cover = COVERS[slug];
  const GameLogo = GAME_LOGOS[slug];
  if (!game || !Cover || !GameLogo) notFound();
  const accent = ACCENT[game.accent] ?? "#ffc83d";
  return (
    <main
      data-og-card
      className="relative overflow-hidden"
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        background: `repeating-conic-gradient(from 0deg at 36% 52%, #3f3170 0deg 8deg, #2b2150 8deg 16deg)`,
      }}
    >
      <div
        className="absolute rounded-[28px] border-[6px] border-ink bg-cream shadow-[14px_18px_0_#1d1830]"
        style={{ left: 64, top: 92, width: 600, height: 450, padding: 14, transform: "rotate(-3deg)" }}
      >
        <div className="h-full w-full overflow-hidden rounded-[16px] border-[4px] border-ink">
          <Cover decorative />
        </div>
      </div>
      <div className="absolute flex flex-col items-center" style={{ left: 700, top: 70, width: 450 }}>
        <GameLogo className="w-full" />
        <p
          className="mt-4 rounded-2xl border-[4px] border-ink px-6 py-3 text-center font-display uppercase leading-tight text-ink shadow-[8px_10px_0_#1d1830]"
          style={{ background: accent, fontSize: 30, transform: "rotate(2deg)" }}
        >
          {game.tagline}
        </p>
      </div>
      <div className="absolute flex items-center gap-4" style={{ right: 44, bottom: 30 }}>
        <span className="rounded-xl border-[3px] border-ink bg-cream px-4 py-1.5 font-display text-2xl uppercase tracking-wide text-ink">
          Jogue no navegador
        </span>
        <Logo className="w-40" slogan={false} />
      </div>
    </main>
  );
}
