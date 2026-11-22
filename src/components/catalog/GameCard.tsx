"use client";

import Link from "@/i18n/Link";
import { GameCover } from "@/components/art/Covers";
import { SolidStarIcon } from "@/components/art/Icons";
import { Tag, type Tone } from "@/components/ui/Primitives";
import { useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { useSound } from "@/lib/audio/hooks";
import { CATEGORY_LABELS, type GameMeta } from "@/games/registry";
import { useHydrated, useProgress } from "@/lib/progress/hooks";
import type { ProgramState } from "@/lib/schedule";
import { useSchedule } from "./useSchedule";

const STICKER_CLASS: Record<ProgramState, string> = {
  unplayed: "bg-sun",
  rerun: "bg-plum-300",
  saved: "bg-mint",
};

const COPY = localized({
  "pt-BR": {
    stickers: {
      unplayed: { label: "Inédito!", spoken: "Inédito: você ainda não jogou." },
      rerun: { label: "Reprise", spoken: "Reprise: você já jogou." },
      saved: { label: "Aventura salva", spoken: "Aventura salva: continue de onde parou." },
    } as Record<ProgramState, { label: string; spoken: string }>,
    soon: "Em breve",
    record: (n: number) => `Recorde: ${n}`,
    noRecord: "Sem recorde ainda",
    inProduction: "Em produção",
  },
  en: {
    stickers: {
      unplayed: { label: "New!", spoken: "New: you haven't played it yet." },
      rerun: { label: "Rerun", spoken: "Rerun: you've played it before." },
      saved: { label: "Saved adventure", spoken: "Saved adventure: pick up where you left off." },
    },
    soon: "Coming soon",
    record: (n: number) => `Record: ${n}`,
    noRecord: "No record yet",
    inProduction: "In production",
  },
});

const categoryTone: Record<GameMeta["category"], Tone> = {
  action: "tangerine",
  puzzle: "plum",
  adventure: "mint",
  strategy: "sky",
  music: "bubblegum",
};

export function GameCard({ game, index }: { game: GameMeta; index: number }) {
  const locale = useLocale();
  const copy = COPY[locale];
  const { play, hover } = useSound();
  const progress = useProgress();
  const hydrated = useHydrated();
  const record = hydrated ? progress.games[game.slug] : undefined;
  const available = game.status === "available";
  const schedule = useSchedule();
  const state = available ? schedule.state(game) : null;
  const sticker = state ? { ...copy.stickers[state], className: STICKER_CLASS[state] } : null;
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
              {copy.soon}
            </div>
          </>
        )}
        {sticker && (
          <span
            aria-hidden
            data-sticker={state}
            className={`absolute left-2 top-2 -rotate-6 rounded-md border-[3px] border-ink px-2 py-0.5 font-display text-xs uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)] ${sticker.className}`}
          >
            {sticker.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-1.5 px-1 pb-1 pt-3 text-center">
        <h2 className="font-display text-[1.35rem] uppercase leading-none tracking-wide text-ink">{game.title}</h2>
        {sticker && <span className="sr-only">{sticker.spoken}</span>}
        <p className="text-sm leading-snug text-ink-soft">{game.tagline}</p>
        <div className="mt-auto flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <Tag tone={categoryTone[game.category]}>{CATEGORY_LABELS[locale][game.category]}</Tag>
          {available ? (
            <Tag tone="cream">
              {game.levels ? (
                <>
                  <SolidStarIcon className="mr-1 size-3" />
                  {`${game.levels.reduce((acc, l) => acc + (record?.levels?.[l.id]?.stars ?? 0), 0)}/${game.levels.length * 3}`}
                </>
              )
                : record && record.highScore > 0
                  ? copy.record(record.highScore)
                  : copy.noRecord}
            </Tag>
          ) : (
            <Tag tone="cream">{copy.inProduction}</Tag>
          )}
        </div>
      </div>
    </Link>
  );
}
