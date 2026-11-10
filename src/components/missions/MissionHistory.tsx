"use client";

import { useEffect, useState } from "react";
import { TapeIcon } from "@/components/art/Icons";
import { InkButton } from "@/components/ui/Primitives";
import { fetchMissionHistory } from "@/lib/missions/client";
import { dayStamp, formatMissionBest, formatPlace } from "@/lib/missions/format";
import type { MissionHistoryItem } from "@/lib/missions/types";
import { missionPlace, StateChip } from "./parts";

type Loaded = { key: string; items: MissionHistoryItem[]; next: string | null; failed: boolean };

function Tape({ item, onBoard }: { item: MissionHistoryItem; onBoard: (day: string) => void }) {
  const { mission, you } = item;
  const stamp = dayStamp(mission.day);
  const place = missionPlace(mission);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border-[3px] border-ink bg-[#221c3a] p-2 shadow-[var(--shadow-ink-sm)] sm:flex-nowrap">
      <time dateTime={mission.day} className="grid w-16 shrink-0 place-items-center rounded border-2 border-ink bg-[#10122e] py-1 font-display leading-tight text-screen">
        <span className="text-[11px] tracking-widest">{stamp.weekday}</span>
        <span className="text-base tabular-nums">{stamp.date}</span>
      </time>
      <div className="min-w-0 flex-1 basis-48 -rotate-[0.4deg] rounded-sm border-2 border-ink/40 bg-paper px-3 py-1 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_21px,rgb(92_185_240/0.35)_21px,rgb(92_185_240/0.35)_22px)]">
        <p className="truncate font-hand text-lg leading-snug text-ink">{mission.title}</p>
        <p className="truncate text-xs font-semibold text-ink-soft">
          {place.game}
          {place.level ? ` · ${place.level}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <StateChip state={you.state} />
        {you.best ? (
          <p className="text-xs font-semibold text-cream-2">
            {formatMissionBest(mission.game, you.best.metrics)} · {formatPlace(you.best.position, you.best.total)}
          </p>
        ) : you.attempts > 0 ? (
          <p className="text-xs font-semibold text-cream-2">{you.attempts === 1 ? "1 tentativa" : `${you.attempts} tentativas`}</p>
        ) : null}
        {mission.ranked ? (
          <button
            type="button"
            onClick={() => onBoard(mission.day)}
            className="font-display text-[11px] uppercase tracking-wider text-sun underline decoration-2 underline-offset-2 hover:text-cream"
          >
            Ver placar<span className="sr-only"> de {mission.title}</span>
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function MissionHistory({ playerId, today, onBoard }: { playerId: string; today: string; onBoard: (day: string) => void }) {
  const key = `${playerId}/${today}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMissionHistory(null, 8).then((page) => {
      if (!cancelled) setLoaded({ key, items: page?.entries ?? [], next: page?.next ?? null, failed: !page });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const current = loaded?.key === key ? loaded : null;
  const past = current?.items.filter((item) => item.mission.day !== today) ?? [];

  const more = async () => {
    if (!current?.next) return;
    setBusy(true);
    const page = await fetchMissionHistory(current.next, 8);
    setBusy(false);
    if (page) setLoaded({ key, items: [...current.items, ...page.entries], next: page.next, failed: false });
  };

  return (
    <section aria-labelledby="mission-history-title" className="mt-10">
      <h2 id="mission-history-title" className="flex items-center gap-2 font-display text-3xl uppercase tracking-wide text-cream [text-shadow:3px_4px_0_var(--color-ink)]">
        <TapeIcon className="size-8 text-sun" /> Fitas gravadas
      </h2>
      <p className="mt-1 font-hand text-lg text-cream-2">As missões que você já jogou ficam guardadas aqui.</p>
      <div aria-busy={!current} className="mt-4">
        {!current ? (
          <p className="font-display uppercase tracking-wider text-cream-2">Rebobinando…</p>
        ) : current.failed ? (
          <p className="font-semibold text-cream-2">Não deu para buscar suas fitas agora.</p>
        ) : past.length === 0 ? (
          <p className="rounded-xl border-[3px] border-dashed border-cream/40 px-4 py-5 text-center font-semibold text-cream-2">
            Nenhuma fita gravada ainda. Volte amanhã: cada missão jogada vira uma fita nesta estante.
          </p>
        ) : (
          <ul className="grid gap-2.5 lg:grid-cols-2">
            {past.map((item) => (
              <Tape key={item.mission.day} item={item} onBoard={onBoard} />
            ))}
          </ul>
        )}
        {current?.next ? (
          <InkButton tone="cream" size="sm" className="mt-4" onClick={more} disabled={busy}>
            {busy ? "Rebobinando…" : "Mais fitas"}
          </InkButton>
        ) : null}
      </div>
    </section>
  );
}
