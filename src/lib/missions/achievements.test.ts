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

  const lab = (...days: string[]) => days.map((day) => ({ day, game: "bad-ideas-lab" }));
  const today = (day: string, game = "food-fight") => ({ day, game });

  it("are earned from the days with a completed mission, counting different days", () => {
    expect(earnedOnCompletion([], today("2026-11-04"))).toEqual(["mission-first"]);
    expect(earnedOnCompletion(lab("2026-11-01", "2026-11-03"), today("2026-11-04"))).toEqual(["mission-first", "mission-regular"]);
    expect(earnedOnCompletion(lab("2026-11-04", "2026-11-04"), today("2026-11-04"))).toEqual(["mission-first"]);
    const six = lab("2026-10-01", "2026-10-03", "2026-10-05", "2026-10-07", "2026-10-09", "2026-10-11");
    expect(earnedOnCompletion(six, today("2026-10-13"))).toEqual(["mission-first", "mission-regular", "mission-marathon"]);
  });

  it("call a return De Volta ao Ar only after 7 whole days without a completion", () => {
    expect(earnedOnCompletion(lab("2026-11-01"), today("2026-11-08"))).not.toContain("mission-back-on-air");
    expect(earnedOnCompletion(lab("2026-11-01"), today("2026-11-09"))).toContain("mission-back-on-air");
    expect(earnedOnCompletion(lab("2026-11-01", "2026-11-12"), today("2026-11-09"))).toContain("mission-back-on-air");
    expect(earnedOnCompletion([], today("2026-11-09"))).not.toContain("mission-back-on-air");
  });

  it("give Grade Completa once a mission was completed in each of the five games", () => {
    const four = [
      { day: "2026-11-16", game: "bad-ideas-lab" },
      { day: "2026-11-17", game: "dead-end-street" },
      { day: "2026-11-18", game: "food-fight" },
      { day: "2026-11-19", game: "operation-recess" },
    ];
    expect(earnedOnCompletion(four, today("2026-11-20", "food-fight"))).not.toContain("mission-full-grid");
    expect(earnedOnCompletion(four, today("2026-11-20", "pajama-war"))).toContain("mission-full-grid");
    expect(earnedOnCompletion([...four, { day: "2026-11-20", game: "off-air-vacation" }], today("2026-11-21", "food-fight"))).not.toContain("mission-full-grid");
  });
});
