"use client";

import Link from "next/link";
import { GameCover } from "@/components/art/Covers";
import { PlayIcon } from "@/components/art/Icons";
import { useSound } from "@/lib/audio/hooks";
import { useSchedule } from "./useSchedule";

export function NextProgram({ current }: { current: string }) {
  const schedule = useSchedule();
  const { play, hover } = useSound();
  const pick = schedule.next([current]);
  if (!pick) return null;
  const { game, reason } = pick;
  const note = reason === "unplayed" ? "Inédito pra você" : "Reprise especial";
  return (
    <aside aria-label="Depois do intervalo" className="mt-5 -rotate-1 rounded-xl border-[3px] border-ink bg-plum-900 p-2.5 shadow-[var(--shadow-ink)]">
      <Link
        href={`/play/${game.slug}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
        onClick={() => play("tvOn")}
        className="group flex items-center gap-3 rounded-lg [--focus:var(--color-sun)]"
      >
        <span className="relative block aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md border-[3px] border-ink sm:w-28">
          <GameCover slug={game.slug} decorative />
          <span aria-hidden className="absolute inset-0 scanlines opacity-50" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xs uppercase tracking-widest text-sun">Depois do intervalo…</span>
          <span className="block font-display text-xl uppercase leading-tight text-cream">{game.title}</span>
          <span className="mt-0.5 inline-block rounded-md border-2 border-ink bg-mint px-1.5 font-display text-[11px] uppercase tracking-wide text-ink">{note}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full border-[3px] border-ink bg-sun px-3 py-1 font-display text-sm uppercase text-ink shadow-[0_3px_0_0_var(--color-ink)] transition-transform group-hover:-translate-y-0.5">
          <PlayIcon className="size-4" /> Ver
        </span>
      </Link>
    </aside>
  );
}
