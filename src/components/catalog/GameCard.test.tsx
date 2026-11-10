import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAYABLE } from "@/games/registry";
import { weeklyGame } from "@/lib/schedule";

const record = (plays: number) => ({ highScore: 0, bestStars: 0, plays, wins: 0, lastScore: 0 });

async function renderCatalog(games: Record<string, number>, saves: string[] = []) {
  window.localStorage.setItem(
    "canal404:progress:v1",
    JSON.stringify({ version: 1, visits: 2, games: Object.fromEntries(Object.entries(games).map(([slug, n]) => [slug, record(n)])) }),
  );
  for (const key of saves) window.localStorage.setItem(key, "{}");
  vi.resetModules();
  const { GameCatalog } = await import("./GameCatalog");
  render(<GameCatalog />);
}

const card = (title: string) => screen.getByRole("heading", { name: title, level: 2 }).closest("a")!;
const sticker = (title: string) => card(title).querySelector("[data-sticker]")?.getAttribute("data-sticker");

describe("game card program stickers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("marks never-played games as new and played games as reruns", async () => {
    await renderCatalog({ "food-fight": 2 });
    await vi.waitFor(() => expect(sticker("Guerra de Lanche")).toBe("rerun"));
    expect(sticker("Rua Sem Saída")).toBe("unplayed");
    expect(within(card("Guerra de Lanche")).getByText(/Reprise: você já jogou\./)).toBeInTheDocument();
  });

  it("shows a saved adventure instead of the play count", async () => {
    const adventure = PLAYABLE.find((g) => g.resumable)!;
    await renderCatalog({ [adventure.slug]: 1 }, [adventure.resumable!]);
    await vi.waitFor(() => expect(sticker(adventure.title)).toBe("saved"));
  });

  it("puts the weekly ribbon on exactly one card, the game of this week", async () => {
    await renderCatalog({});
    const weekly = weeklyGame(new Date());
    await vi.waitFor(() => expect(screen.getAllByText(/^Jogo da semana\.?\s*$/)).toHaveLength(1));
    expect(within(card(weekly.title)).getAllByText(/Jogo da semana/).length).toBeGreaterThan(0);
  });

  it("no longer uses the generic playable sticker", async () => {
    await renderCatalog({});
    expect(screen.queryByText("Jogável!")).not.toBeInTheDocument();
  });
});
