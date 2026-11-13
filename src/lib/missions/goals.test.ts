import { describe, expect, it } from "vitest";
import { checkGoal, describeShortfall, isCondition, machineSeconds, missionNotes, missionOverridesStars } from "./goals";

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

  it("explains a miss with the measured number and what the mission asked for", () => {
    const miss = (stat: Parameters<typeof checkGoal>[0][number]["stat"], op: "min" | "max", value: number, actual: number, game: Parameters<typeof describeShortfall>[1]) =>
      describeShortfall({ passed: false, condition: { stat, op, value }, actual }, game);
    expect(miss("parts", "min", 2, 1, "bad-ideas-lab")).toBe("A máquina usou 1 peça, e a missão pede pelo menos 2 peças.");
    expect(miss("parts", "max", 2, 3, "bad-ideas-lab")).toBe("A máquina usou 3 peças, e a missão pede no máximo 2 peças.");
    expect(miss("untouched", "max", 0, 1, "bad-ideas-lab")).toBe("A bolinha não passou por 1 peça, e a missão pede que ela passe por todas.");
    expect(miss("steps", "max", 252, 256, "bad-ideas-lab")).toBe("A bolinha levou 4,27 s, e a missão pede até 4,20 s.");
    expect(miss("bestStreak", "min", 8, 6, "food-fight")).toBe("Sua melhor sequência foi de 6 acertos, e a missão pede 8 acertos seguidos.");
    expect(miss("won", "min", 1, 0, "food-fight")).toBe("Os guardanapos acabaram antes do sinal.");
    expect(miss("hitsTaken", "max", 0, 1, "food-fight")).toBe("Você levou 1 pudim, e na missão não pode levar nenhum.");
    expect(miss("lunchLadyHits", "max", 0, 2, "food-fight")).toBe("A tia levou 2 lanches, e na missão a tia não pode levar nenhum.");
    expect(miss("score", "min", 7500, 6200, "food-fight")).toBe("Você fez 6.200 pontos, e a missão pede pelo menos 7.500 pontos.");
    expect(miss("interrupts", "min", 5, 3, "food-fight")).toBe("Você acertou 3 vezes na hora H, e a missão pede 5 vezes.");
    expect(miss("bumps", "max", 3, 4, "operation-recess")).toBe("O Bruno levou 4 batidas, e a missão aceita no máximo 3 batidas.");
    expect(miss("bumps", "max", 0, 1, "operation-recess")).toBe("O Bruno levou 1 batida, e a missão aceita nenhuma.");
    expect(miss("damageTaken", "max", 4, 6, "pajama-war")).toBe("Você levou 6 travesseiradas, e a missão aceita no máximo 4 travesseiradas.");
    expect(miss("hp", "min", 7, 5, "pajama-war")).toBe("Você terminou com 5 pontos de energia, e a missão pede 7 pontos.");
    expect(miss("kid", "min", 0, 1, "pajama-war")).toBe("Você jogou com o Nico, e a missão pede a Lia.");
  });

  it("separates the mission from the level's stars only where they pull apart", () => {
    const parts = { game: "bad-ideas-lab" as const, level: "pixel", goal: [{ stat: "parts" as const, op: "min" as const, value: 2 }] };
    expect(missionOverridesStars(parts)).toBe(true);
    expect(missionNotes(parts)).toEqual(["Nesta missão, você precisa usar 2 peças. Por isso, pode ganhar até 2 estrelas na fase. Mas fique tranquilo: para cumprir a missão, o que conta é completar o desafio!"]);
    expect(missionNotes({ ...parts, level: "finale", goal: [{ stat: "parts", op: "min", value: 5 }] })[0]).toContain("usar 5 peças. Por isso, pode ganhar até 1 estrela na fase.");
    expect(missionNotes({ ...parts, level: "finale" })).toEqual([]);
    expect(missionOverridesStars({ game: "bad-ideas-lab", level: "pixel", goal: [{ stat: "parts", op: "max", value: 2 }] })).toBe(false);
    expect(missionNotes({ game: "bad-ideas-lab", goal: [{ stat: "steps", op: "max", value: 252 }] })).toEqual([]);
    expect(missionNotes({ game: "operation-recess", goal: [] })[0]).toMatch(/os sinos tocam, mas não salvam/);
    expect(missionNotes({ game: "pajama-war", goal: [], setup: { character: "lia" } })).toEqual(["Nesta missão você joga com a Lia. Sua criança favorita continua a mesma."]);
  });

  it("says how each game was lost in its own words", () => {
    const lost = (game: Parameters<typeof describeShortfall>[1]) => describeShortfall({ passed: false, condition: { stat: "won", op: "min", value: 1 }, actual: 0 }, game);
    expect(lost("dead-end-street")).toBe("A munição acabou antes da última rodada.");
    expect(lost("operation-recess")).toBe("Os corações do Bruno acabaram antes do fim da fase.");
    expect(lost("pajama-war")).toBe("Sua energia acabou antes do fim da guerra.");
  });

  it("explains the street's numbers", () => {
    expect(describeShortfall({ passed: false, condition: { stat: "launches", op: "max", value: 5 }, actual: 6 }, "dead-end-street")).toBe("Você usou 6 lançamentos, e a missão pede no máximo 5 lançamentos.");
    expect(describeShortfall({ passed: false, condition: { stat: "combos", op: "min", value: 1 }, actual: 0 }, "dead-end-street")).toBe("Nenhum lançamento derrubou dois alvos de uma vez.");
    expect(describeShortfall({ passed: false, condition: { stat: "mess", op: "min", value: 8 }, actual: 6 }, "dead-end-street")).toBe("Só 6 coisas do quintal saíram do lugar, e a missão pede 8.");
  });

  it("shows machine time with two decimals so the limit is never ambiguous", () => {
    expect(machineSeconds(252)).toBe("4,20 s");
    expect(machineSeconds(253)).toBe("4,22 s");
    expect(machineSeconds(108)).toBe("1,80 s");
  });
});
