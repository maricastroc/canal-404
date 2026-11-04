import { describe, expect, it } from "vitest";
import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { LEVELS } from "@/games/bad-ideas-lab/levels";
import { SOLUTIONS } from "@/games/bad-ideas-lab/solutions";
import { simulateLab } from "@/games/bad-ideas-lab/sim";
import { hasLevel, judgeRun, type RunClaim } from "@/lib/competition/rules";
import { CATALOG, MISSION_GAMES, missionByKey, type MissionDef } from "./catalog";
import { checkGoal, isCondition } from "./goals";

const LAB_PROOFS: Record<string, PlacedPart[]> = {
  "lab-finale-every-part": [
    { type: "spring", x: 580, y: 400, rot: 3 },
    { type: "belt", x: 1380, y: 540, rot: 0 },
    { type: "fan", x: 1020, y: 340, rot: 0 },
    { type: "ramp", x: 460, y: 240, rot: 1 },
    { type: "ramp", x: 740, y: 300, rot: 6 },
  ],
  "lab-finale-two-parts": SOLUTIONS.finale,
  "lab-pixel-two-ramps": [...SOLUTIONS.pixel, { type: "ramp", x: 740, y: 520, rot: 4 }],
  "lab-pixel-fast": [{ type: "ramp", x: 720, y: 560, rot: 4 }],
  "lab-juice-fast": [{ type: "fan", x: 220, y: 580, rot: 0 }],
  "lab-juice-fan-and-ramp": [...SOLUTIONS.juice, { type: "ramp", x: 280, y: 560, rot: 6 }],
  "lab-remote-three-parts": [...SOLUTIONS.remote, { type: "ramp", x: 1260, y: 480, rot: 1 }],
};

function labClaim(level: string, parts: PlacedPart[]): RunClaim {
  const def = LEVELS.find((l) => l.id === level)!;
  const total = Object.values(def.inventory).reduce((a, b) => a + (b ?? 0), 0);
  return {
    won: true,
    score: 1000 + (total - parts.length) * 150,
    stars: parts.length <= def.par ? 3 : parts.length === def.par + 1 ? 2 : 1,
    stats: { parts: parts.length, inventory: total, par: def.par, runs: 2, steps: simulateLab(def, parts).steps },
    replay: { kind: "lab-placements", version: 1, parts },
  };
}

function lunch(overrides: Record<string, number> = {}): RunClaim {
  const s = { hits: 30, hitPoints: 4800, interrupts: 2, interruptPoints: 200, comboPoints: 900, lives: 1, hitsTaken: 2, lunchLadyHits: 1, bestStreak: 6, throws: 44, timeMs: 75_000, ...overrides };
  const won = s.lives > 0;
  const score = Math.max(0, s.hitPoints + s.interruptPoints + s.comboPoints + (won ? s.lives * 300 : 0) + (won && s.hitsTaken === 0 ? 500 : 0) - s.lunchLadyHits * 200);
  return { won, score, stars: won ? (score >= 11500 ? 3 : score >= 7500 ? 2 : 1) : 0, stats: s };
}

const LUNCH_PROOFS: Record<string, RunClaim> = {
  "food-streak-eight": lunch({ bestStreak: 8, comboPoints: 1200 }),
  "food-spotless": lunch({ lives: 3, hitsTaken: 0 }),
  "food-two-stars": lunch({ hits: 40, hitPoints: 6400, comboPoints: 1400, throws: 52 }),
  "food-lunch-lady": lunch({ lunchLadyHits: 0 }),
  "food-right-on-time": lunch({ interrupts: 5, interruptPoints: 500 }),
};

function evidenceOf(mission: MissionDef, claim: RunClaim) {
  const verdict = judgeRun(mission.game, mission.level, claim);
  if (!verdict.ok) throw new Error(`${mission.key}: ${verdict.reason} (${verdict.detail})`);
  return verdict.evidence;
}

function proofOf(mission: MissionDef) {
  if (mission.game === "bad-ideas-lab") return labClaim(mission.level!, LAB_PROOFS[mission.key]);
  return LUNCH_PROOFS[mission.key];
}

describe("mission catalog", () => {
  it("uses unique keys, real levels and well-formed goals", () => {
    expect(new Set(CATALOG.map((m) => m.key)).size).toBe(CATALOG.length);
    for (const mission of CATALOG) {
      expect(mission.key).toMatch(/^[a-z0-9-]{3,48}$/);
      expect(MISSION_GAMES).toContain(mission.game);
      expect(hasLevel(mission.game, mission.level), mission.key).toBe(true);
      expect(mission.goal.length).toBeGreaterThan(0);
      expect(mission.goal.every(isCondition), mission.key).toBe(true);
      expect(mission.version).toBeGreaterThanOrEqual(1);
      expect(mission.title.length).toBeLessThanOrEqual(32);
      expect(mission.objective.length).toBeLessThanOrEqual(140);
    }
  });

  it("never asks for the practice level", () => {
    expect(CATALOG.some((m) => m.game === "bad-ideas-lab" && m.level === "test")).toBe(false);
  });

  it("can be completed: every mission has a run that the server accepts and that meets the goal", () => {
    for (const mission of CATALOG) {
      const claim = proofOf(mission);
      expect(claim, `proof for ${mission.key}`).toBeDefined();
      expect(checkGoal(mission.goal, evidenceOf(mission, claim)), mission.key).toEqual({ passed: true });
    }
  });

  it("asks for something more than just finishing", () => {
    for (const mission of CATALOG) {
      const plain = mission.game === "bad-ideas-lab" ? labClaim(mission.level!, SOLUTIONS[mission.level!]) : lunch();
      if (mission.key === "lab-finale-two-parts") continue;
      expect(checkGoal(mission.goal, evidenceOf(mission, plain)).passed, mission.key).toBe(false);
    }
  });

  it("only uses stats the game's evidence provides", () => {
    for (const mission of CATALOG) {
      const evidence = evidenceOf(mission, proofOf(mission));
      for (const condition of mission.goal) expect(evidence[condition.stat], `${mission.key}.${condition.stat}`).toEqual(expect.any(Number));
    }
  });

  it("finds missions by key", () => {
    expect(missionByKey("lab-pixel-fast")?.level).toBe("pixel");
    expect(missionByKey("nope")).toBeNull();
  });
});
