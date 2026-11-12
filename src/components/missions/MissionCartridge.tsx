"use client";

import { motion, useReducedMotion } from "motion/react";
import { GameCover } from "@/components/art/Covers";
import { PlayIcon } from "@/components/art/Icons";
import { IntentLink } from "@/components/ui/IntentLink";
import { inkStyle, toneBg } from "@/components/ui/Primitives";
import { getGame } from "@/games/registry";
import { useSound } from "@/lib/audio/hooks";
import { dayStamp } from "@/lib/missions/format";
import type { MissionTodayResponse } from "@/lib/missions/types";
import { MissionClock, missionHref, missionPlace, StateChip } from "./parts";

const PLAY_LABEL = { new: "Jogar missão", started: "Tentar de novo", completed: "Jogar de novo" } as const;

export function MissionCartridge({ data, offset }: { data: MissionTodayResponse; offset: number }) {
  const { mission, you } = data;
  const game = getGame(mission.game);
  const place = missionPlace(mission);
  const state = you?.state ?? "new";
  const stamp = dayStamp(mission.day);
  const still = useReducedMotion();
  const { play, hover } = useSound();
  return (
    <div>
      <article
        aria-labelledby="mission-title"
        className="relative rounded-b-xl rounded-t-[2.25rem] border-[3px] border-ink bg-plum-700 px-3 pb-4 pt-7 shadow-[var(--shadow-ink-lg)] sm:px-5"
        data-testid="mission-cartridge"
      >
        <span aria-hidden className="absolute inset-x-12 top-2.5 flex h-2 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="flex-1 rounded-sm bg-ink/60" />
          ))}
        </span>
        <div className="paper relative overflow-hidden rounded-xl border-[3px] border-ink">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b-[3px] border-ink bg-tomato px-3 py-1.5">
            <p className="flex items-center gap-2 font-display text-sm uppercase tracking-wider text-ink">
              <span className="rounded bg-ink px-1.5 text-[11px] leading-5 text-sun">Plantão</span>
              Missão 404 do dia
            </p>
            <p className="font-display text-sm uppercase tracking-wider text-ink">
              <time dateTime={mission.day}>
                {stamp.weekday} · {stamp.date}
              </time>
            </p>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,12rem)_1fr] sm:p-5">
            <div className="relative mx-auto mb-3 w-full max-w-[16rem] sm:mb-0 sm:max-w-none">
              <div className="relative aspect-[4/3] w-full -rotate-2 overflow-hidden rounded-lg border-[3px] border-ink shadow-[var(--shadow-ink-sm)]">
                <GameCover slug={mission.game} decorative />
                <span aria-hidden className="absolute inset-0 scanlines opacity-30" />
              </div>
              {state === "completed" ? (
                <motion.span
                  aria-hidden
                  initial={still ? false : { scale: 2.2, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: -9, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 15, delay: 0.25 }}
                  className="pointer-events-none absolute -bottom-3 -right-3 whitespace-nowrap rounded-lg border-[3px] border-ink bg-lime px-2.5 py-0.5 font-display text-lg uppercase tracking-wider text-ink shadow-[var(--shadow-ink)]"
                >
                  Missão cumprida!
                </motion.span>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className={`inline-block rounded-md border-2 border-ink px-2 font-display text-xs uppercase leading-5 tracking-wider text-ink ${game ? toneBg(game.accent) : "bg-sun"}`}>{place.game}</p>
              {place.level ? <p className="mt-1.5 font-display text-sm uppercase tracking-wide text-ink-soft">{place.level}</p> : null}
              <h2 id="mission-title" className="mt-1 font-display text-[clamp(1.9rem,5vw,2.9rem)] uppercase leading-[0.95] tracking-wide text-ink">
                {mission.title}
              </h2>
              <p className="copy-lede mt-2 text-ink">{mission.objective}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <IntentLink
              href={missionHref(mission)}
              className={inkStyle(state === "completed" ? "mint" : "sun", "lg")}
              onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
              onClick={() => play("confirm")}
            >
              <PlayIcon className="size-7" /> {PLAY_LABEL[state]}
            </IntentLink>
            <StateChip state={state} />
          </div>
          <MissionClock endsAt={mission.endsAt} offset={offset} />
        </div>
      </article>
      <span aria-hidden className="mx-auto -mt-[3px] block w-3/5 rounded-b-lg border-x-[3px] border-b-[3px] border-ink bg-plum-700 px-3 pb-1.5 pt-1">
        <span className="block h-3 rounded-sm bg-[repeating-linear-gradient(90deg,var(--color-sun)_0_8px,var(--color-sun-deep)_8px_10px,transparent_10px_14px)]" />
      </span>
    </div>
  );
}
