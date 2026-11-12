import { describe, expect, it } from "vitest";
import { PLAYABLE } from "@/games/registry";
import { DEFAULT_STATE, type ProgressState } from "@/lib/progress/store";
import { bestRecord, nextPick, programState, unplayedGames } from "./schedule";

const record = (plays: number, highScore = 0) => ({ highScore, bestStars: 0, plays, wins: 0, lastScore: 0 });
const withPlays = (map: Record<string, number>, scores: Record<string, number> = {}): ProgressState => ({
  ...DEFAULT_STATE,
  games: Object.fromEntries(Object.entries(map).map(([slug, n]) => [slug, record(n, scores[slug] ?? 0)])),
});

describe("next suggestion", () => {
  it("suggests the first game the visitor has never played, in catalog order", () => {
    expect(nextPick(DEFAULT_STATE)).toEqual({ game: PLAYABLE[0], reason: "unplayed" });
  });

  it("skips excluded and already played games", () => {
    const progress = withPlays({ [PLAYABLE[1].slug]: 2 });
    expect(nextPick(progress, { exclude: [PLAYABLE[0].slug] }).game).toBe(PLAYABLE[2]);
  });

  it("suggests the least played game once everything was played", () => {
    const progress = withPlays(Object.fromEntries(PLAYABLE.map((g, i) => [g.slug, i === 3 ? 1 : 5])));
    expect(nextPick(progress)).toEqual({ game: PLAYABLE[3], reason: "least" });
  });

  it("still suggests something when every game is excluded", () => {
    expect(nextPick(DEFAULT_STATE, { exclude: PLAYABLE.map((g) => g.slug) }).game).toBeDefined();
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
