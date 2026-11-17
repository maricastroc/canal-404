"use client";

import Link from "@/i18n/Link";
import { motion, useReducedMotion } from "motion/react";
import { StarBadge } from "@/components/art/Badges";
import { MissionIcon, OfflineIcon } from "@/components/art/Icons";
import { StateChip, missionPlace } from "@/components/missions/parts";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
import { serverMessage } from "@/lib/competition/errors";
import { missionAchievement } from "@/lib/missions/achievements";
import { describeShortfall, missionNotes } from "@/lib/missions/goals";
import { dayName, formatMissionBest, formatPlace } from "@/lib/missions/format";
import { missionText } from "@/lib/missions/text";
import type { MissionState, MissionView } from "@/lib/missions/types";
import type { BoardState } from "./BoardLine";

type Line = { tone: "done" | "miss" | "wait" | "off"; headline: string; text: string; stamp?: boolean };

const COPY = localized({
  "pt-BR": {
    offTitle: "Fora do placar",
    off: "O placar do canal não está no ar, então esta partida não conta para a missão.",
    checkingTitle: "Conferindo a missão…",
    checking: "O canal está checando sua partida.",
    nicknameTitle: "Falta seu apelido",
    nickname: "Escolha um apelido no placar abaixo para a missão contar.",
    outsideTitle: "Fora da missão",
    outside: "Esta partida não entrou na missão. Ela pode ter trocado enquanto você jogava.",
    lateTitle: "A missão já tinha mudado",
    late: (day: string) => `A partida chegou depois do fim da missão de ${day}. Ela vale só para o placar normal.`,
    missed: "A partida não cumpriu o que a missão pede.",
    missedTitle: "Missão não cumprida",
    retry: (why: string) => `${why} Dá para tentar de novo até a meia-noite.`,
    best: (best: string, place: string) => `${best}, ${place} no placar do dia`,
    doneTitle: "Missão cumprida!",
    inReport: "Ela já entrou no seu boletim.",
    improvedTitle: "Seu melhor do dia!",
    improved: (best: string | null) => (best ? `Missão cumprida de novo, e melhor: ${best}.` : "Missão cumprida de novo, e melhor."),
    againTitle: "Missão já cumprida hoje",
    again: (best: string | null) => (best ? `Esta partida não superou seu melhor: ${best}.` : "Ela já está no seu boletim."),
    rejectedTitle: "Não valeu",
    rejected: "O placar não aceitou este resultado, então a missão também não conta.",
    noSignalTitle: "Sem sinal",
    queued: "Guardamos o resultado. Ele vale para a missão se chegar ao canal até 1h da manhã.",
    expiredTitle: "Chegou tarde",
    expired: "Esse resultado demorou demais para chegar ao canal.",
    limitedTitle: "Calma!",
    limited: "Muitos envios seguidos. Espere um pouco.",
    noTicket: "O canal estava fora do ar quando a partida começou. Esta tentativa não conta para a missão.",
    label: "Missão 404 do dia",
    short: "Missão 404",
    newAchievements: "Novas conquistas",
    newAchievement: "Nova conquista",
    stamp: "Cumprida!",
    see: "Ver a Missão 404",
    bulletin: "Plantão",
  },
  en: {
    offTitle: "Off the board",
    off: "The channel's board isn't on the air, so this run doesn't count for the mission.",
    checkingTitle: "Checking the mission…",
    checking: "The channel is checking your run.",
    nicknameTitle: "Pick a nickname",
    nickname: "Pick a nickname on the board below so the mission counts.",
    outsideTitle: "Not part of the mission",
    outside: "This run didn't count for the mission. It may have changed while you were playing.",
    lateTitle: "The mission had already changed",
    late: (day: string) => `The run arrived after the mission for ${day} ended. It only counts for the regular board.`,
    missed: "The run didn't do what the mission asks for.",
    missedTitle: "Mission not complete",
    retry: (why: string) => `${why} You can try again until midnight in Brazil (UTC−3).`,
    best: (best: string, place: string) => `${best}, ${place} on today's board`,
    doneTitle: "Mission complete!",
    inReport: "It's already on your report card.",
    improvedTitle: "Your best today!",
    improved: (best: string | null) => (best ? `Mission complete again, and better: ${best}.` : "Mission complete again, and better."),
    againTitle: "Mission already complete today",
    again: (best: string | null) => (best ? `This run didn't beat your best: ${best}.` : "It's already on your report card."),
    rejectedTitle: "Didn't count",
    rejected: "The board didn't accept this result, so it doesn't count for the mission either.",
    noSignalTitle: "No signal",
    queued: "We saved the result. It counts for the mission if it reaches the channel by 1 a.m. in Brazil (UTC−3).",
    expiredTitle: "Too late",
    expired: "This result took too long to reach the channel.",
    limitedTitle: "Easy there!",
    limited: "Too many submissions in a row. Wait a little.",
    noTicket: "The channel was off the air when the run started. This attempt doesn't count for the mission.",
    label: "Mission 404 of the Day",
    short: "Mission 404",
    newAchievements: "New achievements",
    newAchievement: "New achievement",
    stamp: "Done!",
    see: "See Mission 404",
    bulletin: "Bulletin",
  },
});

