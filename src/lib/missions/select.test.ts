import { describe, expect, it } from "vitest";
import { addDays, dayNumber } from "./calendar";
import { CATALOG, MISSION_GAMES, ROTATIONS, type MissionDef } from "./catalog";
import { missionSeed, pickMission, scheduledMission } from "./select";

const FIRST = "2026-11-01";

function days(from: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

const PUBLISHED_BEFORE_FIVE_GAMES: Record<string, string> = {
  "2026-11-01": "lab-juice-fast",
  "2026-11-02": "food-two-stars",
  "2026-11-03": "lab-pixel-fast",
  "2026-11-04": "food-spotless",
  "2026-11-05": "lab-juice-fan-and-ramp",
  "2026-11-06": "food-two-stars",
  "2026-11-07": "lab-pixel-fast",
  "2026-11-08": "food-right-on-time",
  "2026-11-09": "lab-finale-every-part",
  "2026-11-10": "food-streak-eight",
  "2026-11-11": "lab-remote-three-parts",
  "2026-11-12": "food-lunch-lady",
  "2026-11-13": "lab-pixel-two-ramps",
  "2026-11-14": "food-right-on-time",
  "2026-11-15": "lab-juice-fast",
};

describe("daily mission selection", () => {
  it("keeps every day before the five-game rotation exactly as it was scheduled", () => {
    for (const [day, key] of Object.entries(PUBLISHED_BEFORE_FIVE_GAMES)) expect(pickMission(day).key, day).toBe(key);
  });

  it("is the same for everyone and every request on a given day", () => {
    const a = pickMission("2026-11-04");
    const b = pickMission("2026-11-04");
    expect(a).toBe(b);
    expect(days(FIRST, 60).map((d) => pickMission(d).key)).toEqual(days(FIRST, 60).map((d) => pickMission(d).key));
  });

  it("never repeats a mission or a game on consecutive days", () => {
    const keys = days("2026-01-01", 1100).map((d) => pickMission(d));
    for (let i = 1; i < keys.length; i += 1) {
      expect(keys[i].key, addDays("2026-01-01", i)).not.toBe(keys[i - 1].key);
      expect(keys[i].game).not.toBe(keys[i - 1].game);
    }
  });

  it("goes through the whole catalog of a game before repeating one of its missions", () => {
    for (const game of ["bad-ideas-lab", "food-fight"]) {
      const size = CATALOG.filter((m) => m.game === game).length;
      const cycles = new Map<number, string[]>();
      for (const day of days("2026-01-01", 2 * size * 12)) {
        const mission = pickMission(day);
        if (mission.game !== game) continue;
        const cycle = Math.floor(Math.floor(dayNumber(day) / 2) / size);
        cycles.set(cycle, [...(cycles.get(cycle) ?? []), mission.key]);
      }
      const complete = [...cycles.values()].filter((keys) => keys.length === size);
      expect(complete.length).toBeGreaterThan(8);
      for (const keys of complete) expect(new Set(keys).size).toBe(size);
    }
    expect(new Set(days(FIRST, 80).map((d) => pickMission(d).key)).size).toBe(CATALOG.length);
  });

  it("rotates the five games from the switch day, each one exactly once per five days", () => {
    const start = ROTATIONS[ROTATIONS.length - 1].from!;
    expect(start).toBe("2026-11-16");
    for (let block = 0; block < 40; block += 1) {
      const games = days(addDays(start, block * 5), 5).map((d) => pickMission(d).game);
      expect(new Set(games), `block ${block}`).toEqual(new Set(MISSION_GAMES));
    }
    expect(pickMission(start).game).not.toBe(pickMission(addDays(start, -1)).game);
  });

  it("goes through each game's missions before repeating one, in the five-game rotation", () => {
    const start = ROTATIONS[ROTATIONS.length - 1].from!;
    for (const game of MISSION_GAMES) {
      const size = CATALOG.filter((m) => m.game === game).length;
      expect(size, game).toBeGreaterThanOrEqual(3);
      const seen = days(start, 5 * size * 6)
        .map((d) => pickMission(d))
        .filter((m) => m.game === game)
        .map((m) => m.key);
      for (let i = 0; i + size <= seen.length; i += size) expect(new Set(seen.slice(i, i + size)).size, game).toBe(size);
    }
  });

  it("does not depend on the catalog order in the source", () => {
    const reversed = [...CATALOG].reverse();
    for (const day of days(FIRST, 80)) expect(pickMission(day, null, reversed).key).toBe(pickMission(day).key);
  });

  it("can avoid yesterday's mission when the catalog changed", () => {
    const day = "2026-11-10";
    const usual = pickMission(day);
    const other = pickMission(day, usual.key);
    expect(other.key).not.toBe(usual.key);
    expect(other.game).toBe(usual.game);
  });

  it("keeps working with a single game", () => {
    const single: MissionDef[] = CATALOG.filter((m) => m.game === "food-fight");
    const keys = days(FIRST, 200).map((d) => scheduledMission(d, single)[0].key);
    for (let i = 1; i < keys.length; i += 1) expect(keys[i]).not.toBe(keys[i - 1]);
  });

  it("derives a stable seed per day", () => {
    expect(missionSeed("2026-11-04")).toBe(missionSeed("2026-11-04"));
    expect(missionSeed("2026-11-04")).not.toBe(missionSeed("2026-11-05"));
    expect(missionSeed("2026-11-04")).toBeGreaterThanOrEqual(0);
  });
});
