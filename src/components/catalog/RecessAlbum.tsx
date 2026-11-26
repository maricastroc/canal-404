"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { STICKER_IDS, STICKER_NAMES, stickerArt, type StickerId } from "@/games/operation-recess/album";
import { COPY as GAME_COPY, levelCopy } from "@/games/operation-recess/copy";
import { LEVELS } from "@/games/operation-recess/levels";
import { parseSave } from "@/games/operation-recess/save";
import { readAlbum, subscribeAlbum } from "./RecessAlbumButton";

const COPY = localized({
  "pt-BR": {
    title: "Álbum de figurinhas",
    intro: "As brincadeiras que os monitores proibiram. Cada figurinha que o Bruno pega fica guardada aqui.",
    count: (n: number, total: number) => `${n}/${total} figurinhas`,
    level: (n: number) => `Fase ${n}`,
    found: "encontrada",
    missing: "Figurinha ainda não encontrada",
    unknown: "???",
  },
  en: {
    title: "Sticker album",
    intro: "The games the monitors banned. Every sticker Bruno picks up is kept here.",
    count: (n: number, total: number) => `${n}/${total} stickers`,
    level: (n: number) => `Level ${n}`,
    found: "found",
    missing: "Sticker not found yet",
    unknown: "???",
  },
});

const PAGES = LEVELS.map((level, i) => ({
  id: level.id,
  index: i,
  stickers: level.items.flatMap((it) => (it.kind === "sticker" ? [it.id] : [])),
}));

const TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function RecessAlbum({ inPanel = false }: { inPanel?: boolean }) {
  const locale = useLocale();
  const copy = COPY[locale];
  const names = STICKER_NAMES[locale];
  const raw = useSyncExternalStore(subscribeAlbum, readAlbum, () => null);
  const owned = useMemo(() => new Set<StickerId>(parseSave(raw).stickers), [raw]);
  const id = inPanel ? "album-panel" : "album";

  return (
    <section aria-labelledby={id} className={inPanel ? "" : "mt-12"}>
      <h2 id={id} tabIndex={inPanel ? -1 : undefined} className={`text-center font-display uppercase tracking-wide outline-none! ${inPanel ? "text-3xl leading-none text-ink sm:text-4xl" : "text-3xl text-cream [text-shadow:3px_4px_0_var(--color-ink)]"}`}>
        {copy.title}
      </h2>
      <p className={`mx-auto mt-2 max-w-xl text-center font-hand ${inPanel ? "text-lg leading-snug text-ink-soft" : "text-xl text-cream-2"}`}>{copy.intro}</p>
      <p className="mx-auto mt-3 w-fit rounded-lg border-[3px] border-ink bg-sun px-3 py-1 font-display text-sm uppercase tracking-wide text-ink shadow-[var(--shadow-ink-sm)] tabular-nums">
        {copy.count(owned.size, STICKER_IDS.length)}
      </p>
      <div className={`grid md:grid-cols-2 ${inPanel ? "mt-4 gap-4" : "mt-6 gap-6"}`}>
        {PAGES.map((page) => {
          const got = page.stickers.filter((id) => owned.has(id)).length;
          return (
            <div key={page.id} className="paper border-[3px] border-ink p-4 shadow-[var(--shadow-ink)] wobbly-sm">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl uppercase leading-tight tracking-wide text-ink">
                  <span className="mr-2 text-ink-soft">{copy.level(page.index + 1)}</span>
                  {levelCopy(GAME_COPY[locale], page.id).title}
                </h3>
                <span className="font-display text-lg text-ink tabular-nums">
                  {got}/{page.stickers.length}
                </span>
              </div>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-3 sm:gap-3">
                {page.stickers.map((id, i) => {
                  const has = owned.has(id);
                  return (
                    <li key={id} className="w-[4.5rem] text-center sm:w-[5.5rem]" aria-label={has ? `${names[id]}, ${copy.found}` : copy.missing}>
                      {has ? (
                        <span aria-hidden className={`mx-auto block size-16 bg-contain sm:size-20 bg-center bg-no-repeat ${TILT[i % TILT.length]}`} style={{ backgroundImage: `url(${stickerArt(id)})` }} />
                      ) : (
                        <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-2xl border-[3px] border-dashed border-ink/45 bg-cream-2 font-display text-3xl text-ink/40 sm:size-20">
                          ?
                        </span>
                      )}
                      <span aria-hidden className={`mt-1 block text-sm font-semibold leading-tight ${has ? "text-ink" : "text-ink-soft"}`}>
                        {has ? names[id] : copy.unknown}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
