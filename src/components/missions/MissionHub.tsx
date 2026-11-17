"use client";

import { useEffect, useRef, useState } from "react";
import { OfflineIcon, RestartIcon } from "@/components/art/Icons";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import { useCopy } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { connect } from "@/lib/competition/client";
import { useMissionToday } from "@/lib/missions/hooks";
import { announceAchievements } from "@/lib/missions/seen";
import { MissionBoard } from "./MissionBoard";
import { MissionCartridge } from "./MissionCartridge";
import { MissionHistory } from "./MissionHistory";
import { MissionRules, YourCard } from "./MissionPanels";

const COPY = localized({
  "pt-BR": {
    soonTitle: "A missão estreia em breve",
    soonText: "A Missão 404 depende do placar do canal, que ainda não entrou no ar. Enquanto isso, os jogos funcionam normalmente.",
    catalog: "Ver o catálogo",
    offlineTitle: "Sem sinal da missão",
    offlineText: "A antena do canal não respondeu. Os jogos continuam funcionando, e a missão reaparece assim que o sinal voltar.",
    retry: "Tentar de novo",
    tuning: "Sintonizando a missão…",
  },
  en: {
    soonTitle: "The mission premieres soon",
    soonText: "Mission 404 depends on the channel's board, which isn't on the air yet. Meanwhile, the games work as usual.",
    catalog: "See the catalog",
    offlineTitle: "No signal from the mission",
    offlineText: "The channel's antenna didn't answer. The games still work, and the mission comes back as soon as the signal does.",
    retry: "Try again",
    tuning: "Tuning in the mission…",
  },
});

function Screen({ title, text, children, live, tone = "text-sun", expression = "neutral" }: { title: string; text?: string; children?: React.ReactNode; live?: boolean; tone?: string; expression?: "neutral" | "static" | "sleepy" }) {
  return (
    <div role={live ? "status" : undefined} className="on-dark relative mx-auto flex min-h-80 max-w-3xl flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-[#10122e] px-5 py-10 text-center text-cream shadow-[var(--shadow-ink-lg)]">
      <Mascot404 expression={expression} className="w-24" />
      <p className={`font-display text-2xl uppercase tracking-wide ${tone}`}>{title}</p>
      {text ? <p className="copy max-w-md text-cream-2">{text}</p> : null}
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-40" />
    </div>
  );
}

export function MissionHub() {
  const mission = useMissionToday();
  const copy = useCopy(COPY);
  const { competition, data } = mission;
  const [boardDay, setBoardDay] = useState<string | null>(null);
  const boardRef = useRef<HTMLElement>(null);
  const playerId = competition.player?.id ?? null;
  const unlocked = data?.you?.achievements;

  useEffect(() => {
    if (playerId && unlocked) announceAchievements(playerId, unlocked.map((a) => a.id));
  }, [playerId, unlocked]);

  if (mission.status === "unconfigured") {
    return (
      <Screen title={copy.soonTitle} text={copy.soonText} tone="text-bubblegum" expression="sleepy">
        <InkLink href="/games" size="sm" tone="sun">
          {copy.catalog}
        </InkLink>
      </Screen>
    );
  }
  if (mission.status === "offline" || (competition.status === "offline" && !data)) {
    return (
      <Screen title={copy.offlineTitle} text={copy.offlineText} tone="text-tomato" expression="static">
        <OfflineIcon className="size-8 text-tomato" />
        <InkButton
          size="sm"
          tone="sun"
          onClick={async () => {
            const state = await connect(true);
            if (state.status === "online") await mission.refresh();
          }}
        >
          <RestartIcon className="size-4" /> {copy.retry}
        </InkButton>
      </Screen>
    );
  }
  if (!data) return <Screen live title={copy.tuning} tone="animate-pulse text-sun" />;

  const joined = Boolean(competition.player);
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_auto_1fr]">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <MissionCartridge data={data} offset={mission.offset} />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">
        <MissionBoard
          ref={boardRef}
          day={boardDay}
          today={data.mission.day}
          refreshKey={`${data.completions}:${data.you?.attempts ?? 0}:${data.leader?.tag ?? ""}`}
          onDay={setBoardDay}
        />
      </div>
      <div className="flex flex-col gap-6 lg:top-6 lg:col-start-2 lg:[@media(min-height:54rem)]:sticky lg:row-span-3 lg:row-start-1 lg:self-start">
        <YourCard data={data} joined={joined} />
        <MissionRules mission={data.mission} />
      </div>
      {competition.player ? (
        <div className="min-w-0 lg:col-start-1 lg:row-start-3">
          <MissionHistory
            playerId={competition.player.id}
            today={data.mission.day}
            onBoard={(day) => {
              setBoardDay(day);
              boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
