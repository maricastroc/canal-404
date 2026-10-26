"use client";

import Link from "next/link";
import { GameCover } from "@/components/art/Covers";
import { Tag, type Tone } from "@/components/ui/Primitives";
import { useSound } from "@/lib/audio/hooks";
import { CATEGORY_LABELS, type GameMeta } from "@/games/registry";
import { useHydrated, useProgress } from "@/lib/progress/hooks";

const categoryTone: Record<GameMeta["category"], Tone> = {
  action: "tangerine",
  puzzle: "plum",
  adventure: "mint",
  strategy: "sky",
};

export function GameCard({ game, index }: { game: GameMeta; index: number }) {
  const { play, hover } = useSound();
  const progress = useProgress();
  const hydrated = useHydrated();
  const record = hydrated ? progress.games[game.slug] : undefined;
  const available = game.status === "available";
  const tilt = index % 3 === 0 ? "-rotate-1" : index % 3 === 1 ? "rotate-1" : "-rotate-[0.5deg]";

  return (
    <Link
      href={`/games/${game.slug}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
      onClick={() => play("click")}
      className={`group relative flex h-full flex-col border-[3px] border-ink bg-paper p-2.5 shadow-[var(--shadow-ink)] transition-transform duration-200 wobbly-sm hover:-translate-y-1.5 hover:rotate-0 hover:shadow-[var(--shadow-ink-lg)] focus-visible:rotate-0 ${tilt}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border-[3px] border-ink">
        <div className={`h-full w-full transition-transform duration-300 group-hover:scale-[1.04] ${available ? "" : "saturate-[0.65]"}`}>
          <GameCover slug={game.slug} decorative />
        </div>
        {!available && (
          <>
            <div aria-hidden className="absolute inset-0 scanlines opacity-50" />
            <div
              aria-hidden
              className="absolute -right-10 top-5 w-44 rotate-[28deg] border-y-[3px] border-ink bg-sun py-1 text-center font-display text-sm uppercase tracking-widest text-ink shadow-[0_3px_0_0_var(--color-ink)]"
            >
              Em breve
            </div>
          </>
        )}
        {available && (
          <span
            aria-hidden
            className="absolute left-2 top-2 -rotate-6 rounded-md border-[3px] border-ink bg-lime px-2 py-0.5 font-display text-xs uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]"
          >
            Jogável!
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-1.5 px-1 pb-1 pt-3 text-center">
        <h2 className="font-display text-[1.35rem] uppercase leading-none tracking-wide text-ink">{game.title}</h2>
        <p className="text-sm leading-snug text-ink-soft">{game.tagline}</p>
        <div className="mt-auto flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <Tag tone={categoryTone[game.category]}>{CATEGORY_LABELS[game.category]}</Tag>
          {available ? (
            <Tag tone="cream">
              {game.levels
                ? `★ ${game.levels.reduce((acc, l) => acc + (record?.levels?.[l.id]?.stars ?? 0), 0)}/${game.levels.length * 3}`
                : record && record.highScore > 0
                  ? `Recorde: ${record.highScore}`
                  : "Sem recorde ainda"}
            </Tag>
          ) : (
            <Tag tone="cream">Em produção</Tag>
          )}
        </div>
      </div>
    </Link>
  );
}
