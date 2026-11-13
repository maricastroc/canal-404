"use client";

import Link from "next/link";
import { LockedBadge, StarBadge } from "@/components/art/Badges";
import { CardIcon, VerifiedIcon } from "@/components/art/Icons";
import { MISSION_ACHIEVEMENTS } from "@/lib/missions/achievements";
import { dayName, formatMissionBest, formatPlace, hourOf } from "@/lib/missions/format";
import { missionNotes } from "@/lib/missions/goals";
import type { MissionTodayResponse, MissionView, RecentDay } from "@/lib/missions/types";

function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;
}

export function YourCard({ data, joined }: { data: MissionTodayResponse; joined: boolean }) {
  const you = data.you;
  const progress = you?.progress;
  return (
    <section aria-labelledby="mission-you-title" className="paper rounded-2xl border-[3px] border-ink p-4 text-ink shadow-[var(--shadow-ink)]">
      <h2 id="mission-you-title" className="flex items-center gap-2 font-display text-lg uppercase tracking-wide">
        <CardIcon className="size-5" /> Seu boletim
      </h2>
      {!joined || !you || !progress ? (
        <>
          <p className="copy mt-2">Jogue a missão e escolha um apelido no fim da partida. É com ele que você entra no placar e monta o seu boletim.</p>
          <p className="copy-sm mt-2 text-ink-soft">
            Já tem carteirinha? Ela vale só no navegador em que foi tirada.{" "}
            <Link href="/extras#membership" className="font-semibold text-ink underline decoration-2 underline-offset-2">
              Ver minha carteirinha
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="copy mt-2">
            {you.state === "completed" && you.completedAt
              ? `Missão cumprida às ${hourOf(you.completedAt)}${you.attempts > 1 ? `, em ${plural(you.attempts, "tentativa", "tentativas")}` : " de primeira"}.`
              : you.state === "started"
                ? you.attempts > 0
                  ? `${plural(you.attempts, "tentativa", "tentativas")} hoje. Ainda dá tempo!`
                  : "Missão começada. Termine a partida para ela valer."
                : "A missão de hoje ainda está esperando por você."}
          </p>
          {you.best ? (
            <p className="copy mt-2 rounded-lg border-2 border-ink bg-sun px-2 py-1.5 font-semibold">
              {formatMissionBest(data.mission.game, you.best.metrics)} · {formatPlace(you.best.position, you.best.total)}
            </p>
          ) : null}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1.5">
              <dt className="tag-label text-ink-soft">Missões cumpridas</dt>
              <dd className="font-display text-2xl tabular-nums">{progress.days.toLocaleString("pt-BR")}</dd>
            </div>
            <div className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1.5">
              <dt className="tag-label text-ink-soft">{progress.streak >= 2 ? "Dias seguidos" : "Melhor sequência"}</dt>
              <dd className="font-display text-2xl tabular-nums">
                {progress.streak >= 2 ? progress.streak : progress.bestStreak}
                <span className="sr-only">{progress.streak >= 2 ? " dias seguidos" : progress.bestStreak === 1 ? " dia" : " dias"}</span>
              </dd>
            </div>
          </dl>
          {progress.days > 0 && progress.streak < 2 ? <p className="copy-sm mt-2 text-ink-soft">Sem pressa: missão cumprida nunca sai do boletim.</p> : null}
          <Grade days={you.recent} />
          <Seals unlocked={you.achievements.map((a) => a.id)} championDays={you.championDays} />
        </>
      )}
    </section>
  );
}

const GRADE = {
  completed: { className: "bg-lime text-ink", label: "missão cumprida" },
  started: { className: "bg-sun text-ink", label: "tentou" },
  none: { className: "bg-cream-2 text-ink-soft", label: "sem missão" },
} as const;

