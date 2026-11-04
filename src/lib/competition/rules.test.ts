import { describe, expect, it } from "vitest";
import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { SOLUTIONS, STEPS_BEFORE_EXTRACTION } from "@/games/bad-ideas-lab/solutions";
import { BOARD_META, boardId, hasLevel, judgeRun, metricValues, type RankKey, type RunClaim } from "./rules";

function compare(a: RankKey, b: RankKey) {
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return b[i] - a[i];
  return 0;
}

function ok(verdict: ReturnType<typeof judgeRun>) {
  if (!verdict.ok) throw new Error(`${verdict.reason}: ${verdict.detail}`);
  return verdict;
}

function street(overrides: Partial<Record<string, number>> = {}, claim: Partial<RunClaim> = {}): RunClaim {
  const stats = { targets: 5, targetPoints: 900, waves: 3, mess: 4, combos: 1, launches: 5, ammoLeft: 2, timeMs: 70_000, ...overrides } as Record<string, number>;
  const won = stats.waves === 3;
  const score = stats.targetPoints + stats.combos * 100 + stats.waves * 100 + stats.mess * 25 + (won ? stats.ammoLeft * 250 : 0);
  return { won, score, stars: won ? (score >= 2050 ? 3 : score >= 1500 ? 2 : 1) : 0, stats, ...claim };
}

function lab(level: string, parts: { type: string; x: number; y: number; rot: number }[], steps: number, runs = 2): RunClaim {
  const inventory: Record<string, number> = { test: 1, pixel: 2, toast: 2, juice: 2, remote: 3, finale: 5 };
  const par: Record<string, number> = { test: 1, pixel: 1, toast: 1, juice: 1, remote: 2, finale: 3 };
  const score = 1000 + (inventory[level] - parts.length) * 150 + (runs === 1 ? 300 : 0);
  return {
    won: true,
    score,
    stars: parts.length <= par[level] ? 3 : parts.length === par[level] + 1 ? 2 : 1,
    stats: { parts: parts.length, inventory: inventory[level], par: par[level], runs, steps },
    replay: { kind: "lab-placements", version: 1, parts },
  };
}

function lunch(overrides: Partial<Record<string, number>> = {}): RunClaim {
  const s = {
    hits: 30,
    hitPoints: 4800,
    interrupts: 5,
    interruptPoints: 500,
    comboPoints: 1200,
    lives: 2,
    hitsTaken: 1,
    lunchLadyHits: 0,
    bestStreak: 9,
    throws: 44,
    timeMs: 75_000,
    ...overrides,
  } as Record<string, number>;
  const won = s.lives > 0;
  const score = Math.max(0, s.hitPoints + s.interruptPoints + s.comboPoints + (won ? s.lives * 300 : 0) + (won && s.hitsTaken === 0 ? 500 : 0) - s.lunchLadyHits * 200);
  return { won, score, stars: won ? (score >= 11500 ? 3 : score >= 7500 ? 2 : 1) : 0, stats: s };
}

function recess(level: string, overrides: Partial<Record<string, number>> = {}, won = true): RunClaim {
  const s = { kills: 3, killPoints: 300, stickers: 2, extras: 4, hits: 1, hearts: 4, resumed: 0, boss: 0, timeMs: 95_000, ...overrides } as Record<string, number>;
  const score = s.killPoints + s.stickers * 50 + s.extras * 10 + (won ? 500 + (s.resumed ? 0 : s.hearts * 100) + (s.boss ? 1500 : 0) : 0);
  return { won, score, stars: won ? (s.hits <= 1 ? 3 : s.hits <= 3 ? 2 : 1) : 0, stats: s };
}

function pajama(overrides: Partial<Record<string, number>> = {}): RunClaim {
  const s = { hits: 14, kos: 1, throws: 30, hp: 8, damageTaken: 2, place: 1, timeMs: 52_000, kid: 1, ...overrides } as Record<string, number>;
  const won = s.place === 1;
  const score = s.hits * 100 + s.kos * 250 + (won ? 1000 + s.hp * 50 : s.place === 2 ? 300 : 0);
  return { won, score, stars: won ? (s.hp >= 7 ? 3 : s.hp >= 4 ? 2 : 1) : 0, stats: s };
}

