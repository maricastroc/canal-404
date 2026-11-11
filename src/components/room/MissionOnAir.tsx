"use client";

import { createContext, useContext } from "react";
import { missionHref, missionPlace } from "@/components/missions/parts";
import { clock } from "@/lib/missions/format";
import { useCountdown } from "@/lib/missions/hooks";
import type { MissionBest, MissionState, MissionView } from "@/lib/missions/types";
import type { Channel } from "./objects/TvChannels";
import { LAST_HOUR_MINUTES } from "./missionLines";

export type MissionOnAir = { view: MissionView; state: MissionState; best: MissionBest | null; offset: number };

const MissionContext = createContext<MissionOnAir | null>(null);

export const MissionOnAirProvider = MissionContext.Provider;

export function useMissionOnAir() {
  return useContext(MissionContext);
}

export function missionCta(m: MissionOnAir): NonNullable<Channel["cta"]> {
  const context = `Missão 404 do dia: ${m.view.title}`;
  return m.state === "completed"
    ? { href: "/mission", label: "Ver placar", context }
    : { href: missionHref(m.view), label: "Jogar missão", context, play: true };
}

export function missionHint(m: MissionOnAir) {
  return m.state === "completed" ? "Missão cumprida! Clica na tela pra ver o placar do dia." : `Plantão: “${m.view.title}”. Clica na tela pra jogar!`;
}

function Status({ m }: { m: MissionOnAir }) {
  const left = useCountdown(m.view.endsAt, m.offset);
  if (m.state === "completed") {
    return (
      <p className="inline-flex items-center gap-[0.35em] rounded-[4px] border-[2px] border-ink bg-lime px-[0.5em] py-[0.15em] font-display text-[max(7px,5cqw)] uppercase leading-none tracking-wide text-ink">
        ✓ Cumprida{m.best ? ` · ${m.best.position}º no placar` : ""}
      </p>
    );
  }
  const lastHour = left !== null && left <= LAST_HOUR_MINUTES * 60_000;
  return (
    <p className="inline-flex items-center gap-[0.4em] font-display text-[max(7px,5cqw)] uppercase leading-none tracking-wide">
      <span className={lastHour ? "text-tomato" : "text-plum-300"} style={lastHour ? { animation: "rec-blink 1s steps(1) infinite" } : undefined}>
        {lastHour ? "Última hora" : "Termina em"}
      </span>
      <span className="rounded-[3px] bg-[#10122e] px-[0.35em] py-[0.15em] tabular-nums text-screen">{left === null ? "--:--:--" : clock(left)}</span>
    </p>
  );
}

export function MissionScreen() {
  const m = useMissionOnAir();
  if (!m) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-plum-950 px-[8%] text-center">
        <p className="font-display text-[max(9px,8cqw)] uppercase leading-tight text-plum-300">Plantão fora do ar</p>
      </div>
    );
  }
  const place = missionPlace(m.view);
  const long = m.view.title.length > 16;
  return (
    <div className="absolute inset-0 overflow-hidden bg-plum-900">
      <div aria-hidden className="absolute inset-0 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(135deg, #2b2150 0 10cqw, #33275e 10cqw 20cqw)" }} />
      <div className="absolute inset-x-0 top-0 flex items-center gap-[0.45em] border-b-[2px] border-ink bg-tomato px-[6%] py-[2.2%]">
        <span
          className="rounded-[3px] bg-ink px-[0.4em] font-display text-[max(7px,4.6cqw)] uppercase leading-[1.4] text-sun"
          style={m.state === "completed" ? undefined : { animation: "rec-blink 1.4s steps(1) infinite" }}
        >
          Plantão
        </span>
        <span className="font-display text-[max(7px,5cqw)] uppercase tracking-wide text-ink">Missão 404 do dia</span>
      </div>
      <div className="absolute inset-x-[7%] top-[21%]">
        <p className="truncate font-display text-[max(7px,4.4cqw)] uppercase tracking-wide text-plum-300">
          {place.game}
          {place.level ? ` · ${place.level.split(":")[0]}` : ""}
        </p>
        <p
          className={`mt-[2%] line-clamp-2 font-display uppercase leading-[0.95] text-sun [text-shadow:0.06em_0.08em_0_var(--color-ink)] ${long ? "text-[max(11px,9cqw)]" : "text-[max(12px,11.5cqw)]"}`}
        >
          {m.view.title}
        </p>
        <div className="mt-[5%]">
          <Status m={m} />
        </div>
      </div>
    </div>
  );
}
