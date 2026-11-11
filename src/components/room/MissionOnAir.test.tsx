import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MissionView } from "@/lib/missions/types";
import { missionCta, MissionOnAirProvider, MissionScreen, type MissionOnAir } from "./MissionOnAir";
import { channelOrder, CHANNEL_ORDER, CHANNELS, isRegularChannel } from "./objects/TvChannels";

const VIEW: MissionView = {
  day: "2026-11-11",
  key: "lab-remote-three-parts",
  version: 1,
  game: "bad-ideas-lab",
  level: "remote",
  title: "Volta completa",
  objective: "Aperte o botão do controle usando as duas esteiras e a rampa.",
  goal: [{ stat: "parts", op: "min", value: 3 }],
  ranked: true,
  endsAt: new Date(Date.now() + 3 * 3_600_000).toISOString(),
  closesAt: new Date(Date.now() + 4 * 3_600_000).toISOString(),
};

function onAir(overrides: Partial<MissionOnAir> = {}): MissionOnAir {
  return { view: VIEW, state: "new", best: null, offset: 0, ...overrides };
}

describe("the mission on the room TV", () => {
  it("is a channel only while there is a mission on air", () => {
    expect(channelOrder(false)).toEqual(CHANNEL_ORDER);
    expect(channelOrder(true)).toEqual([...CHANNEL_ORDER, "mission"]);
    expect(isRegularChannel("mission")).toBe(false);
    expect(isRegularChannel("mission", channelOrder(true))).toBe(true);
    expect(CHANNELS.mission).toMatchObject({ number: "09", name: "Missão 404 do Dia" });
  });

  it("plays the mission until it is done, then shows the day's board", () => {
    expect(missionCta(onAir())).toEqual({ href: "/play/bad-ideas-lab?mission=2026-11-11", label: "Jogar missão", context: "Missão 404 do dia: Volta completa", play: true });
    expect(missionCta(onAir({ state: "completed" }))).toEqual({ href: "/mission", label: "Ver placar", context: "Missão 404 do dia: Volta completa" });
  });

  it("shows the bulletin with the game, level, title and time left", () => {
    render(
      <MissionOnAirProvider value={onAir()}>
        <MissionScreen />
      </MissionOnAirProvider>,
    );
    expect(screen.getByText("Plantão")).toBeInTheDocument();
    expect(screen.getByText(/Laboratório de Péssimas Ideias · Fase 5/)).toBeInTheDocument();
    expect(screen.getByText("Volta completa")).toBeInTheDocument();
    expect(screen.getByText("Termina em")).toBeInTheDocument();
  });

  it("marks the last hour and the completed mission", () => {
    const { rerender } = render(
      <MissionOnAirProvider value={onAir({ view: { ...VIEW, endsAt: new Date(Date.now() + 20 * 60_000).toISOString() } })}>
        <MissionScreen />
      </MissionOnAirProvider>,
    );
    expect(screen.getByText("Última hora")).toBeInTheDocument();
    rerender(
      <MissionOnAirProvider value={onAir({ state: "completed", best: { score: 1000, metrics: [3, 209], position: 2, total: 9, achievedAt: VIEW.endsAt } })}>
        <MissionScreen />
      </MissionOnAirProvider>,
    );
    expect(screen.getByText(/Cumprida · 2º no placar/)).toBeInTheDocument();
  });

  it("falls back to a quiet screen when the mission is not available", () => {
    render(<MissionScreen />);
    expect(screen.getByText("Plantão fora do ar")).toBeInTheDocument();
  });
});
