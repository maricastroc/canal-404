"use client";

import { OfflineIcon, RestartIcon } from "@/components/art/Icons";
import { Mascot404 } from "@/components/mascot/Mascot404";
import { InkButton, InkLink } from "@/components/ui/Primitives";
import { connect } from "@/lib/competition/client";
import { useMissionToday } from "@/lib/missions/hooks";
import { MissionCartridge } from "./MissionCartridge";
import { MissionHistory } from "./MissionHistory";
import { MissionRules, TodayBoard, YourCard } from "./MissionPanels";

function Screen({ title, text, children, live, tone = "text-sun", expression = "neutral" }: { title: string; text?: string; children?: React.ReactNode; live?: boolean; tone?: string; expression?: "neutral" | "static" | "sleepy" }) {
  return (
    <div role={live ? "status" : undefined} className="on-dark relative mx-auto flex min-h-80 max-w-3xl flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-[#10122e] px-5 py-10 text-center text-cream shadow-[var(--shadow-ink-lg)]">
      <Mascot404 expression={expression} className="w-24" />
      <p className={`font-display text-2xl uppercase tracking-wide ${tone}`}>{title}</p>
      {text ? <p className="max-w-md font-semibold text-cream-2">{text}</p> : null}
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-40" />
    </div>
  );
}

export function MissionHub() {
  const mission = useMissionToday();
  const { competition, data } = mission;

  if (mission.status === "unconfigured") {
    return (
      <Screen title="A missão estreia em breve" text="A Missão 404 precisa do placar do canal, que ainda não está no ar aqui. Os jogos funcionam normalmente." tone="text-bubblegum" expression="sleepy">
        <InkLink href="/games" size="sm" tone="sun">
          Ver o catálogo
        </InkLink>
      </Screen>
    );
  }
  if (mission.status === "offline" || (competition.status === "offline" && !data)) {
    return (
      <Screen title="Sem sinal da missão" text="Não deu para falar com o canal agora. Os jogos continuam funcionando." tone="text-tomato" expression="static">
        <OfflineIcon className="size-8 text-tomato" />
        <InkButton
          size="sm"
          tone="sun"
          onClick={async () => {
            const state = await connect(true);
            if (state.status === "online") await mission.refresh();
          }}
        >
          <RestartIcon className="size-4" /> Tentar de novo
        </InkButton>
      </Screen>
    );
  }
  if (!data) return <Screen live title="Sintonizando a missão…" tone="animate-pulse text-sun" />;

  const joined = Boolean(competition.player);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <MissionCartridge data={data} offset={mission.offset} />
          <TodayBoard data={data} />
        </div>
        <aside className="flex flex-col gap-6">
          <YourCard data={data} joined={joined} />
          <MissionRules game={data.mission.game} />
        </aside>
      </div>
      {competition.player ? <MissionHistory playerId={competition.player.id} today={data.mission.day} /> : null}
    </div>
  );
}
