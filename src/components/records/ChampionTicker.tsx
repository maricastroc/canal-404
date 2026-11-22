"use client";

import Link from "@/i18n/Link";
import { useEffect, useState } from "react";
import { TrophyIcon } from "@/components/art/Icons";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { useSound } from "@/lib/audio/hooks";
import type { GameSlug } from "@/lib/competition/boards";
import { pickBoard, rankedLevels } from "@/lib/competition/choice";
import { fetchBoard } from "@/lib/competition/client";
import { formatBest } from "@/lib/competition/format";
import { useCompetition } from "@/lib/competition/hooks";
import { recordsHref } from "@/lib/competition/links";
import type { BoardEntry } from "@/lib/competition/types";
import { boardNickname } from "@/lib/competition/nickname";

type Fetched = { key: string; ok: boolean; leader: BoardEntry | null };

const COPY = localized({
  "pt-BR": {
    word: { fase: "Fase", arena: "Arena", pista: "Pista", parte: "Parte", música: "Música" },
    tuning: "Sintonizando o placar…",
    arcade: "Ver o fliperama de recordes",
    empty: "Ainda não tem ninguém no quadro dos campeões. Que tal ser o primeiro?",
    title: "Quadro dos campeões",
  },
  en: {
    word: { fase: "Level", arena: "Arena", pista: "Track", parte: "Part", música: "Song" },
    tuning: "Tuning in the board…",
    arcade: "Visit the record arcade",
    empty: "Nobody's in the hall of champions yet. How about being the first?",
    title: "Hall of champions",
  },
});

export function ChampionTicker({ slug, levelWord = "fase" }: { slug: GameSlug; levelWord?: "fase" | "arena" | "pista" | "parte" | "música" }) {
  const { play } = useSound();
  const copy = useCopy(COPY);
  const locale = useLocale();
  const competition = useCompetition();
  const { level } = pickBoard(slug, null);
  const key = `${slug}/${level ?? "all"}`;
  const reachable = competition.status === "online" || competition.status === "offline";
  const [fetched, setFetched] = useState<Fetched | null>(null);

  useEffect(() => {
    if (!reachable) return;
    let cancelled = false;
    void fetchBoard(slug, level, 1).then((data) => {
      if (!cancelled) setFetched({ key, ok: data !== null, leader: data?.entries[0] ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [reachable, slug, level, key]);

  if (competition.status === "unconfigured") return null;
  const current = fetched?.key === key ? fetched : null;
  const levelInfo = rankedLevels(slug, locale)?.find((l) => l.id === level);
  const where = levelInfo ? `${copy.word[levelWord]} ${levelInfo.number}: ${levelInfo.title}` : null;
  const text = !current
    ? copy.tuning
    : !current.ok
      ? copy.arcade
      : current.leader
        ? `${boardNickname(current.leader.nickname)} #${current.leader.tag} · ${formatBest(slug, current.leader.metrics, locale)}`
        : copy.empty;

  return (
    <Link
      href={recordsHref(slug, level)}
      onClick={() => play("click")}
      className="press on-dark relative flex items-center gap-3 self-start overflow-hidden rounded-xl border-[3px] border-ink bg-plum-900 py-2 pl-3 pr-4 text-cream shadow-[var(--shadow-ink-sm)]"
    >
      <TrophyIcon className="size-7 text-sun" />
      <span className="relative z-10 flex flex-col">
        <span className="font-display text-[11px] uppercase tracking-widest text-sun">
          {copy.title}
          {where ? ` · ${where}` : ""}
        </span>
        <span className="font-semibold leading-snug">{text}</span>
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-40" />
    </Link>
  );
}
