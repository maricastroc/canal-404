"use client";

import { useHydrated, useProgress } from "@/lib/progress/hooks";

function Stars({ count }: { count: number }) {
  return (
    <span role="img" className="inline-flex gap-0.5" aria-label={`${count} de 3 estrelas`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className={`text-2xl leading-none ${i < count ? "text-sun" : "text-cream-3"}`}
          style={{ textShadow: "2px 2px 0 #1d1830" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function GameStats({ slug, levels, levelWord = "fase" }: { slug: string; levels?: { id: string }[]; levelWord?: "fase" | "arena" }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const record = hydrated ? progress.games[slug] : undefined;
  if (levels) {
    const done = levels.filter((l) => (record?.levels?.[l.id]?.stars ?? 0) > 0).length;
    const stars = levels.reduce((acc, l) => acc + (record?.levels?.[l.id]?.stars ?? 0), 0);
    const levelItems = [
      { label: levelWord === "arena" ? "Arenas" : "Fases", value: `${done}/${levels.length}` },
      { label: "Estrelas", value: `${stars}/${levels.length * 3}` },
      { label: "Partidas", value: record?.plays ? String(record.plays) : "0" },
    ];
    return (
      <div className="flex flex-wrap items-center gap-3">
        {levelItems.map((item) => (
          <div key={item.label} className="min-w-24 rounded-lg border-[3px] border-ink bg-cream px-3 py-1.5 text-center shadow-[var(--shadow-ink-sm)]">
            <p className="font-display text-[11px] uppercase tracking-widest text-ink-soft">{item.label}</p>
            <p className="font-display text-xl leading-tight text-ink tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
    );
  }
  const items = [
    { label: "Recorde", value: record?.highScore ? record.highScore.toLocaleString("pt-BR") : "—" },
    { label: "Partidas", value: record?.plays ? String(record.plays) : "0" },
    { label: "Vitórias", value: record?.wins ? String(record.wins) : "0" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-24 rounded-lg border-[3px] border-ink bg-cream px-3 py-1.5 text-center shadow-[var(--shadow-ink-sm)]">
          <p className="font-display text-[11px] uppercase tracking-widest text-ink-soft">{item.label}</p>
          <p className="font-display text-xl leading-tight text-ink tabular-nums">{item.value}</p>
        </div>
      ))}
      <div className="rounded-lg border-[3px] border-ink bg-cream px-3 py-1.5 text-center shadow-[var(--shadow-ink-sm)]">
        <p className="font-display text-[11px] uppercase tracking-widest text-ink-soft">Melhor</p>
        <Stars count={record?.bestStars ?? 0} />
      </div>
    </div>
  );
}
