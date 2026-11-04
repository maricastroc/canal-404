"use client";

import Link from "next/link";
import { CardIcon, TrophyIcon, VerifiedIcon } from "@/components/art/Icons";
import { formatMissionBest, formatPlace, hourOf } from "@/lib/missions/format";
import type { MissionTodayResponse } from "@/lib/missions/types";

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
        <p className="mt-2 font-semibold leading-snug">
          Jogue a missão e escolha um apelido no fim da partida para ela contar. Já tem carteirinha em outro aparelho? Ela fica no navegador onde foi tirada.{" "}
          <Link href="/extras#membership" className="underline decoration-2 underline-offset-2">
            Ver a carteirinha
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="mt-2 font-semibold leading-snug">
            {you.state === "completed" && you.completedAt
              ? `Missão cumprida às ${hourOf(you.completedAt)}${you.attempts > 1 ? `, em ${plural(you.attempts, "tentativa", "tentativas")}` : " de primeira"}.`
              : you.state === "started"
                ? you.attempts > 0
                  ? `${plural(you.attempts, "tentativa", "tentativas")} hoje. Ainda dá tempo!`
                  : "Você já começou a missão de hoje. Termine uma partida para ela contar."
                : "Você ainda não jogou a missão de hoje."}
          </p>
          {you.best ? (
            <p className="mt-2 rounded-lg border-2 border-ink bg-sun px-2 py-1.5 font-semibold">
              {formatMissionBest(data.mission.game, you.best.metrics)} · {formatPlace(you.best.position, you.best.total)}
            </p>
          ) : null}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1.5">
              <dt className="font-display text-[11px] uppercase tracking-wider text-ink-soft">Missões cumpridas</dt>
              <dd className="font-display text-2xl tabular-nums">{progress.days.toLocaleString("pt-BR")}</dd>
            </div>
            <div className="rounded-lg border-2 border-ink bg-cream-2 px-2 py-1.5">
              <dt className="font-display text-[11px] uppercase tracking-wider text-ink-soft">{progress.streak >= 2 ? "Dias seguidos" : "Melhor sequência"}</dt>
              <dd className="font-display text-2xl tabular-nums">
                {progress.streak >= 2 ? progress.streak : progress.bestStreak}
                <span className="sr-only">{progress.streak >= 2 ? " dias seguidos" : progress.bestStreak === 1 ? " dia" : " dias"}</span>
              </dd>
            </div>
          </dl>
          {progress.days > 0 && progress.streak < 2 ? <p className="mt-2 text-sm text-ink-soft">Sem pressa: os dias cumpridos nunca somem do seu boletim.</p> : null}
        </>
      )}
    </section>
  );
}

export function TodayBoard({ data }: { data: MissionTodayResponse }) {
  const { completions, leader, mission } = data;
  return (
    <section aria-labelledby="mission-board-title" className="on-dark relative overflow-hidden rounded-2xl border-[3px] border-ink bg-[#10122e] p-4 text-cream shadow-[var(--shadow-ink)]">
      <h2 id="mission-board-title" className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-sun">
        <TrophyIcon className="size-5" /> Placar do dia
      </h2>
      <p className="mt-2 font-semibold leading-snug">
        {completions === 0 ? "Ninguém cumpriu a missão ainda. O primeiro lugar está vago." : `${plural(completions, "pessoa cumpriu", "pessoas cumpriram")} a missão hoje.`}
      </p>
      {leader ? (
        <p className="mt-2 rounded-lg border-2 border-ink bg-plum-800 px-2 py-1.5 text-sm">
          <span className="font-display uppercase tracking-wider text-sun">Na frente: </span>
          <span className="font-semibold">
            {leader.you ? "você" : `${leader.nickname} #${leader.tag}`}
          </span>{" "}
          · {formatMissionBest(mission.game, leader.metrics)}
        </p>
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-40" />
    </section>
  );
}

export function MissionRules({ game }: { game: string }) {
  const replayed = game === "bad-ideas-lab";
  return (
    <section aria-labelledby="mission-rules-title" className="relative -rotate-1 rounded-2xl border-[3px] border-ink bg-paper p-4 pt-5 text-ink shadow-[var(--shadow-ink)]">
      <span aria-hidden className="absolute -top-3 left-1/2 h-5 w-20 -translate-x-1/2 rotate-2 bg-lime/85" />
      <h2 id="mission-rules-title" className="font-display text-lg uppercase tracking-wide">
        Como a missão funciona
      </h2>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-snug">
        <li>Uma missão por dia, a mesma para todo mundo. Ela troca à meia-noite, no horário de Fortaleza.</li>
        <li>Comece pelo botão da missão. Partidas que começam antes da meia-noite valem se terminarem até 1h da manhã.</li>
        <li>Pode tentar quantas vezes quiser. No placar do dia fica o seu melhor resultado.</li>
      </ul>
      <h3 className="mt-3 flex items-center gap-1.5 font-display text-sm uppercase tracking-wider">
        {replayed ? <VerifiedIcon className="size-4 text-mint-deep" /> : null}
        Como o canal confere
      </h3>
      <p className="mt-1 text-sm leading-snug">
        {replayed
          ? "O canal monta sua máquina de novo, no servidor, e mede o tempo e as peças que a bolinha tocou."
          : "O canal confere se os números da partida fecham e se ela durou o tempo certo. Isso barra erros e exageros, mas não prova que a partida foi jogada sem trapaça."}
      </p>
    </section>
  );
}
