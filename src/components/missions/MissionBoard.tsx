"use client";

import { forwardRef, useEffect, useState } from "react";
import { PlayIcon, RestartIcon, TrophyIcon } from "@/components/art/Icons";
import { IntentLink } from "@/components/ui/IntentLink";
import { InkButton, inkStyle } from "@/components/ui/Primitives";
import { useSound } from "@/lib/audio/hooks";
import { fetchMissionBoard } from "@/lib/missions/client";
import { dayName, dayStamp, formatMissionBest, formatPlace } from "@/lib/missions/format";
import type { MissionBoardEntry, MissionBoardResponse } from "@/lib/missions/types";
import { missionHref } from "./parts";

type Loaded = { key: string; data: MissionBoardResponse | null };

const PLACE_COLOR = ["text-sun", "text-cream", "text-tangerine"];

function Row({ entry, game }: { entry: Pick<MissionBoardEntry, "position" | "nickname" | "tag" | "you" | "metrics">; game: MissionBoardResponse["mission"]["game"] }) {
  return (
    <tr className={entry.you ? "bg-sun/15" : "odd:bg-white/[0.03]"}>
      <td className={`rounded-l-lg py-1.5 pl-2 pr-1 font-display text-lg leading-none ${PLACE_COLOR[entry.position - 1] ?? "text-plum-300"}`}>
        <span className="inline-flex items-center gap-1">
          {entry.position === 1 ? <TrophyIcon className="size-4" /> : null}
          {entry.position.toLocaleString("pt-BR")}º
        </span>
      </td>
      <td className="px-1 py-1.5">
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="font-semibold text-cream">{entry.nickname}</span>
          <span className="copy-sm text-plum-300">#{entry.tag}</span>
          {entry.you ? <span className="rounded border-2 border-ink bg-sun px-1 font-display text-[10px] uppercase leading-4 tracking-wider text-ink">Você</span> : null}
        </span>
      </td>
      <td className="copy-sm whitespace-nowrap rounded-r-lg px-1 py-1.5 pr-2 text-right text-cream-2">{formatMissionBest(game, entry.metrics)}</td>
    </tr>
  );
}

function EmptyBoard({ closed, href }: { closed: boolean; href: string | null }) {
  return (
    <div className="grid items-center gap-5 py-2 sm:grid-cols-[minmax(0,13rem)_1fr]">
      <ol aria-hidden className="flex flex-col gap-1.5">
        {[1, 2, 3].map((position) => (
          <li key={position} className="flex items-center gap-2 rounded-lg border-2 border-dashed border-plum-500 px-2.5 py-1.5">
            <span className={`inline-flex w-10 items-center gap-1 font-display text-lg leading-none ${PLACE_COLOR[position - 1]}`}>
              {position === 1 ? <TrophyIcon className="size-4" /> : null}
              {position}º
            </span>
            <span className="copy-sm text-plum-300">{closed ? "Ninguém" : "Vago"}</span>
          </li>
        ))}
      </ol>
      <div className="text-center sm:text-left">
        <p className="font-display text-xl uppercase leading-tight tracking-wide text-lime">{closed ? "Placar em branco" : "O primeiro lugar está vago"}</p>
        <p className="copy mt-1 text-cream-2">
          {closed ? "Ninguém cumpriu essa missão. Acontece até nas melhores emissoras." : "Ninguém cumpriu a missão ainda. Quem cumprir primeiro estreia no topo do placar."}
        </p>
        {href ? (
          <IntentLink href={href} className={inkStyle("sun", "sm", "mt-3")}>
            <PlayIcon className="size-4" /> Ser o primeiro
          </IntentLink>
        ) : null}
      </div>
    </div>
  );
}

type Props = { day: string | null; today: string; refreshKey: string; onDay: (day: string | null) => void };

