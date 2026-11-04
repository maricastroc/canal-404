import { describe, expect, it } from "vitest";
import { checkGoal, describeShortfall, isCondition, machineSeconds } from "./goals";

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

  it("explains a miss with the measured number, in plain words", () => {
    expect(describeShortfall({ passed: false, condition: { stat: "steps", op: "max", value: 252 }, actual: 256 })).toBe("A bolinha levou 4,27 s.");
    expect(describeShortfall({ passed: false, condition: { stat: "bestStreak", op: "min", value: 8 }, actual: 6 })).toBe("Sua melhor sequência foi de 6 acertos.");
    expect(describeShortfall({ passed: false, condition: { stat: "untouched", op: "max", value: 0 }, actual: 1 })).toBe("A bolinha não passou por 1 peça.");
    expect(describeShortfall({ passed: false, condition: { stat: "won", op: "min", value: 1 }, actual: 0 })).toBe("Os guardanapos acabaram antes do sinal.");
    expect(describeShortfall({ passed: false, condition: { stat: "hitsTaken", op: "max", value: 0 }, actual: 1 })).toBe("Você levou 1 pudim.");
    expect(describeShortfall({ passed: false, condition: { stat: "score", op: "min", value: 7500 }, actual: 6200 })).toBe("Você fez 6.200 pontos.");
  });

  it("shows machine time with two decimals so the limit is never ambiguous", () => {
    expect(machineSeconds(252)).toBe("4,20 s");
    expect(machineSeconds(253)).toBe("4,22 s");
    expect(machineSeconds(108)).toBe("1,80 s");
  });
});
