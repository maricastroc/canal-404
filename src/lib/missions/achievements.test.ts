import { describe, expect, it } from "vitest";
import { earnedOnCompletion, isMissionAchievement, MISSION_ACHIEVEMENTS } from "./achievements";

describe("mission achievements", () => {
  it("have unique ids, a name, a description and a hint", () => {
    expect(new Set(MISSION_ACHIEVEMENTS.map((a) => a.id)).size).toBe(MISSION_ACHIEVEMENTS.length);
    for (const a of MISSION_ACHIEVEMENTS) {
      expect(a.id).toMatch(/^mission-[a-z-]+$/);
      expect(a.title.length).toBeGreaterThan(3);
      expect(a.description.length).toBeGreaterThan(10);
      expect(a.hint.length).toBeGreaterThan(10);
    }
    expect(isMissionAchievement("mission-first")).toBe(true);
    expect(isMissionAchievement("lab-first")).toBe(false);
  });

  it("are earned from the days with a completed mission, counting different days", () => {
    expect(earnedOnCompletion([], "2026-11-04")).toEqual(["mission-first"]);
    expect(earnedOnCompletion(["2026-11-01", "2026-11-03"], "2026-11-04")).toEqual(["mission-first", "mission-regular"]);
    expect(earnedOnCompletion(["2026-11-04", "2026-11-04"], "2026-11-04")).toEqual(["mission-first"]);
    const six = ["2026-10-01", "2026-10-03", "2026-10-05", "2026-10-07", "2026-10-09", "2026-10-11"];
    expect(earnedOnCompletion(six, "2026-10-13")).toEqual(["mission-first", "mission-regular", "mission-marathon"]);
  });

  it("call a return De Volta ao Ar only after 7 whole days without a completion", () => {
    expect(earnedOnCompletion(["2026-11-01"], "2026-11-08")).not.toContain("mission-back-on-air");
    expect(earnedOnCompletion(["2026-11-01"], "2026-11-09")).toContain("mission-back-on-air");
    expect(earnedOnCompletion(["2026-11-01", "2026-11-12"], "2026-11-09")).toContain("mission-back-on-air");
    expect(earnedOnCompletion([], "2026-11-09")).not.toContain("mission-back-on-air");
  });
});