export const MissionBoard = forwardRef<HTMLElement, Props>(function MissionBoard({ day, today, refreshKey, onDay }, ref) {
  const [page, setPage] = useState({ day, value: 1 });
  const current = page.day === day ? page.value : 1;
  const key = `${day ?? today}/${current}/${refreshKey}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { play } = useSound();

  useEffect(() => {
    let cancelled = false;
    void fetchMissionBoard(day, current).then((data) => {
      if (!cancelled) setLoaded({ key: `${key}/${attempt}`, data });
    });
    return () => {
      cancelled = true;
    };
  }, [day, current, key, attempt]);

  const view = loaded?.key === `${key}/${attempt}` ? loaded.data : undefined;
  const shownDay = view?.mission.day ?? day ?? today;
  const stamp = dayStamp(shownDay);
  const isToday = shownDay === today;
  const outside = view?.you && !view.entries.some((e) => e.you) ? view.you : null;

  const go = (next: string | null) => {
    play("click");
    onDay(next && next !== today ? next : null);
  };

  const turn = (value: number) => {
    play("click");
    setPage({ day, value });
  };

  return (
    <section ref={ref} aria-labelledby="mission-board-title" className="on-dark relative scroll-mt-24 overflow-hidden rounded-2xl border-[3px] border-ink bg-[#10122e] p-4 text-cream shadow-[var(--shadow-ink)]">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="mission-board-title" className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-sun">
            <TrophyIcon className="size-5" /> Placar do dia
          </h2>
          <nav aria-label="Dias da missão" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(view?.previousDay ?? null)}
              disabled={!view?.previousDay}
              aria-label={view?.previousDay ? `Dia anterior: ${dayName(view.previousDay)}` : "Dia anterior"}
              className="press grid size-9 place-items-center rounded-lg border-[3px] border-ink bg-cream font-display text-lg text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            <p className="min-w-[6.5rem] rounded-lg border-[3px] border-ink bg-plum-800 px-2 py-0.5 text-center font-display text-sm uppercase tracking-wider text-screen">
              <time dateTime={shownDay}>
                {isToday ? "Hoje" : stamp.weekday} · {stamp.date}
              </time>
            </p>
            <button
              type="button"
              onClick={() => go(view?.nextDay ?? null)}
              disabled={!view?.nextDay}
              aria-label={view?.nextDay ? `Dia seguinte: ${dayName(view.nextDay)}` : "Dia seguinte"}
              className="press grid size-9 place-items-center rounded-lg border-[3px] border-ink bg-cream font-display text-lg text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </nav>
        </div>
        {view ? (
          <p className="copy-sm mt-1 text-cream-2">
            {isToday ? "" : `${view.mission.title} · `}
            {view.closed ? (
              <span className="font-display uppercase tracking-wider text-bubblegum">Resultado final</span>
            ) : (
              <span className="inline-flex items-center gap-1 font-display uppercase tracking-wider text-lime">
                <span aria-hidden className="size-2 animate-pulse rounded-full bg-lime" /> Ao vivo até 1h
              </span>
            )}
          </p>
        ) : null}

        <div aria-busy={view === undefined} className="mt-3">
          {view === undefined ? (
            <p role="status" className="py-6 text-center font-display uppercase tracking-wider text-sun">
              Sintonizando o placar…
            </p>
          ) : view === null ? (
            <div className="flex flex-col items-center gap-2 py-5 text-center">
              <p className="font-display uppercase tracking-wider text-tomato">Sem sinal do placar</p>
              <InkButton size="sm" tone="sun" onClick={() => setAttempt((a) => a + 1)}>
                <RestartIcon className="size-4" /> Tentar de novo
              </InkButton>
            </div>
          ) : !view.mission.ranked ? (
            <p className="copy py-5 text-center text-cream-2">Essa missão não teve placar: valia só cumprir.</p>
          ) : view.entries.length === 0 ? (
            <EmptyBoard closed={view.closed} href={isToday && !view.closed ? missionHref(view.mission) : null} />
          ) : (
            <>
              {view.closed && view.page === 1 && view.total >= 2 ? (
                <p className="copy-sm mb-2 rounded-lg border-2 border-ink bg-bubblegum px-2 py-1 text-ink">
                  <span className="tag-label">Campeão do dia: </span>
                  {view.entries[0].nickname} #{view.entries[0].tag}
                </p>
              ) : null}
              <table className="w-full border-separate border-spacing-y-1 text-left">
                <caption className="sr-only">
                  Placar da Missão 404 de {dayName(shownDay)}, página {view.page} de {view.pages}
                </caption>
                <thead>
                  <tr className="tag-label text-plum-300">
                    <th scope="col" className="w-12 pl-2 font-normal">
                      Pos.
                    </th>
                    <th scope="col" className="px-1 font-normal">
                      Apelido
                    </th>
                    <th scope="col" className="px-1 pr-2 text-right font-normal">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {view.entries.map((entry) => (
                    <Row key={`${entry.position}-${entry.tag}`} entry={entry} game={view.mission.game} />
                  ))}
                  {outside ? (
                    <>
                      <tr aria-hidden>
                        <td colSpan={3} className="py-0.5 text-center font-display tracking-[0.5em] text-plum-300">
                          ···
                        </td>
                      </tr>
                      <Row entry={{ position: outside.position, nickname: outside.nickname, tag: outside.tag, you: true, metrics: outside.metrics }} game={view.mission.game} />
                    </>
                  ) : null}
                </tbody>
              </table>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="copy-sm text-plum-300">{view.total === 1 ? "1 pessoa no placar" : `${view.total.toLocaleString("pt-BR")} pessoas no placar`}</p>
                {view.pages > 1 ? (
                  <nav aria-label="Páginas do placar" className="flex items-center gap-2">
                    <InkButton size="sm" tone="cream" disabled={view.page <= 1} onClick={() => turn(view.page - 1)} aria-label="Página anterior">
                      ‹
                    </InkButton>
                    <p aria-live="polite" className="font-display text-xs uppercase tracking-wider text-cream-2">
                      Página {view.page} de {view.pages}
                    </p>
                    <InkButton size="sm" tone="cream" disabled={view.page >= view.pages} onClick={() => turn(view.page + 1)} aria-label="Próxima página">
                      ›
                    </InkButton>
                  </nav>
                ) : null}
              </div>
              {view.you && !view.closed ? <p className="copy-sm mt-1 text-cream-2">Seu lugar hoje: {formatPlace(view.you.position, view.you.total)}.</p> : null}
            </>
          )}
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-40" />
    </section>
  );
});
