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
