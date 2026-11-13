import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getGame } from "@/games/registry";
import type { GameResult } from "@/games/types";

const LOST: GameResult = { won: false, score: 300, stars: 0, breakdown: [{ label: "Acertos", value: 300 }] };

async function renderResult(slug: string, games: Record<string, number>, onNext?: () => void) {
  window.localStorage.setItem(
    "canal404:progress:v1",
    JSON.stringify({ version: 1, visits: 2, games: Object.fromEntries(Object.entries(games).map(([s, plays]) => [s, { highScore: 0, bestStars: 0, plays, wins: 0, lastScore: 0 }])) }),
  );
  vi.resetModules();
  const { ResultPanel } = await import("./Panels");
  render(<ResultPanel game={getGame(slug)!} result={LOST} isRecord={false} recordNote="" onRestart={vi.fn()} onNext={onNext} />);
}

describe("ResultPanel next program", () => {
  it("suggests another game the visitor has not played yet", async () => {
    await renderResult("food-fight", { "food-fight": 3, "dead-end-street": 1 });
    const bumper = await screen.findByRole("complementary", { name: "Depois do intervalo" });
    const link = within(bumper).getByRole("link");
    const href = link.getAttribute("href")!;
    expect(href).toMatch(/^\/play\//);
    expect(href).not.toContain("food-fight");
    expect(href).not.toContain("dead-end-street");
    expect(within(bumper).getByText("Inédito pra você")).toBeInTheDocument();
  });

  it("stays out of the way when there is a next level to play", async () => {
    await renderResult("bad-ideas-lab", {}, vi.fn());
    expect(screen.queryByRole("complementary", { name: "Depois do intervalo" })).not.toBeInTheDocument();
  });
});

describe("ResultPanel stars and mission", () => {
  const WON: GameResult = {
    won: true,
    score: 1150,
    stars: 2,
    breakdown: [{ label: "Máquina funcionou", value: 1000 }],
    level: { index: 1, id: "pixel", title: "Bom dia, Pixel", total: 6 },
    summary: "Você usou 2 peças.",
    starHint: "Com 1 peça só, a fase vale 3 estrelas.",
  };
  const MISSION = {
    day: "2026-11-13",
    key: "lab-pixel-two-ramps",
    version: 1,
    game: "bad-ideas-lab" as const,
    level: "pixel",
    title: "Rampa dupla",
    objective: "Acorde o Pixel usando as duas rampas.",
    goal: [{ stat: "parts" as const, op: "min" as const, value: 2 }],
    ranked: true,
    endsAt: "2026-11-14T03:00:00.000Z",
    closesAt: "2026-11-14T04:00:00.000Z",
  };

  async function show(mission: typeof MISSION | null) {
    vi.resetModules();
    const { ResultPanel } = await import("./Panels");
    render(<ResultPanel game={getGame("bad-ideas-lab")!} result={WON} isRecord={false} recordNote="" mission={mission} onRestart={vi.fn()} />);
  }

  it("shows how to earn more stars in a normal run", async () => {
    await show(null);
    expect(screen.getByText("Com 1 peça só, a fase vale 3 estrelas.")).toBeInTheDocument();
  });

  it("drops the star hint when the mission asks for more parts", async () => {
    await show(MISSION);
    expect(screen.queryByText("Com 1 peça só, a fase vale 3 estrelas.")).not.toBeInTheDocument();
    expect(screen.getByText("Você usou 2 peças.")).toBeInTheDocument();
  });
});
