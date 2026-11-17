"use client";

import Link from "@/i18n/Link";
import { LockedBadge, StarBadge } from "@/components/art/Badges";
import { CardIcon, VerifiedIcon } from "@/components/art/Icons";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { countOf, formatNumber } from "@/i18n/format";
import { missionAchievements } from "@/lib/missions/achievements";
import { dayName, formatMissionBest, formatPlace, hourOf } from "@/lib/missions/format";
import { missionNotes } from "@/lib/missions/goals";
import type { MissionTodayResponse, MissionView, RecentDay } from "@/lib/missions/types";

const COPY = localized({
  "pt-BR": {
    title: "Seu boletim",
    noCard: "Jogue a missão e escolha um apelido no fim da partida. Com ele, você entra no placar e começa o seu boletim.",
    hasCard: "Já tem carteirinha? Ela só vale no navegador em que foi tirada.",
    seeCard: "Ver minha carteirinha",
    tries: ["tentativa", "tentativas"] as [string, string],
    completedAt: (hour: string, tries: string | null) => `Missão cumprida às ${hour}${tries ? `, em ${tries}` : " de primeira"}.`,
    triesToday: (tries: string) => `${tries} hoje. Ainda dá tempo!`,
    startedNoTries: "Você começou a missão. Termine a partida para ela contar.",
    notYet: "Você ainda não encarou a missão de hoje!",
    done: "Missões concluídas",
    streak: "Dias seguidos",
    bestStreak: "Maior sequência",
    streakDays: " dias seguidos",
    day: " dia",
    days: " dias",
    keep: "As missões mudam, mas suas conquistas ficam!",
    grade: {
      completed: "concluída",
      started: "tentada",
      none: "não jogada",
    },
    gradeTitle: "Suas missões · últimos 14 dias",
    gradeLabel: "Suas missões nos últimos 14 dias",
    gradeDay: (day: string, state: string) => `${day}: missão ${state}`,
    seals: (count: number, total: number) => `Selos da missão · ${count} de ${total}`,
    seeAll: "Ver todos",
    sealEarned: "conquistado",
    sealLocked: "ainda não",
    champion: (n: number) => `Campeão do dia ${n === 1 ? "1 vez" : `${n} vezes`}.`,
    rulesTitle: "Como funciona",
    rules: [
      "Uma missão diferente por dia, igual para todo mundo.",
      "A missão muda à meia-noite, no horário de Fortaleza. Começou antes disso? Dá para terminar até 1h.",
      "Jogue pelo botão da missão para a partida contar.",
      "Tente quantas vezes quiser. O placar fica com a sua melhor partida.",
    ],
    replayed: "O canal remonta sua máquina e confere o tempo e as peças que a bolinha tocou. Assim o placar fica justo.",
    checked: "As partidas são verificadas para manter o placar justo.",
  },
  en: {
    title: "Your report card",
    noCard: "Play the mission and pick a nickname at the end of the run. With it, you join the board and start your report card.",
    hasCard: "Already have a membership card? It only works in the browser where you got it.",
    seeCard: "See my membership card",
    tries: ["try", "tries"],
    completedAt: (hour: string, tries: string | null) => `Mission complete at ${hour} (UTC−3)${tries ? `, in ${tries}` : " on the first try"}.`,
    triesToday: (tries: string) => `${tries} today. There's still time!`,
    startedNoTries: "You started the mission. Finish the run for it to count.",
    notYet: "You haven't taken on today's mission yet!",
    done: "Missions completed",
    streak: "Days in a row",
    bestStreak: "Best streak",
    streakDays: " days in a row",
    day: " day",
    days: " days",
    keep: "The missions change, but your achievements stay!",
    grade: {
      completed: "completed",
      started: "attempted",
      none: "not played",
    },
    gradeTitle: "Your missions · last 14 days",
    gradeLabel: "Your missions in the last 14 days",
    gradeDay: (day: string, state: string) => `${day}: mission ${state}`,
    seals: (count: number, total: number) => `Mission stamps · ${count} of ${total}`,
    seeAll: "See all",
    sealEarned: "earned",
    sealLocked: "not yet",
    champion: (n: number) => `Champion of the day ${n === 1 ? "once" : `${n} times`}.`,
    rulesTitle: "How it works",
    rules: [
      "A different mission every day, the same for everyone.",
      "The mission changes at midnight in Brazil (UTC−3). Started before that? You can finish until 1 a.m.",
      "Play from the mission button for the run to count.",
      "Try as many times as you want. The board keeps your best run.",
    ],
    replayed: "The channel rebuilds your machine and checks the time and the parts the ball touched. That keeps the board fair.",
    checked: "Runs are checked to keep the board fair.",
  },
});