export function describeMission(view: MissionView, board: BoardState | null, locale: Locale): Line {
  const copy = COPY[locale];
  if (!board) return { tone: "off", headline: copy.offTitle, text: copy.off };
  if (board.phase === "sending") return { tone: "wait", headline: copy.checkingTitle, text: copy.checking };
  if (board.phase === "join") return { tone: "wait", headline: copy.nicknameTitle, text: copy.nickname };
  const outcome = board.outcome;
  switch (outcome.kind) {
    case "accepted": {
      const mission = outcome.response.mission;
      if (!mission) return { tone: "off", headline: copy.outsideTitle, text: copy.outside };
      if (mission.status === "late") return { tone: "off", headline: copy.lateTitle, text: copy.late(dayName(mission.day, locale)) };
      if (mission.status === "missed") {
        const why = mission.shortfall ? describeShortfall({ passed: false, ...mission.shortfall }, view.game, locale) : copy.missed;
        return { tone: "miss", headline: copy.missedTitle, text: copy.retry(why) };
      }
      const best = mission.best ? copy.best(formatMissionBest(view.game, mission.best.metrics, locale), formatPlace(mission.best.position, mission.best.total, locale)) : null;
      if (mission.firstTime) return { tone: "done", headline: copy.doneTitle, text: best ? `${best[0].toUpperCase()}${best.slice(1)}.` : copy.inReport, stamp: true };
      if (mission.improved) return { tone: "done", headline: copy.improvedTitle, text: copy.improved(best) };
      return { tone: "done", headline: copy.againTitle, text: copy.again(best) };
    }
    case "rejected":
      return { tone: "off", headline: copy.rejectedTitle, text: copy.rejected };
    case "queued":
      return { tone: "off", headline: copy.noSignalTitle, text: copy.queued };
    case "not-joined":
      return { tone: "wait", headline: copy.nicknameTitle, text: copy.nickname };
    case "unranked":
      if (outcome.why === "expired") return { tone: "off", headline: copy.expiredTitle, text: copy.expired };
      if (outcome.why === "limited") return { tone: "off", headline: copy.limitedTitle, text: serverMessage(outcome.error, copy.limited, locale) };
      return { tone: "off", headline: copy.noSignalTitle, text: copy.noTicket };
  }
}

const TONES = {
  done: "bg-lime",
  miss: "bg-sun",
  wait: "bg-cream-2",
  off: "bg-cream-2",
} as const;

export function MissionLine({ view, board }: { view: MissionView; board: BoardState | null }) {
  const copy = useCopy(COPY);
  const locale = useLocale();
  const line = describeMission(view, board, locale);
  const still = useReducedMotion();
  const unlocked = board?.phase === "done" && board.outcome.kind === "accepted" ? (board.outcome.response.mission?.achievements ?? []) : [];
  return (
    <motion.section
      aria-label={copy.label}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`relative mt-4 rounded-xl border-[3px] border-ink p-3 text-ink shadow-[var(--shadow-ink-sm)] ${TONES[line.tone]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-tomato px-1.5 font-display text-xs uppercase leading-5 tracking-wider text-ink">
          <MissionIcon className="size-3.5" /> {copy.short}
        </span>
        <span className="truncate font-display text-xs uppercase tracking-wider text-ink-soft">{missionText(view, locale).title}</span>
      </div>
      <div role="status" className="mt-1.5 leading-snug">
        <p className="flex flex-wrap items-center gap-2 font-display text-xl uppercase tracking-wide">
          {line.tone === "off" ? <OfflineIcon className="size-5" /> : null}
          {line.headline}
        </p>
        <p className="copy font-semibold">{line.text}</p>
        {unlocked.length ? (
          <ul aria-label={copy.newAchievements} className="mt-2 flex flex-wrap gap-2">
            {unlocked.map((id, i) => {
              const def = missionAchievement(id, locale);
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
                    <span className="block font-display text-[11px] uppercase tracking-wider text-ink-soft">{copy.newAchievement}</span>
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
          {copy.stamp}
        </motion.span>
      ) : null}
      {line.tone === "done" || line.tone === "miss" ? (
        <Link href="/mission" className="mt-2 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wider text-ink underline decoration-2 underline-offset-4 hover:decoration-4">
          <MissionIcon className="size-4" /> {copy.see}
        </Link>
      ) : null}
    </motion.section>
  );
}

export function MissionBrief({ view, state }: { view: MissionView; state: MissionState | null }) {
  const copy = useCopy(COPY);
  const locale = useLocale();
  const place = missionPlace(view, locale);
  const notes = missionNotes(view, locale);
  const text = missionText(view, locale);
  return (
    <section aria-labelledby="mission-brief-title" className="on-dark mt-4 overflow-hidden rounded-xl border-[3px] border-ink bg-plum-800 text-cream shadow-[var(--shadow-ink-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-tomato px-3 py-1">
        <p className="flex items-center gap-2 font-display text-sm uppercase tracking-wider text-ink">
          <span className="rounded bg-ink px-1.5 text-[11px] leading-5 text-sun">{copy.bulletin}</span>
          {copy.label}
        </p>
        {state ? <StateChip state={state} className="!shadow-none" /> : null}
      </div>
      <div className="p-3 sm:p-4">
        {place.level ? <p className="font-display text-xs uppercase tracking-wider text-plum-300">{place.level}</p> : null}
        <h2 id="mission-brief-title" className="font-display text-3xl uppercase leading-none tracking-wide text-sun">
          {text.title}
        </h2>
        <p className="copy-lede mt-1.5 text-cream">{text.objective}</p>
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
