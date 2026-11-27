"use client";

import { RatingStar } from "@/components/art/Icons";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { formatNumber } from "@/i18n/format";
import { useHydrated, useProgress } from "@/lib/progress/hooks";

const COPY = localized({
  "pt-BR": {
    stars: (n: number) => `${n} de 3 estrelas`,
    levels: { fase: "Fases", arena: "Arenas", pista: "Pistas", etapa: "Etapas", música: "Músicas" },
    starsLabel: "Estrelas",
    plays: "Partidas",
    record: "Recorde",
    wins: "Vitórias",
    best: "Melhor",
  },
  en: {
    stars: (n: number) => `${n} of 3 stars`,
    levels: { fase: "Levels", arena: "Arenas", pista: "Tracks", etapa: "Stages", música: "Songs" },
    starsLabel: "Stars",
    plays: "Plays",
    record: "Record",
    wins: "Wins",
    best: "Best",
  },
});

function Stars({ count }: { count: number }) {
  const copy = useCopy(COPY);
  return (
    <span role="img" className="inline-flex gap-0.5" aria-label={copy.stars(count)}>
      {[0, 1, 2].map((i) => (
        <RatingStar key={i} on={i < count} className="size-6" />
      ))}
    </span>
  );
}

export function GameStats({ slug, levels, levelWord = "fase" }: { slug: string; levels?: { id: string }[]; levelWord?: "fase" | "arena" | "pista" | "etapa" | "música" }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const locale = useLocale();
  const copy = COPY[locale];
  const record = hydrated ? progress.games[slug] : undefined;
  if (levels) {
    const done = levels.filter((l) => (record?.levels?.[l.id]?.stars ?? 0) > 0).length;
    const stars = levels.reduce((acc, l) => acc + (record?.levels?.[l.id]?.stars ?? 0), 0);
    const levelItems = [
      { label: copy.levels[levelWord], value: `${done}/${levels.length}` },
      { label: copy.starsLabel, value: `${stars}/${levels.length * 3}` },
      { label: copy.plays, value: record?.plays ? String(record.plays) : "0" },
    ];
    return (
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {levelItems.map((item) => (
          <div key={item.label} className="min-w-0 rounded-lg border-[3px] border-ink bg-cream px-2 py-1.5 text-center shadow-[var(--shadow-ink-sm)] sm:min-w-24 sm:px-3">
            <p className="font-display text-[11px] uppercase tracking-widest text-ink-soft">{item.label}</p>
            <p className="font-display text-xl leading-tight text-ink tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
    );
  }
  const items = [
    { label: copy.record, value: record?.highScore ? formatNumber(record.highScore, locale) : "—" },
    { label: copy.plays, value: record?.plays ? String(record.plays) : "0" },
    { label: copy.wins, value: record?.wins ? String(record.wins) : "0" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-lg border-[3px] border-ink bg-cream px-2 py-1.5 text-center shadow-[var(--shadow-ink-sm)] sm:min-w-24 sm:px-3">
          <p className="font-display text-[11px] uppercase tracking-widest text-ink-soft">{item.label}</p>
          <p className="font-display text-xl leading-tight text-ink tabular-nums">{item.value}</p>
        </div>
      ))}
      <div className="min-w-0 rounded-lg border-[3px] border-ink bg-cream px-2 py-1.5 text-center shadow-[var(--shadow-ink-sm)] sm:px-3">
        <p className="font-display text-[11px] uppercase tracking-widest text-ink-soft">{copy.best}</p>
        <Stars count={record?.bestStars ?? 0} />
      </div>
    </div>
  );
}