function resort(overrides: Partial<Record<string, number>> = {}): RunClaim {
  const s = { posters: 4, tokens: 3, secrets: 2, discoveries: 11, met: 10, ending: 1, timeMs: 1_900_000, ...overrides } as Record<string, number>;
  const score = 1000 + s.posters * 100 + s.tokens * 50 + s.secrets * 250;
  return { won: true, score, stars: 1 + (s.posters >= 3 ? 1 : 0) + (s.secrets >= 2 ? 1 : 0), stats: s };
}

describe("boards", () => {
  it("names one board per game or per level, with the rules version", () => {
    expect(boardId("dead-end-street", null)).toBe("dead-end-street/all/v1");
    expect(boardId("bad-ideas-lab", "pixel")).toBe("bad-ideas-lab/pixel/v1");
  });

  it("knows which games have levels", () => {
    expect(hasLevel("dead-end-street", null)).toBe(true);
    expect(hasLevel("dead-end-street", "x")).toBe(false);
    expect(hasLevel("bad-ideas-lab", null)).toBe(false);
    expect(hasLevel("pajama-war", "yard")).toBe(true);
    expect(hasLevel("operation-recess", "office")).toBe(true);
  });

  it("explains every board in one line and labels each metric", () => {
    for (const meta of Object.values(BOARD_META)) {
      expect(meta.explain.length).toBeGreaterThan(10);
      expect(meta.metrics.length).toBeGreaterThan(0);
    }
  });
});

