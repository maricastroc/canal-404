import { describe, expect, it } from "vitest";
import { computeLevelProgress } from "./levelProgress";

const LEVELS = ["a", "b", "c", "d"].map((id) => ({ id, title: id, goal: id }));

describe("computeLevelProgress", () => {
  it("is undefined for games without levels", () => {
    expect(computeLevelProgress(undefined, {})).toBeUndefined();
  });

  it("opens only the first level for a new player", () => {
    expect(computeLevelProgress(LEVELS, undefined)).toEqual({ stars: [0, 0, 0, 0], unlocked: 0, suggested: 0 });
  });

  it("unlocks the level after the furthest one with stars and suggests it", () => {
    expect(computeLevelProgress(LEVELS, { a: { stars: 3 }, b: { stars: 1 } })).toEqual({ stars: [3, 1, 0, 0], unlocked: 2, suggested: 2 });
  });

  it("suggests the first level without stars when an earlier one was skipped", () => {
    expect(computeLevelProgress(LEVELS, { a: { stars: 2 }, c: { stars: 1 } })).toEqual({ stars: [2, 0, 1, 0], unlocked: 3, suggested: 1 });
  });

  it("suggests the last level once every level has stars", () => {
    const all = Object.fromEntries(LEVELS.map((l) => [l.id, { stars: 3 }]));
    expect(computeLevelProgress(LEVELS, all)).toEqual({ stars: [3, 3, 3, 3], unlocked: 3, suggested: 3 });
  });

  it("ignores records for levels that no longer exist", () => {
    expect(computeLevelProgress(LEVELS, { old: { stars: 3 } })).toEqual({ stars: [0, 0, 0, 0], unlocked: 0, suggested: 0 });
  });
});
