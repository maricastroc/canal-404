"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { countOf } from "@/i18n/format";
import { useSound } from "@/lib/audio/hooks";
import { CATEGORY_LABELS, gamesIn, type GameCategory } from "@/games/registry";
import { GameCard } from "./GameCard";

const COPY = localized({
  "pt-BR": { filter: "Filtrar jogos por categoria", all: "Todos", found: ["jogo encontrado", "jogos encontrados"] as [string, string] },
  en: { filter: "Filter games by category", all: "All", found: ["game found", "games found"] },
});

type Filter = "all" | GameCategory;

const FILTER_TONES: Record<Filter, string> = {
  all: "bg-sun",
  action: "bg-tangerine",
  puzzle: "bg-plum-300",
  adventure: "bg-mint",
  strategy: "bg-sky",
};

export function GameCatalog() {
  const [filter, setFilter] = useState<Filter>("all");
  const { play, hover } = useSound();
  const locale = useLocale();
  const copy = COPY[locale];
  const games = gamesIn(locale);
  const categories = Array.from(new Set(games.map((g) => g.category)));
  const filters: Filter[] = ["all", ...categories];
  const visible = games.filter((g) => filter === "all" || g.category === filter);

  return (
    <div>
      <div role="group" aria-label={copy.filter} className="flex flex-wrap justify-center gap-2.5">
        {filters.map((f) => {
          const active = f === filter;
          const count = f === "all" ? games.length : games.filter((g) => g.category === f).length;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
              onClick={() => {
                play("click");
                setFilter(f);
              }}
              className={`press min-h-11 rounded-lg border-[3px] border-ink px-4 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)] ${
                active ? `${FILTER_TONES[f]} -rotate-2` : "bg-cream-2 hover:bg-cream"
              }`}
            >
              {f === "all" ? copy.all : CATEGORY_LABELS[locale][f]}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {countOf(visible.length, copy.found, locale)}
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((game, index) => (
            <motion.li
              key={game.slug}
              layout
              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              <GameCard game={game} index={index} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
