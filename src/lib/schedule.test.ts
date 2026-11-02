import { describe, expect, it } from "vitest";
import { PLAYABLE } from "@/games/registry";
import { DEFAULT_STATE, type ProgressState } from "@/lib/progress/store";
import { bestRecord, FALLBACK_WEEKLY, nextPick, programState, unplayedGames, weekNumber, weeklyGame } from "./schedule";

const record = (plays: number, highScore = 0) => ({ highScore, bestStars: 0, plays, wins: 0, lastScore: 0 });
const withPlays = (map: Record<string, number>, scores: Record<string, number> = {}): ProgressState => ({
  ...DEFAULT_STATE,
  games: Object.fromEntries(Object.entries(map).map(([slug, n]) => [slug, record(n, scores[slug] ?? 0)])),
});

describe("weekly game", () => {
  it("keeps the same game from Monday to Sunday", () => {
    const monday = new Date(2026, 9, 26, 9);
    const sunday = new Date(2026, 10, 1, 23);
    expect(weekNumber(sunday)).toBe(weekNumber(monday));
    expect(weeklyGame(sunday)).toBe(weeklyGame(monday));
  });

  it("moves to the next game every week and cycles through all of them", () => {
    const start = new Date(2026, 9, 26);
    const seen = PLAYABLE.map((_, i) => weeklyGame(new Date(start.getTime() + i * 7 * 86_400_000)).slug);
    expect(new Set(seen).size).toBe(PLAYABLE.length);
    const first = PLAYABLE.indexOf(weeklyGame(start));
    expect(seen[1]).toBe(PLAYABLE[(first + 1) % PLAYABLE.length].slug);
  });

  it("falls back to a playable game before the visitor's clock is known", () => {
    expect(PLAYABLE).toContain(FALLBACK_WEEKLY);
  });
});

describe("next suggestion", () => {
  const date = new Date(2026, 9, 26);

  it("suggests a game the visitor has never played, starting from the weekly game", () => {
    expect(nextPick(DEFAULT_STATE, { date })).toEqual({ game: weeklyGame(date), reason: "unplayed" });
  });

  it("skips excluded and already played games", () => {
    const weekly = weeklyGame(date);
    const order = [...PLAYABLE.slice(PLAYABLE.indexOf(weekly)), ...PLAYABLE.slice(0, PLAYABLE.indexOf(weekly))];
    const progress = withPlays({ [order[1].slug]: 2 });
    expect(nextPick(progress, { date, exclude: [weekly.slug] }).game).toBe(order[2]);
  });

  it("suggests the least played game once everything was played", () => {
    const progress = withPlays(Object.fromEntries(PLAYABLE.map((g, i) => [g.slug, i === 3 ? 1 : 5])));
    expect(nextPick(progress, { date })).toEqual({ game: PLAYABLE[3], reason: "least" });
  });

  it("still suggests something when every game is excluded", () => {
    expect(nextPick(DEFAULT_STATE, { date, exclude: PLAYABLE.map((g) => g.slug) }).game).toBeDefined();
  });
});

describe("program state", () => {
  const adventure = PLAYABLE.find((g) => g.resumable)!;
  const arcade = PLAYABLE.find((g) => !g.resumable)!;

  it("marks new, rerun and saved programs", () => {
    expect(programState(DEFAULT_STATE, arcade, false)).toBe("unplayed");
    expect(programState(withPlays({ [arcade.slug]: 1 }), arcade, false)).toBe("rerun");
    expect(programState(DEFAULT_STATE, adventure, true)).toBe("saved");
    expect(programState(DEFAULT_STATE, arcade, true)).toBe("unplayed");
  });

  it("lists unplayed games and the best record", () => {
    const progress = withPlays({ [PLAYABLE[0].slug]: 2, [PLAYABLE[1].slug]: 1 }, { [PLAYABLE[0].slug]: 900, [PLAYABLE[1].slug]: 1200 });
    expect(unplayedGames(progress)).toHaveLength(PLAYABLE.length - 2);
    expect(bestRecord(progress)).toEqual({ game: PLAYABLE[1], score: 1200 });
    expect(bestRecord(DEFAULT_STATE)).toBeNull();
  });
});
