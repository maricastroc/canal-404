import { describe, expect, it } from "vitest";
import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { attemptBonus, LEVELS } from "@/games/bad-ideas-lab/levels";
import { SOLUTIONS } from "@/games/bad-ideas-lab/solutions";
import { LEVELS as RECESS_LEVELS } from "@/games/operation-recess/levels";
import { recessStars } from "@/games/operation-recess/score";
import { KIDS } from "@/games/pajama-war/config";
import { simulateLab } from "@/games/bad-ideas-lab/sim";
import { replayStreet, type Launch } from "@/games/dead-end-street/sim";
import { THREE_STAR_WIN } from "@/games/dead-end-street/solutions";
import { hasLevel, judgeRun, type RunClaim } from "@/lib/competition/rules";
import { CATALOG, MISSION_GAMES, type MissionDef } from "./catalog";
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
    score: 1000 + (total - parts.length) * 150 + attemptBonus(2),
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

function streetClaim(launches: Launch[]): RunClaim {
  const replay = replayStreet(launches);
  if (!replay.ok) throw new Error(replay.problem);
  const { won, score, stars, stats } = replay.tally;
  return { won, score, stars, stats: { ...stats, timeMs: 30_000 }, replay: { kind: "street-launches", version: 1, launches } };
}

const STREET_PROOFS: Record<string, Launch[]> = {
  "street-five-launches": THREE_STAR_WIN,
  "street-two-at-once": THREE_STAR_WIN,
  "street-three-stars": THREE_STAR_WIN,
  "street-yard-chaos": THREE_STAR_WIN,
};

function recess(level: string, stats: Record<string, number>, won = true): RunClaim {
  const s = { kills: 0, killPoints: 0, stickers: 0, extras: 0, hits: 0, hearts: 5, resumed: 0, boss: 0, timeMs: 120_000, ...stats };
  const score = s.killPoints + s.stickers * 50 + s.extras * 10 + (won ? 500 + (s.resumed ? 0 : s.hearts * 100) + (s.boss ? 1500 : 0) : 0);
  return { won, score, stars: recessStars({ won, hits: s.hits, kills: s.kills, monitors: RECESS_LEVELS.find((l) => l.id === level)!.enemies.length }), stats: s };
}

const RECESS_PROOFS: Record<string, RunClaim> = {
  "recess-corridor-spotless": { won: true, score: 1600, stars: 3, stats: { kills: 6, killPoints: 600, stickers: 0, extras: 0, hits: 0, hearts: 5, resumed: 0, boss: 0, timeMs: 15_000 } },
  "recess-yard-stickers": recess("yard", { kills: 6, killPoints: 750, stickers: 4, extras: 2, hits: 2, hearts: 4, timeMs: 34_000 }),
  "recess-yard-monitors": { won: true, score: 2060, stars: 3, stats: { kills: 9, killPoints: 1150, stickers: 0, extras: 1, hits: 3, hearts: 4, resumed: 0, boss: 0, timeMs: 20_500 } },
  "recess-office-boss": recess("office", { kills: 6, killPoints: 800, stickers: 1, hits: 3, hearts: 3, boss: 1, timeMs: 150_000 }),
};

function pajama(won: boolean, score: number, stars: number, stats: Record<string, number>): RunClaim {
  return { won, score, stars, stats };
}

const PAJAMA_PROOFS: Record<string, RunClaim> = {
  "pajama-bedroom-few-pillows": pajama(true, 5300, 3, { hits: 33, kos: 2, throws: 132, hp: 10, damageTaken: 4, place: 1, timeMs: 81_900, kid: 1 }),
  "pajama-living-double-ko": pajama(true, 4650, 1, { hits: 31, kos: 2, throws: 123, hp: 1, damageTaken: 15, place: 1, timeMs: 96_633, kid: 2 }),
  "pajama-living-full-energy": pajama(true, 4300, 3, { hits: 27, kos: 1, throws: 101, hp: 7, damageTaken: 8, place: 1, timeMs: 90_967, kid: 0 }),
  "pajama-yard-lia": pajama(true, 4350, 2, { hits: 26, kos: 2, throws: 84, hp: 5, damageTaken: 10, place: 1, timeMs: 76_167, kid: 0 }),
};

function evidenceOf(mission: MissionDef, claim: RunClaim) {
  const verdict = judgeRun(mission.game, mission.level, claim);
  if (!verdict.ok) throw new Error(`${mission.key}: ${verdict.reason} (${verdict.detail})`);
  return verdict.evidence;
}

function proofOf(mission: MissionDef) {
  if (mission.game === "bad-ideas-lab") return labClaim(mission.level!, LAB_PROOFS[mission.key]);
  if (mission.game === "dead-end-street") return streetClaim(STREET_PROOFS[mission.key]);
  if (mission.game === "operation-recess") return RECESS_PROOFS[mission.key];
  if (mission.game === "pajama-war") return PAJAMA_PROOFS[mission.key];
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

  it("can be completed: every mission has a run that the server accepts and that meets the goal", () => {
    for (const mission of CATALOG) {
      const claim = proofOf(mission);
      expect(claim, `proof for ${mission.key}`).toBeDefined();
      expect(checkGoal(mission.goal, evidenceOf(mission, claim)), mission.key).toEqual({ passed: true });
    }
  });

  it("only uses stats the game's evidence provides", () => {
    for (const mission of CATALOG) {
      const evidence = evidenceOf(mission, proofOf(mission));
      for (const condition of mission.goal) expect(evidence[condition.stat], `${mission.key}.${condition.stat}`).toEqual(expect.any(Number));
    }
  });

  it("never counts a Recreio run that came back from a bell", () => {
    for (const mission of CATALOG.filter((m) => m.game === "operation-recess")) {
      const proof = proofOf(mission);
      const resumed = { ...proof, score: proof.score - (proof.stats.hearts as number) * 100, stats: { ...proof.stats, resumed: 1 } };
      expect(checkGoal(mission.goal, evidenceOf(mission, resumed)), mission.key).toMatchObject({ passed: false, condition: { stat: "resumed" } });
    }
  });

  it("only forces a kid that exists, and checks on the server that the run used it", () => {
    for (const mission of CATALOG.filter((m) => m.setup?.character)) {
      expect(mission.game, mission.key).toBe("pajama-war");
      const index = KIDS.indexOf(mission.setup!.character as (typeof KIDS)[number]);
      expect(index, mission.key).toBeGreaterThanOrEqual(0);
      expect(mission.goal, mission.key).toEqual(expect.arrayContaining([{ stat: "kid", op: "min", value: index }, { stat: "kid", op: "max", value: index }]));
      const other = { ...proofOf(mission), stats: { ...proofOf(mission).stats, kid: (index + 1) % KIDS.length } };
      expect(checkGoal(mission.goal, evidenceOf(mission, other)), mission.key).toMatchObject({ passed: false, condition: { stat: "kid" } });
    }
    for (const mission of CATALOG.filter((m) => m.goal.some((c) => c.stat === "kid"))) expect(mission.setup?.character, mission.key).toBeDefined();
  });
});
