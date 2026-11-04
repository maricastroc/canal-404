"use client";

import Link from "next/link";
import { MissionIcon } from "@/components/art/Icons";
import { useSound } from "@/lib/audio/hooks";
import { useMissionToday } from "@/lib/missions/hooks";
import { missionPlace, StateChip } from "./parts";

export function MissionTeaser() {
  const feed = useMissionToday();
  const { play, hover } = useSound();
  if (feed.status !== "ready" || !feed.data) return null;
  const { mission, you } = feed.data;
  const place = missionPlace(mission);
  return (
    <Link
      href="/mission"
      onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
      onClick={() => play("click")}
      className="press on-dark mx-auto mt-6 flex max-w-3xl -rotate-[0.6deg] flex-wrap items-center gap-3 rounded-xl border-[3px] border-ink bg-plum-800 p-2 pr-3 text-cream shadow-[var(--shadow-ink)] sm:flex-nowrap"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-lg border-[3px] border-ink bg-tomato text-ink">
        <MissionIcon className="size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xs uppercase tracking-widest text-sun">Missão 404 do dia · {place.game}</span>
        <span className="block truncate font-display text-xl uppercase leading-tight tracking-wide">{mission.title}</span>
        <span className="block truncate text-sm font-semibold text-cream-2">{mission.objective}</span>
      </span>
      <StateChip state={you?.state ?? "new"} />
    </Link>
  );
}