function Grade({ days }: { days: RecentDay[] }) {
  const today = days[days.length - 1]?.day;
  return (
    <div className="mt-3">
      <p className="tag-label text-ink-soft">Sua grade · últimos 14 dias</p>
      <ol aria-label="Seus últimos 14 dias de missão" className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => (
          <li
            key={d.day}
            className={`grid aspect-square place-items-center rounded-md border-2 border-ink text-xs font-bold tabular-nums ${GRADE[d.state].className} ${d.day === today ? "outline-2 outline-offset-1 outline-tomato" : ""}`}
          >
            <span aria-hidden>{d.state === "completed" ? "★" : Number(d.day.slice(8))}</span>
            <span className="sr-only">
              {dayName(d.day)}: {GRADE[d.state].label}
            </span>
          </li>
        ))}
      </ol>
      <p aria-hidden className="mt-1.5 flex flex-wrap gap-x-3 text-xs font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-ink bg-lime" /> cumprida
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-ink bg-sun" /> tentou
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-sm border border-ink bg-cream-2" /> sem missão jogada
        </span>
      </p>
    </div>
  );
}

function Seals({ unlocked, championDays }: { unlocked: string[]; championDays: number }) {
  const count = MISSION_ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).length;
  return (
    <div className="mt-3 border-t-2 border-dashed border-ink/25 pt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="tag-label text-ink-soft">
          Selos da missão · {count} de {MISSION_ACHIEVEMENTS.length}
        </p>
        <Link href="/extras#achievements" className="tag-label text-ink underline decoration-2 underline-offset-2">
          Ver todos
        </Link>
      </div>
      <ul className="mt-1 flex gap-1.5">
        {MISSION_ACHIEVEMENTS.map((a) => {
          const done = unlocked.includes(a.id);
          return (
            <li key={a.id} className="w-9" title={done ? a.title : `${a.title}: ${a.hint}`}>
              {done ? <StarBadge color={a.color} className="w-full" /> : <LockedBadge className="w-full opacity-70" />}
              <span className="sr-only">
                {a.title}: {done ? "conquistado" : "ainda não"}
              </span>
            </li>
          );
        })}
      </ul>
      {championDays > 0 ? (
        <p className="copy-sm mt-1.5 font-semibold">
          Campeão do dia {championDays === 1 ? "1 vez" : `${championDays} vezes`}.
        </p>
      ) : null}
    </div>
  );
}

export function MissionRules({ mission }: { mission: MissionView }) {
  const replayed = mission.game === "bad-ideas-lab";
  const notes = missionNotes(mission);
  return (
    <section aria-labelledby="mission-rules-title" className="relative -rotate-1 rounded-2xl border-[3px] border-ink bg-paper p-4 pt-5 text-ink shadow-[var(--shadow-ink)]">
      <span aria-hidden className="absolute -top-3 left-1/2 h-5 w-20 -translate-x-1/2 rotate-2 bg-lime/85" />
      <h2 id="mission-rules-title" className="font-display text-lg uppercase tracking-wide">
        Como funciona
      </h2>
      <ul className="copy-sm mt-1.5 list-disc space-y-1.5 pl-5 marker:text-ink-soft">
        <li>Uma missão por dia, igual para todo mundo. Ela troca à meia-noite, no horário de Fortaleza.</li>
        <li>Jogue pelo botão da missão. Começou antes da meia-noite? Vale se terminar até 1h.</li>
        <li>Tente quantas vezes quiser: no placar fica a sua melhor partida.</li>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p className="copy-sm mt-3 flex gap-1.5 border-t-2 border-dashed border-ink/25 pt-2.5 text-ink-soft">
        <VerifiedIcon className="mt-0.5 size-4 shrink-0 text-mint-deep" />
        <span>
          {replayed
            ? "O canal monta sua máquina de novo e confere o tempo e as peças que a bolinha tocou."
            : "O canal confere os números de cada partida. Resultado impossível não entra no placar."}
        </span>
      </p>
    </section>
  );
}
