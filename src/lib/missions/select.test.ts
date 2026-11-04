import { describe, expect, it } from "vitest";
import { addDays, dayNumber } from "./calendar";
import { CATALOG, type MissionDef } from "./catalog";
import { missionSeed, pickMission, scheduledMission } from "./select";

const FIRST = "2026-11-01";

function days(from: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

describe("daily mission selection", () => {
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

  it("does not depend on the catalog order in the source", () => {
    const reversed = [...CATALOG].reverse();
    for (const day of days(FIRST, 40)) expect(pickMission(day, null, reversed).key).toBe(pickMission(day).key);
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
