"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { StarBadge } from "@/components/art/Badges";
import { MissionIcon, OfflineIcon } from "@/components/art/Icons";
import { StateChip, missionPlace } from "@/components/missions/parts";
import { missionAchievement } from "@/lib/missions/achievements";
import { describeShortfall, missionNotes } from "@/lib/missions/goals";
import { dayName, formatMissionBest, formatPlace } from "@/lib/missions/format";
import type { MissionState, MissionView } from "@/lib/missions/types";
import type { BoardState } from "./BoardLine";

type Line = { tone: "done" | "miss" | "wait" | "off"; headline: string; text: string; stamp?: boolean };

export function describeMission(view: MissionView, board: BoardState | null): Line {
  if (!board) return { tone: "off", headline: "Fora do placar", text: "O placar do canal não está no ar, então esta partida não conta para a missão." };
  if (board.phase === "sending") return { tone: "wait", headline: "Conferindo a missão…", text: "O canal está checando sua partida." };
  if (board.phase === "join") return { tone: "wait", headline: "Falta seu apelido", text: "Escolha um apelido no placar abaixo para a missão contar." };
  const outcome = board.outcome;
  switch (outcome.kind) {
    case "accepted": {
      const mission = outcome.response.mission;
      if (!mission) return { tone: "off", headline: "Fora da missão", text: "Esta partida não entrou na missão. Ela pode ter trocado enquanto você jogava." };
      if (mission.status === "late") return { tone: "off", headline: "A missão já tinha mudado", text: `A partida chegou depois do fim da missão de ${dayName(mission.day)}. Ela vale só para o placar normal.` };
      if (mission.status === "missed") {
        const why = mission.shortfall ? describeShortfall({ passed: false, ...mission.shortfall }, view.game) : "A partida não cumpriu o que a missão pede.";
        return { tone: "miss", headline: "Missão não cumprida", text: `${why} Dá para tentar de novo até a meia-noite.` };
      }
      const best = mission.best ? `${formatMissionBest(view.game, mission.best.metrics)}, ${formatPlace(mission.best.position, mission.best.total)} no placar do dia` : null;
      if (mission.firstTime) return { tone: "done", headline: "Missão cumprida!", text: best ? `${best[0].toUpperCase()}${best.slice(1)}.` : "Ela já entrou no seu boletim.", stamp: true };
      if (mission.improved) return { tone: "done", headline: "Seu melhor do dia!", text: best ? `Missão cumprida de novo, e melhor: ${best}.` : "Missão cumprida de novo, e melhor." };
      return { tone: "done", headline: "Missão já cumprida hoje", text: best ? `Esta partida não superou seu melhor: ${best}.` : "Ela já está no seu boletim." };
    }
    case "rejected":
      return { tone: "off", headline: "Não valeu", text: "O placar não aceitou este resultado, então a missão também não conta." };
    case "queued":
      return { tone: "off", headline: "Sem sinal", text: "Guardamos o resultado. Ele vale para a missão se chegar ao canal até 1h da manhã." };
    case "not-joined":
      return { tone: "wait", headline: "Falta seu apelido", text: "Escolha um apelido no placar abaixo para a missão contar." };
    case "unranked":
      if (outcome.why === "expired") return { tone: "off", headline: "Chegou tarde", text: "Esse resultado demorou demais para chegar ao canal." };
      if (outcome.why === "limited") return { tone: "off", headline: "Calma!", text: outcome.message ?? "Muitos envios seguidos. Espere um pouco." };
      return { tone: "off", headline: "Sem sinal", text: "O canal estava fora do ar quando a partida começou. Esta tentativa não conta para a missão." };
  }
}

const TONES = {
  done: "bg-lime",
  miss: "bg-sun",
  wait: "bg-cream-2",
  off: "bg-cream-2",
} as const;

