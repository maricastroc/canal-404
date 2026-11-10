import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SubmitResponse } from "@/lib/competition/types";
import type { MissionOutcome, MissionView } from "@/lib/missions/types";
import { describeMission, MissionBrief, MissionLine } from "./MissionLine";

const VIEW: MissionView = {
  day: "2026-11-04",
  key: "lab-pixel-fast",
  version: 1,
  game: "bad-ideas-lab",
  level: "pixel",
  title: "Despertador ligeiro",
  objective: "Acorde o Pixel rápido: a bolinha tem que tocar o sino em até 4,20 segundos.",
  goal: [{ stat: "steps", op: "max", value: 252 }],
  ranked: true,
  endsAt: "2026-11-05T03:00:00.000Z",
  closesAt: "2026-11-05T04:00:00.000Z",
};

function done(mission: Partial<MissionOutcome> | null) {
  const response: SubmitResponse = {
    run: { id: "r", verification: "replayed", eligible: true, score: 1450, stars: 3 },
    board: null,
    repeated: false,
    mission: mission ? { day: VIEW.day, title: VIEW.title, status: "completed", firstTime: false, shortfall: null, best: null, improved: false, achievements: [], ...mission } : null,
  };
  return { phase: "done" as const, outcome: { kind: "accepted" as const, response } };
}

const BEST = { score: 1450, metrics: [1, 245], position: 3, total: 12, achievedAt: "2026-11-04T15:00:00.000Z" };

describe("describeMission", () => {
  it("celebrates the first completion with the day's place", () => {
    expect(describeMission(VIEW, done({ firstTime: true, best: BEST, improved: true }))).toMatchObject({
      tone: "done",
      headline: "Missão cumprida!",
      text: "1 peça · 4,08 s, 3º de 12 no placar do dia.",
      stamp: true,
    });
  });

  it("does not celebrate twice", () => {
    expect(describeMission(VIEW, done({ best: BEST }))).toMatchObject({ headline: "Missão já cumprida hoje" });
    expect(describeMission(VIEW, done({ best: BEST, improved: true }))).toMatchObject({ headline: "Seu melhor do dia!" });
  });

  it("explains a miss with the measured number", () => {
    const line = describeMission(VIEW, done({ status: "missed", shortfall: { condition: VIEW.goal[0], actual: 256 } }));
    expect(line).toMatchObject({ tone: "miss", headline: "Quase!" });
    expect(line.text).toContain("A bolinha levou 4,27 s.");
  });

  it("says when the mission changed or the result came too late", () => {
    expect(describeMission(VIEW, done(null))).toMatchObject({ tone: "off", headline: "Fora da missão" });
    expect(describeMission(VIEW, done({ status: "late" })).text).toContain("quarta-feira, 4 de novembro");
  });

  it("covers sending, nickname and offline states", () => {
    expect(describeMission(VIEW, { phase: "sending" }).headline).toBe("Conferindo a missão…");
    expect(describeMission(VIEW, { phase: "join" }).headline).toBe("Falta seu apelido");
    expect(describeMission(VIEW, { phase: "done", outcome: { kind: "queued" } }).text).toContain("até 1h da manhã");
    expect(describeMission(VIEW, { phase: "done", outcome: { kind: "unranked", why: "no-ticket" } }).text).toContain("não conta para a missão");
    expect(describeMission(VIEW, { phase: "done", outcome: { kind: "rejected", message: "x" } }).headline).toBe("Não valeu");
    expect(describeMission(VIEW, null).tone).toBe("off");
  });
});

describe("mission panels", () => {
  it("announces the result and links to the mission page", () => {
    render(<MissionLine view={VIEW} board={done({ firstTime: true, best: BEST })} />);
    const region = screen.getByRole("region", { name: "Missão 404 do dia" });
    expect(region).toHaveTextContent("Despertador ligeiro");
    expect(screen.getByRole("status")).toHaveTextContent("Missão cumprida!");
    expect(screen.getByRole("link", { name: "Ver a Missão 404" })).toHaveAttribute("href", "/mission");
  });

  it("briefs the mission before the run with its level and state", () => {
    render(<MissionBrief view={VIEW} state="started" />);
    const region = screen.getByRole("region", { name: "Despertador ligeiro" });
    expect(region).toHaveTextContent("Fase 2: Bom dia, Pixel");
    expect(region).toHaveTextContent(VIEW.objective);
    expect(region).toHaveTextContent("Em andamento");
  });
});
