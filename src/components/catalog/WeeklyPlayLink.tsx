"use client";

import { PlayIcon } from "@/components/art/Icons";
import { IntentLink } from "@/components/ui/IntentLink";
import { InkLink, inkStyle } from "@/components/ui/Primitives";
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
    <IntentLink href={`/play/${weekly.slug}`} className={inkStyle(tone)}>
      <PlayIcon className="size-5 text-ink" /> Jogar {weekly.title}
      <span className="sr-only">, o jogo da semana</span>
    </IntentLink>
  );
}