export function MissionLine({ view, board }: { view: MissionView; board: BoardState | null }) {
  const line = describeMission(view, board);
  const still = useReducedMotion();
  const unlocked = board?.phase === "done" && board.outcome.kind === "accepted" ? (board.outcome.response.mission?.achievements ?? []) : [];
  return (
    <motion.section
      aria-label="Missão 404 do dia"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`relative mt-4 rounded-xl border-[3px] border-ink p-3 text-ink shadow-[var(--shadow-ink-sm)] ${TONES[line.tone]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-tomato px-1.5 font-display text-xs uppercase leading-5 tracking-wider text-ink">
          <MissionIcon className="size-3.5" /> Missão 404
        </span>
        <span className="truncate font-display text-xs uppercase tracking-wider text-ink-soft">{view.title}</span>
      </div>
      <div role="status" className="mt-1.5 leading-snug">
        <p className="flex flex-wrap items-center gap-2 font-display text-xl uppercase tracking-wide">
          {line.tone === "off" ? <OfflineIcon className="size-5" /> : null}
          {line.headline}
        </p>
        <p className="copy font-semibold">{line.text}</p>
        {unlocked.length ? (
          <ul aria-label="Novas conquistas" className="mt-2 flex flex-wrap gap-2">
            {unlocked.map((id, i) => {
              const def = missionAchievement(id);
              return (
                <motion.li
                  key={id}
                  initial={still ? false : { scale: 0.6, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: i % 2 ? 1.5 : -1.5 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18, delay: 1 + i * 0.2 }}
                  className="flex items-center gap-2 rounded-lg border-[3px] border-ink bg-paper py-1 pl-1 pr-2.5 shadow-[var(--shadow-ink-sm)]"
                >
                  <StarBadge color={def.color} className="w-8 shrink-0" />
                  <span className="leading-tight">
                    <span className="block font-display text-[11px] uppercase tracking-wider text-ink-soft">Nova conquista</span>
                    <span className="block font-display text-base uppercase tracking-wide">{def.title}</span>
                  </span>
                </motion.li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {line.stamp ? (
        <motion.span
          aria-hidden
          initial={still ? false : { scale: 2.4, rotate: 30, opacity: 0 }}
          animate={{ scale: 1, rotate: 8, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 15, delay: 0.75 }}
          className="absolute -right-3 -top-4 rounded-lg border-[3px] border-ink bg-tomato px-2 font-display text-sm uppercase leading-7 tracking-wider text-ink shadow-[var(--shadow-ink-sm)]"
        >
          Cumprida!
        </motion.span>
      ) : null}
      {line.tone === "done" || line.tone === "miss" ? (
        <Link href="/mission" className="mt-2 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wider text-ink underline decoration-2 underline-offset-4 hover:decoration-4">
          <MissionIcon className="size-4" /> Ver a Missão 404
        </Link>
      ) : null}
    </motion.section>
  );
}

export function MissionBrief({ view, state }: { view: MissionView; state: MissionState | null }) {
  const place = missionPlace(view);
  const notes = missionNotes(view);
  return (
    <section aria-labelledby="mission-brief-title" className="on-dark mt-4 overflow-hidden rounded-xl border-[3px] border-ink bg-plum-800 text-cream shadow-[var(--shadow-ink-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-tomato px-3 py-1">
        <p className="flex items-center gap-2 font-display text-sm uppercase tracking-wider text-ink">
          <span className="rounded bg-ink px-1.5 text-[11px] leading-5 text-sun">Plantão</span>
          Missão 404 do dia
        </p>
        {state ? <StateChip state={state} className="!shadow-none" /> : null}
      </div>
      <div className="p-3 sm:p-4">
        {place.level ? <p className="font-display text-xs uppercase tracking-wider text-plum-300">{place.level}</p> : null}
        <h2 id="mission-brief-title" className="font-display text-3xl uppercase leading-none tracking-wide text-sun">
          {view.title}
        </h2>
        <p className="copy-lede mt-1.5 text-cream">{view.objective}</p>
        {notes.length ? (
          <ul className="copy-sm mt-2 space-y-1 border-t-2 border-dashed border-plum-500 pt-2 text-cream-2">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
