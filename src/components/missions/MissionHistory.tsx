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
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border-[3px] border-ink bg-[#221c3a] p-2 shadow-[var(--shadow-ink-sm)] sm:col-span-3 sm:grid sm:grid-cols-subgrid sm:p-2.5">
      <time dateTime={mission.day} className="grid w-16 shrink-0 place-items-center rounded border-2 border-ink bg-[#10122e] py-1 font-display leading-tight text-screen">
        <span className="tag-label">{stamp.weekday}</span>
        <span className="text-base tabular-nums">{stamp.date}</span>
      </time>
      <div className="min-w-0 flex-1 basis-40 -rotate-[0.4deg] rounded-sm border-2 border-ink/40 bg-paper px-3 py-1 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_21px,rgb(92_185_240/0.35)_21px,rgb(92_185_240/0.35)_22px)]">
        <p className="truncate font-hand text-lg leading-snug text-ink">{mission.title}</p>
        <p className="copy-sm text-ink-soft">
          {place.game}
          {place.level ? (
            <>
              {" "}
              <span className="inline-block">· {place.level}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:text-right">
        <StateChip state={you.state} />
        <p className="copy-sm text-cream-2">
          {you.best ? `${formatMissionBest(mission.game, you.best.metrics)} · ${formatPlace(you.best.position, you.best.total)}` : you.attempts > 0 ? (you.attempts === 1 ? "1 tentativa" : `${you.attempts} tentativas`) : null}
          {mission.ranked ? (
            <>
              {you.best || you.attempts > 0 ? " · " : null}
              <button type="button" onClick={() => onBoard(mission.day)} className="tag-label text-sun underline decoration-2 underline-offset-2 hover:text-cream">
                Ver placar<span className="sr-only"> de {mission.title}</span>
              </button>
            </>
          ) : null}
        </p>
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
    <section aria-labelledby="mission-history-title" className="rounded-2xl border-[3px] border-ink bg-plum-800 p-4 text-cream shadow-[var(--shadow-ink)] sm:p-5">
      <h2 id="mission-history-title" className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-sun">
        <TapeIcon className="size-5" /> Fitas gravadas
      </h2>
      <p className="copy-sm mt-1 text-cream-2">Cada missão que você joga vira uma fita. Rebobine para ver como ficou o placar daquele dia.</p>
      <div aria-busy={!current} className="mt-3">
        {!current ? (
          <p className="font-display uppercase tracking-wider text-cream-2">Rebobinando…</p>
        ) : current.failed ? (
          <p className="copy text-cream-2">As fitas não quiseram sair da estante agora. Tente de novo daqui a pouco.</p>
        ) : past.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border-[3px] border-dashed border-plum-500 px-4 py-4">
            <TapeIcon className="size-8 shrink-0 text-plum-300" />
            <p className="copy text-cream-2">A estante ainda está vazia. Jogue a missão de hoje e amanhã ela aparece aqui como sua primeira fita.</p>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            {past.map((item) => (
              <Tape key={item.mission.day} item={item} onBoard={onBoard} />
            ))}
          </ul>
        )}
        {current?.next ? (
          <InkButton tone="cream" size="sm" className="mt-3" onClick={more} disabled={busy}>
            {busy ? "Rebobinando…" : "Mais fitas"}
          </InkButton>
        ) : null}
      </div>
    </section>
  );
}