export function YourCard({ data, joined }: { data: MissionTodayResponse; joined: boolean }) {
  const copy = useCopy(COPY);
  const locale = useLocale();
  const you = data.you;
  const progress = you?.progress;
  return (
    <section aria-labelledby="mission-you-title" className="paper rounded-2xl border-[3px] border-ink p-4 text-ink shadow-[var(--shadow-ink)]">
      <h2 id="mission-you-title" className="flex items-center gap-2 font-display text-lg uppercase tracking-wide">
        <CardIcon className="size-5" /> {copy.title}
      </h2>
      {!joined || !you || !progress ? (
        <>
          <p className="copy mt-2">{copy.noCard}</p>
          <p className="copy-sm mt-2 text-ink-soft">
            {copy.hasCard}{" "}
            <Link href="/extras#membership" className="font-semibold text-ink underline decoration-2 underline-offset-2">
              {copy.seeCard}
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="copy mt-2">
            {you.state === "completed" && you.completedAt
              ? copy.completedAt(hourOf(you.completedAt, locale), you.attempts > 1 ? countOf(you.attempts, copy.tries, locale) : null)
              : you.state === "started"
                ? you.attempts > 0
                  ? copy.triesToday(countOf(you.attempts, copy.tries, locale))
                  : copy.startedNoTries
                : copy.notYet}
          </p>
          {you.best ? (
            <p className="copy mt-2 rounded-lg border-2 border-ink bg-sun px-2 py-1.5 font-semibold">
              {formatMissionBest(data.mission.game, you.best.metrics, locale)} · {formatPlace(you.best.position, you.best.total, locale)}
            </p>
          ) : null}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1.5">
              <dt className="tag-label text-ink-soft">{copy.done}</dt>
              <dd className="font-display text-2xl tabular-nums">{formatNumber(progress.days, locale)}</dd>
            </div>
            <div className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1.5">
              <dt className="tag-label text-ink-soft">{progress.streak >= 2 ? copy.streak : copy.bestStreak}</dt>
              <dd className="font-display text-2xl tabular-nums">
                {progress.streak >= 2 ? progress.streak : progress.bestStreak}
                <span className="sr-only">{progress.streak >= 2 ? copy.streakDays : progress.bestStreak === 1 ? copy.day : copy.days}</span>
              </dd>
            </div>
          </dl>
          {progress.days > 0 && progress.streak < 2 ? <p className="copy-sm mt-2 text-ink-soft">{copy.keep}</p> : null}
          <Grade days={you.recent} />
          <Seals unlocked={you.achievements.map((a) => a.id)} championDays={you.championDays} />
        </>
      )}
    </section>
  );
}

const GRADE_CLASS = {
  completed: "bg-lime text-ink",
  started: "bg-sun text-ink",
  none: "bg-cream-2 text-ink-soft",
} as const;

function Grade({ days }: { days: RecentDay[] }) {
  const copy = useCopy(COPY);
  const locale = useLocale();
  const today = days[days.length - 1]?.day;
  return (
    <div className="mt-3">
      <p className="tag-label text-ink-soft">{copy.gradeTitle}</p>
      <ol aria-label={copy.gradeLabel} className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => (
          <li
            key={d.day}
            className={`grid aspect-square place-items-center rounded-md border-2 border-ink text-xs font-bold tabular-nums ${GRADE_CLASS[d.state]} ${d.day === today ? "outline-2 outline-offset-1 outline-tomato" : ""}`}
          >
            <span aria-hidden>{d.state === "completed" ? "★" : Number(d.day.slice(8))}</span>
            <span className="sr-only">{copy.gradeDay(dayName(d.day, locale), copy.grade[d.state])}</span>
          </li>
        ))}
      </ol>
      <p aria-hidden className="mt-1.5 flex flex-wrap gap-x-3 text-xs font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-ink bg-lime" /> {copy.grade.completed}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-ink bg-sun" /> {copy.grade.started}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-ink bg-cream-2" /> {copy.grade.none}
        </span>
      </p>
    </div>
  );
}

function Seals({ unlocked, championDays }: { unlocked: string[]; championDays: number }) {
  const copy = useCopy(COPY);
  const achievements = missionAchievements(useLocale());
  const count = achievements.filter((a) => unlocked.includes(a.id)).length;
  return (
    <div className="mt-3 border-t-2 border-dashed border-ink/25 pt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="tag-label text-ink-soft">{copy.seals(count, achievements.length)}</p>
        <Link href="/extras#achievements" className="tag-label text-ink underline decoration-2 underline-offset-2">
          {copy.seeAll}
        </Link>
      </div>
      <ul className="mt-1 flex gap-1.5">
        {achievements.map((a) => {
          const done = unlocked.includes(a.id);
          return (
            <li key={a.id} className="w-9" title={done ? a.title : `${a.title}: ${a.hint}`}>
              {done ? <StarBadge color={a.color} className="w-full" /> : <LockedBadge className="w-full opacity-70" />}
              <span className="sr-only">
                {a.title}: {done ? copy.sealEarned : copy.sealLocked}
              </span>
            </li>
          );
        })}
      </ul>
      {championDays > 0 ? <p className="copy-sm mt-1.5 font-semibold">{copy.champion(championDays)}</p> : null}
    </div>
  );
}

export function MissionRules({ mission }: { mission: MissionView }) {
  const copy = useCopy(COPY);
  const locale = useLocale();
  const replayed = mission.game === "bad-ideas-lab";
  const notes = missionNotes(mission, locale);
  return (
    <section aria-labelledby="mission-rules-title" className="relative -rotate-1 rounded-2xl border-[3px] border-ink bg-paper p-4 pt-5 text-ink shadow-[var(--shadow-ink)]">
      <span aria-hidden className="absolute -top-3 left-1/2 h-5 w-20 -translate-x-1/2 rotate-2 bg-lime/85" />
      <h2 id="mission-rules-title" className="font-display text-lg uppercase tracking-wide">
        {copy.rulesTitle}
      </h2>
      <ul className="copy-sm mt-1.5 list-disc space-y-1.5 pl-5 marker:text-ink-soft">
        {[...copy.rules, ...notes].map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p className="copy-sm mt-3 flex gap-1.5 border-t-2 border-dashed border-ink/25 pt-2.5 text-ink-soft">
        <VerifiedIcon className="mt-0.5 size-4 shrink-0 text-mint-deep" />
        <span>{replayed ? copy.replayed : copy.checked}</span>
      </p>
    </section>
  );
}