describe("Rua Sem Saída", () => {
  it("recomputes the score and ranks by score, then fewer launches", () => {
    const v = ok(judgeRun("dead-end-street", null, street()));
    expect(v.score).toBe(900 + 100 + 300 + 100 + 500);
    expect(v.rank).toEqual([1900, -5, 0]);
    expect(metricValues("dead-end-street", v.rank)).toEqual([1900, 5]);
  });

  it("breaks score ties with fewer launches", () => {
    const sameA = ok(judgeRun("dead-end-street", null, street({ launches: 4, ammoLeft: 3, combos: 0, mess: 2 })));
    const sameB = ok(judgeRun("dead-end-street", null, street({ launches: 5, ammoLeft: 2, combos: 2, mess: 4 })));
    expect(sameA.score).toBe(sameB.score);
    expect(compare(sameA.rank, sameB.rank)).toBeLessThan(0);
  });

  it("accepts a lost match and ranks it below any win with more points", () => {
    const lost = ok(judgeRun("dead-end-street", null, street({ targets: 3, targetPoints: 550, waves: 1, combos: 0, launches: 7, ammoLeft: 0 })));
    expect(lost.won).toBe(false);
    expect(lost.stars).toBe(0);
    expect(lost.eligible).toBe(true);
  });

  it("rejects a tampered score, impossible target sums and ammo that does not add up", () => {
    expect(judgeRun("dead-end-street", null, street({}, { score: 9999 }))).toMatchObject({ ok: false, reason: "score_mismatch" });
    expect(judgeRun("dead-end-street", null, street({ targets: 3, targetPoints: 500, waves: 1, combos: 0, launches: 7, ammoLeft: 0 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("dead-end-street", null, street({ launches: 5, ammoLeft: 4 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("dead-end-street", null, street({ timeMs: 1000 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("dead-end-street", null, street({ targets: 9 }))).toMatchObject({ ok: false, reason: "bad_stats" });
  });

  it("needs the time of the match as the minimum time since the ticket", () => {
    expect(ok(judgeRun("dead-end-street", null, street())).minElapsedMs).toBe(70_000);
  });
});

describe("Laboratório", () => {
  const TWO_RAMPS: PlacedPart[] = [...SOLUTIONS.pixel, { type: "ramp", x: 660, y: 320, rot: 3 }];
  const QUICKER: PlacedPart[] = [{ type: "ramp", x: 680, y: 480, rot: 4 }];

  it("replays the known solution of every level on the server", () => {
    for (const [level, parts] of Object.entries(SOLUTIONS)) {
      const verdict = ok(judgeRun("bad-ideas-lab", level, lab(level, parts, STEPS_BEFORE_EXTRACTION[level])));
      expect(verdict).toMatchObject({ verification: "replayed", flags: [] });
      expect(verdict.rank[1]).toBe(-STEPS_BEFORE_EXTRACTION[level]);
    }
  });

  it("ranks fewer parts first, then the machine that reaches the goal in fewer steps", () => {
    const one = ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", SOLUTIONS.pixel, 256)));
    const two = ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", TWO_RAMPS, 256)));
    const faster = ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", QUICKER, 248)));
    expect(compare(one.rank, two.rank)).toBeLessThan(0);
    expect(compare(faster.rank, one.rank)).toBeLessThan(0);
    expect(metricValues("bad-ideas-lab", one.rank)).toEqual([1, 256]);
  });

  it("ranks by the steps the server counted, not the steps the browser sent", () => {
    const claimed = ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", SOLUTIONS.pixel, 1)));
    expect(metricValues("bad-ideas-lab", claimed.rank)).toEqual([1, 256]);
    expect(claimed.flags).toEqual(["steps_mismatch"]);
    expect(claimed.minElapsedMs).toBe(Math.round(256 * (1000 / 60)));
  });

  it("rejects a machine that can be built but does not reach the goal", () => {
    expect(judgeRun("bad-ideas-lab", "pixel", lab("pixel", [{ type: "ramp", x: 620, y: 420, rot: 0 }], 300))).toMatchObject({ ok: false, reason: "replay_failed" });
  });

  it("leaves the first-try bonus out of the ranking", () => {
    const first = ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", SOLUTIONS.pixel, 400, 1)));
    const later = ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", SOLUTIONS.pixel, 400, 7)));
    expect(first.score).toBe(later.score + 300);
    expect(first.rank).toEqual(later.rank);
  });

  it("keeps the practice level off the board", () => {
    expect(ok(judgeRun("bad-ideas-lab", "test", lab("test", SOLUTIONS.test, 200)))).toMatchObject({ eligible: false, ineligible: "practice" });
  });

  it("rejects machines that could not be built in the level", () => {
    const outside = lab("pixel", [{ type: "ramp", x: 40, y: 40, rot: 4 }], 300);
    expect(judgeRun("bad-ideas-lab", "pixel", outside)).toMatchObject({ ok: false, reason: "bad_replay" });
    const offGrid = lab("pixel", [{ type: "ramp", x: 621, y: 420, rot: 4 }], 300);
    expect(judgeRun("bad-ideas-lab", "pixel", offGrid)).toMatchObject({ ok: false, reason: "bad_replay" });
    const notInStock = lab("pixel", [{ type: "fan", x: 620, y: 420, rot: 0 }], 300);
    expect(judgeRun("bad-ideas-lab", "pixel", notInStock)).toMatchObject({ ok: false, reason: "bad_replay" });
    const stacked = lab("pixel", [SOLUTIONS.pixel[0], SOLUTIONS.pixel[0]], 300);
    expect(judgeRun("bad-ideas-lab", "pixel", stacked)).toMatchObject({ ok: false, reason: "bad_replay" });
    const missing = { ...lab("pixel", SOLUTIONS.pixel, 300), replay: undefined };
    expect(judgeRun("bad-ideas-lab", "pixel", missing)).toMatchObject({ ok: false, reason: "bad_replay" });
  });

  it("rejects runs longer than the machine timeout and unknown levels", () => {
    expect(judgeRun("bad-ideas-lab", "pixel", lab("pixel", SOLUTIONS.pixel, 900))).toMatchObject({ ok: false, reason: "bad_stats" });
    expect(judgeRun("bad-ideas-lab", "attic", lab("pixel", SOLUTIONS.pixel, 300))).toMatchObject({ ok: false, reason: "unknown_level" });
  });

  it("needs the replayed time as the minimum time since the ticket", () => {
    expect(ok(judgeRun("bad-ideas-lab", "juice", lab("juice", SOLUTIONS.juice, 112))).minElapsedMs).toBe(Math.round(112 * (1000 / 60)));
  });
});

describe("Guerra de Lanche", () => {
  it("recomputes the score and breaks ties by puddings taken, then the streak", () => {
    const v = ok(judgeRun("food-fight", null, lunch()));
    expect(v.score).toBe(4800 + 500 + 1200 + 600);
    const clean = ok(judgeRun("food-fight", null, lunch({ hitsTaken: 0, lives: 3, hitPoints: 3800 })));
    const messy = ok(judgeRun("food-fight", null, lunch({ hitsTaken: 1, lives: 2, hitPoints: 4600 })));
    expect(clean.score).toBe(messy.score);
    expect(compare(clean.rank, messy.rank)).toBeLessThan(0);
    const streak = ok(judgeRun("food-fight", null, lunch({ bestStreak: 12 })));
    expect(compare(streak.rank, v.rank)).toBeLessThan(0);
  });

  it("subtracts the lunch lady and never goes below zero", () => {
    const v = ok(judgeRun("food-fight", null, lunch({ hits: 1, hitPoints: 100, interrupts: 0, interruptPoints: 0, comboPoints: 0, lives: 0, hitsTaken: 3, lunchLadyHits: 3, bestStreak: 1, throws: 5, timeMs: 30_000 })));
    expect(v.score).toBe(0);
    expect(v).toMatchObject({ eligible: false, ineligible: "no_points" });
  });

  it("rejects a round that ends before the bell and impossible numbers", () => {
    expect(judgeRun("food-fight", null, lunch({ timeMs: 40_000 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ throws: 10 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ hitPoints: 60_000 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ interruptPoints: 900 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ lives: 3, hitsTaken: 0, comboPoints: 30 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("counts the big rival's first hit even without a knockout", () => {
    ok(judgeRun("food-fight", null, lunch({ hits: 0, hitPoints: 50, interrupts: 0, interruptPoints: 0, comboPoints: 0, bestStreak: 0, throws: 3, lives: 0, hitsTaken: 3, timeMs: 20_000 })));
  });
});

describe("Operação: Recreio", () => {
  it("ranks fewer hits first, then the fastest clear", () => {
    const clean = ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 0, timeMs: 120_000 })));
    const quick = ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 2, timeMs: 60_000 })));
    const quicker = ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 0, timeMs: 90_000 })));
    expect(compare(clean.rank, quick.rank)).toBeLessThan(0);
    expect(compare(quicker.rank, clean.rank)).toBeLessThan(0);
    expect(metricValues("operation-recess", clean.rank).slice(0, 2)).toEqual([0, 120_000]);
  });

  it("keeps resumed and lost runs off the board", () => {
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { resumed: 1 })))).toMatchObject({ eligible: false, ineligible: "resumed" });
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { hearts: 0 }, false)))).toMatchObject({ eligible: false, ineligible: "not_won" });
  });

  it("checks the boss flag, kill points and the shortest possible run", () => {
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { boss: 1 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    ok(judgeRun("operation-recess", "office", recess("office", { boss: 1 })));
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { killPoints: 310 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { timeMs: 3000 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });
});

describe("Guerra do Pijama", () => {
  it("ranks more energy first, then the fastest win", () => {
    const strong = ok(judgeRun("pajama-war", "living", pajama({ hp: 9, timeMs: 80_000 })));
    const fast = ok(judgeRun("pajama-war", "living", pajama({ hp: 8, timeMs: 40_000 })));
    const faster = ok(judgeRun("pajama-war", "living", pajama({ hp: 9, timeMs: 60_000 })));
    expect(compare(strong.rank, fast.rank)).toBeLessThan(0);
    expect(compare(faster.rank, strong.rank)).toBeLessThan(0);
  });

  it("only ranks wins and checks the throw rhythm of the chosen kid", () => {
    expect(ok(judgeRun("pajama-war", "bedroom", pajama({ place: 2, hp: 0 })))).toMatchObject({ eligible: false, ineligible: "not_won" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ place: 2, hp: 3 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ throws: 200, timeMs: 30_000, kid: 0 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ hits: 40, throws: 30 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });
});

describe("Férias Fora do Ar", () => {
  it("ranks discoveries, then the shortest playtime", () => {
    const curious = ok(judgeRun("off-air-vacation", null, resort({ secrets: 3, timeMs: 3_000_000 })));
    const quick = ok(judgeRun("off-air-vacation", null, resort({ secrets: 2, timeMs: 900_000 })));
    expect(compare(curious.rank, quick.rank)).toBeLessThan(0);
    expect(curious.minElapsedMs).toBe(0);
  });

  it("rejects an adventure finished in under a minute", () => {
    expect(judgeRun("off-air-vacation", null, resort({ timeMs: 20_000 }))).toMatchObject({ ok: false, reason: "bad_stats" });
  });
});
