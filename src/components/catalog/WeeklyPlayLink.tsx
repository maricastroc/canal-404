"use client";

import { PlayIcon } from "@/components/art/Icons";
import { InkLink } from "@/components/ui/Primitives";
import type { Tone } from "@/components/ui/Primitives";
import { useWeeklyGame } from "./useSchedule";

export function WeeklyPlayLink({ tone = "sun", exclude }: { tone?: Tone; exclude?: string }) {
  const weekly = useWeeklyGame();
  if (exclude && weekly.slug === exclude) {
    return (
      <InkLink href="/games" tone={tone}>
        Ver a programação
      </InkLink>
    );
  }
  return (
    <InkLink href={`/play/${weekly.slug}`} tone={tone}>
      <PlayIcon className="size-5 text-ink" /> Jogar {weekly.title}
      <span className="sr-only">, o jogo da semana</span>
    </InkLink>
  );
}
