"use client";

import { DoneIcon, MissionIcon, TimerIcon } from "@/components/art/Icons";
import { getGame } from "@/games/registry";
import { clock, spokenClock } from "@/lib/missions/format";
import { useCountdown } from "@/lib/missions/hooks";
import type { MissionState, MissionView } from "@/lib/missions/types";

export function missionHref(mission: Pick<MissionView, "game" | "day">) {
  return `/play/${mission.game}?mission=${mission.day}`;
}

export function missionPlace(mission: Pick<MissionView, "game" | "level">) {
  const game = getGame(mission.game);
  if (!game) return { game: mission.game, level: null as string | null };
  if (!mission.level || !game.levels) return { game: game.title, level: null };
  const index = game.levels.findIndex((l) => l.id === mission.level);
  const word = game.levelWord === "arena" ? "Arena" : "Fase";
  return { game: game.title, level: index >= 0 ? `${word} ${index + 1}: ${game.levels[index].title}` : null };
}

const STATES: Record<MissionState, { label: string; className: string }> = {
  new: { label: "Não iniciada", className: "bg-cream text-ink" },
  started: { label: "Em andamento", className: "bg-sun text-ink" },
  completed: { label: "Concluída", className: "bg-lime text-ink" },
};

export function StateChip({ state, className = "" }: { state: MissionState; className?: string }) {
  const look = STATES[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border-[3px] border-ink px-2 py-0.5 font-display text-xs uppercase leading-5 tracking-wider shadow-[var(--shadow-ink-sm)] ${look.className} ${className}`}>
      {state === "completed" ? <DoneIcon className="size-4" /> : state === "started" ? <TimerIcon className="size-4" /> : <MissionIcon className="size-4" />}
      {look.label}
    </span>
  );
}

export function MissionClock({ endsAt, offset, className = "", tone = "dark" }: { endsAt: string; offset: number; className?: string; tone?: "dark" | "light" }) {
  const left = useCountdown(endsAt, offset);
  return (
    <p className={`flex flex-col items-start gap-1 ${className}`}>
      <span className={`font-display text-[11px] uppercase tracking-[0.2em] ${tone === "dark" ? "text-plum-300" : "text-ink-soft"}`}>Nova missão em</span>
      <span className="rounded-md border-[3px] border-ink bg-[#10122e] px-2.5 py-1 shadow-[inset_0_0_12px_rgba(157,240,220,0.18)]">
        <span aria-hidden className="font-display text-xl tabular-nums leading-none tracking-[0.12em] text-screen [text-shadow:0_0_8px_rgba(157,240,220,0.7)]">
          {left === null ? "--:--:--" : clock(left)}
        </span>
        <span className="sr-only">{left === null ? "Calculando o tempo restante" : spokenClock(left)}</span>
      </span>
    </p>
  );
}
