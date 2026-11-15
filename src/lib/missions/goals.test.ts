import { describe, expect, it } from "vitest";
import { checkGoal, isCondition } from "./goals";

describe("mission goals", () => {
  it("passes only when every condition holds", () => {
    const goal = [
      { stat: "parts", op: "min", value: 5 },
      { stat: "untouched", op: "max", value: 0 },
    ] as const;
    expect(checkGoal([...goal], { parts: 5, untouched: 0 })).toEqual({ passed: true });
    expect(checkGoal([...goal], { parts: 5, untouched: 2 })).toEqual({ passed: false, condition: goal[1], actual: 2 });
    expect(checkGoal([...goal], { parts: 4, untouched: 0 })).toEqual({ passed: false, condition: goal[0], actual: 4 });
  });

  it("fails when the run does not carry the stat the mission needs", () => {
    expect(checkGoal([{ stat: "bestStreak", op: "min", value: 8 }], { score: 9000 })).toMatchObject({ passed: false, actual: null });
  });

  it("validates stored conditions", () => {
    expect(isCondition({ stat: "steps", op: "max", value: 252 })).toBe(true);
    expect(isCondition({ stat: "steps", op: "less", value: 252 })).toBe(false);
    expect(isCondition({ stat: "wallhack", op: "max", value: 1 })).toBe(false);
    expect(isCondition({ stat: "steps", op: "max", value: 2.5 })).toBe(false);
    expect(isCondition(null)).toBe(false);
  });
});
