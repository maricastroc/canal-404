"use client";

import { createContext, useContext } from "react";
import { CheckIcon } from "@/components/art/Icons";
import { missionHref, missionPlace } from "@/components/missions/parts";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { ordinal } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { clock } from "@/lib/missions/format";
import { useCountdown } from "@/lib/missions/hooks";
import { missionText } from "@/lib/missions/text";
import type { MissionBest, MissionState, MissionView } from "@/lib/missions/types";
import type { Channel } from "./objects/TvChannels";
import { LAST_HOUR_MINUTES } from "./missionLines";

export type MissionOnAir = { view: MissionView; state: MissionState; best: MissionBest | null; offset: number };

const MissionContext = createContext<MissionOnAir | null>(null);

export const MissionOnAirProvider = MissionContext.Provider;

export function useMissionOnAir() {
  return useContext(MissionContext);
}

const COPY = localized({
  "pt-BR": {
    context: (title: string) => `Missão 404 do dia: ${title}`,
    seeBoard: "Ver placar",
    play: "Jogar missão",
    doneHint: "Missão cumprida! Clica na tela pra ver o placar do dia.",
    playHint: (title: string) => `Plantão: “${title}”. Clica na tela pra jogar!`,
    done: "Cumprida",
    onBoard: (place: string) => ` · ${place} no placar`,
    lastHour: "Última hora",
    endsIn: "Termina em",
    offAir: "Plantão fora do ar",
    bulletin: "Plantão",
    show: "Missão 404 do dia",
  },
  en: {
    context: (title: string) => `Mission 404 of the Day: ${title}`,
    seeBoard: "See board",
    play: "Play mission",
    doneHint: "Mission complete! Click the screen to see today's board.",
    playHint: (title: string) => `Bulletin: “${title}”. Click the screen to play!`,
    done: "Done",
    onBoard: (place: string) => ` · ${place} on the board`,
    lastHour: "Last hour",
    endsIn: "Ends in",
    offAir: "Bulletin off the air",
    bulletin: "Bulletin",
    show: "Mission 404",
  },
});

export function missionCta(m: MissionOnAir, locale: Locale): NonNullable<Channel["cta"]> {
  const copy = COPY[locale];
  const context = copy.context(missionText(m.view, locale).title);
  return m.state === "completed"
    ? { href: "/mission", label: copy.seeBoard, context }
    : { href: missionHref(m.view), label: copy.play, context, play: true };
}

export function missionHint(m: MissionOnAir, locale: Locale) {
  const copy = COPY[locale];
  return m.state === "completed" ? copy.doneHint : copy.playHint(missionText(m.view, locale).title);
}

function Status({ m }: { m: MissionOnAir }) {
  const left = useCountdown(m.view.endsAt, m.offset);
  const copy = useCopy(COPY);
  const locale = useLocale();
  if (m.state === "completed") {
    return (
      <p className="inline-flex items-center gap-[0.35em] rounded-[4px] border-[2px] border-ink bg-lime px-[0.5em] py-[0.15em] font-display text-[max(7px,5cqw)] uppercase leading-none tracking-wide text-ink">
        <CheckIcon className="size-[1em]" />
        {copy.done}
        {m.best ? copy.onBoard(ordinal(m.best.position, locale)) : ""}
      </p>
    );
  }
  const lastHour = left !== null && left <= LAST_HOUR_MINUTES * 60_000;
  return (
    <p className="inline-flex items-center gap-[0.4em] font-display text-[max(7px,5cqw)] uppercase leading-none tracking-wide">
      <span className={lastHour ? "text-tomato" : "text-plum-300"} style={lastHour ? { animation: "rec-blink 1s steps(1) infinite" } : undefined}>
        {lastHour ? copy.lastHour : copy.endsIn}
      </span>
      <span className="rounded-[3px] bg-[#10122e] px-[0.35em] py-[0.15em] tabular-nums text-screen">{left === null ? "--:--:--" : clock(left)}</span>
    </p>
  );
}

export function MissionScreen() {
  const m = useMissionOnAir();
  const copy = useCopy(COPY);
  const locale = useLocale();
  if (!m) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-plum-950 px-[8%] text-center">
        <p className="font-display text-[max(9px,8cqw)] uppercase leading-tight text-plum-300">{copy.offAir}</p>
      </div>
    );
  }
  const place = missionPlace(m.view, locale);
  const title = missionText(m.view, locale).title;
  const long = title.length > 16;
  return (
    <div className="absolute inset-0 overflow-hidden bg-plum-900">
      <div aria-hidden className="absolute inset-0 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(135deg, #2b2150 0 10cqw, #33275e 10cqw 20cqw)" }} />
      <div className="absolute inset-x-0 top-0 flex items-center gap-[0.45em] border-b-[2px] border-ink bg-tomato px-[6%] py-[2.2%]">
        <span
          className="rounded-[3px] bg-ink px-[0.4em] font-display text-[max(7px,4.6cqw)] uppercase leading-[1.4] text-sun"
          style={m.state === "completed" ? undefined : { animation: "rec-blink 1.4s steps(1) infinite" }}
        >
          {copy.bulletin}
        </span>
        <span className="font-display text-[max(7px,5cqw)] uppercase tracking-wide text-ink">{copy.show}</span>
      </div>
      <div className="absolute inset-x-[7%] top-[21%]">
        <p className="truncate font-display text-[max(7px,4.4cqw)] uppercase tracking-wide text-plum-300">
          {place.game}
          {place.level ? ` · ${place.level.split(":")[0]}` : ""}
        </p>
        <p
          className={`mt-[2%] line-clamp-2 font-display uppercase leading-[0.95] text-sun [text-shadow:0.06em_0.08em_0_var(--color-ink)] ${long ? "text-[max(11px,9cqw)]" : "text-[max(12px,11.5cqw)]"}`}
        >
          {title}
        </p>
        <div className="mt-[5%]">
          <Status m={m} />
        </div>
      </div>
    </div>
  );
}
