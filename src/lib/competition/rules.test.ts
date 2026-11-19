import { describe, expect, it } from "vitest";
import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { SOLUTIONS, STEPS_BEFORE_EXTRACTION } from "@/games/bad-ideas-lab/solutions";
import { LEVELS as RECESS_LEVELS } from "@/games/operation-recess/levels";
import { recessStars } from "@/games/operation-recess/score";
import { STEP_MS } from "@/games/dead-end-street/config";
import { THREE_STAR_WIN } from "@/games/dead-end-street/solutions";
import { replayStreet, type Launch } from "@/games/dead-end-street/sim";
import { boardId, judgeRun, metricValues, type RankKey, type RunClaim } from "./rules";

const RECESS_MONITORS = Object.fromEntries(RECESS_LEVELS.map((l) => [l.id, l.enemies.length]));

function compare(a: RankKey, b: RankKey) {
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return b[i] - a[i];
  return 0;
}

function ok(verdict: ReturnType<typeof judgeRun>) {
  if (!verdict.ok) throw new Error(`${verdict.reason}: ${verdict.detail}`);
  return verdict;
}

function street(launches: Launch[] = THREE_STAR_WIN, claim: Partial<RunClaim> = {}): RunClaim {
  const replay = replayStreet(launches);
  if (!replay.ok) throw new Error(replay.problem);
  const { won, score, stars, stats } = replay.tally;
  return { won, score, stars, stats: { ...stats, timeMs: 30_000 }, replay: { kind: "street-launches", version: 1, launches }, ...claim };
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
  const hits = overrides.hits ?? 1;
  const s = { kills: 3, killPoints: 300, stickers: 2, extras: 0, hits, hearts: won ? Math.max(1, 5 - hits) : 0, resumed: 0, boss: 0, timeMs: 95_000, ...overrides } as Record<string, number>;
  const score = s.killPoints + s.stickers * 50 + s.extras * 10 + (won ? 500 + (s.resumed ? 0 : s.hearts * 100) + (s.boss ? 1500 : 0) : 0);
  return { won, score, stars: recessStars({ won, hits: s.hits, kills: s.kills, monitors: RECESS_MONITORS[level] }), stats: s };
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
    expect(boardId("dead-end-street", null)).toBe("dead-end-street/all/v2");
    expect(boardId("bad-ideas-lab", "pixel")).toBe("bad-ideas-lab/pixel/v1");
  });
});

describe("Rua Sem Saída", () => {
  it("replays the launches and ranks by the replayed score, then fewer launches", () => {
    const v = ok(judgeRun("dead-end-street", null, street()));
    expect(v).toMatchObject({ won: true, score: 2250, stars: 3, verification: "replayed", flags: [] });
    expect(v.rank).toEqual([2250, -4, 0]);
    expect(metricValues("dead-end-street", v.rank)).toEqual([2250, 4]);
    expect(v.evidence).toEqual({ launches: 4, combos: 1, mess: 8, won: 1, score: 2250 });
  });

  it("rejects a score the launches did not make and flags stats that do not match", () => {
    expect(judgeRun("dead-end-street", null, street(THREE_STAR_WIN, { score: 9999 }))).toMatchObject({ ok: false, reason: "score_mismatch" });
    const tampered = street();
    expect(ok(judgeRun("dead-end-street", null, { ...tampered, stats: { ...tampered.stats, mess: 10 } })).flags).toEqual(["stats_mismatch"]);
  });

  it("rejects missing, malformed and impossible launch logs", () => {
    const claim = street();
    const withLaunches = (launches: Launch[]) => ({ ...claim, replay: { kind: "street-launches" as const, version: 1 as const, launches } });
    expect(judgeRun("dead-end-street", null, { ...claim, replay: undefined })).toMatchObject({ ok: false, reason: "bad_launches" });
    expect(judgeRun("dead-end-street", null, withLaunches([{ at: 0, angle: 9000, power: 1000 }]))).toMatchObject({ ok: false, reason: "bad_launches" });
    expect(judgeRun("dead-end-street", null, withLaunches([...THREE_STAR_WIN, ...THREE_STAR_WIN]))).toMatchObject({ ok: false, reason: "bad_launches" });
    expect(judgeRun("dead-end-street", null, withLaunches([THREE_STAR_WIN[0], { ...THREE_STAR_WIN[1], at: 20 }]))).toMatchObject({ ok: false, reason: "launches_failed" });
    expect(judgeRun("dead-end-street", null, withLaunches(THREE_STAR_WIN.slice(0, 2)))).toMatchObject({ ok: false, reason: "launches_failed" });
  });

  it("needs the replayed match time as the minimum time since the ticket", () => {
    const replay = replayStreet(THREE_STAR_WIN);
    if (!replay.ok) throw new Error(replay.problem);
    expect(ok(judgeRun("dead-end-street", null, street())).minElapsedMs).toBe(Math.round(replay.steps * STEP_MS));
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

  it("hands the server's steps and the parts the ball never touched as mission evidence", () => {
    const idle = ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", TWO_RAMPS, 1)));
    expect(idle.evidence).toEqual({ won: 1, score: idle.score, parts: 2, steps: 256, untouched: 1 });
    const both: PlacedPart[] = [...SOLUTIONS.pixel, { type: "ramp", x: 740, y: 520, rot: 4 }];
    expect(ok(judgeRun("bad-ideas-lab", "pixel", lab("pixel", both, 237))).evidence).toMatchObject({ parts: 2, steps: 237, untouched: 0 });
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
    const streak = ok(judgeRun("food-fight", null, lunch({ bestStreak: 10 })));
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

  it("refuses a best streak that its combo points could not pay for", () => {
    expect(judgeRun("food-fight", null, lunch({ bestStreak: 12 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(ok(judgeRun("food-fight", null, lunch({ bestStreak: 11 }))).evidence).toMatchObject({ bestStreak: 11 });
  });

  it("hands the mission evidence from the checked stats", () => {
    expect(ok(judgeRun("food-fight", null, lunch())).evidence).toEqual({ won: 1, score: 7100, bestStreak: 9, hitsTaken: 1, lunchLadyHits: 0, interrupts: 5 });
  });

  it("accepts a real bot round and rejects what its limits cannot produce", () => {
    const real = { hits: 47, hitPoints: 7450, interrupts: 31, interruptPoints: 3100, comboPoints: 880, lives: 3, hitsTaken: 0, lunchLadyHits: 1, bestStreak: 8, throws: 87, timeMs: 75_030 };
    expect(ok(judgeRun("food-fight", null, lunch(real))).score).toBe(12_630);
    expect(judgeRun("food-fight", null, lunch({ ...real, lives: 2 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ ...real, throws: 400 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ ...real, comboPoints: 3240 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ ...real, hits: 200, hitPoints: 20_000, throws: 300 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("knows what an early loss could not have had yet", () => {
    const lost = { hits: 11, hitPoints: 1100, interrupts: 7, interruptPoints: 700, comboPoints: 0, lives: 0, hitsTaken: 3, lunchLadyHits: 1, bestStreak: 1, throws: 29, timeMs: 23_349 };
    expect(ok(judgeRun("food-fight", null, lunch(lost))).score).toBe(1600);
    expect(judgeRun("food-fight", null, lunch({ ...lost, hitPoints: 1700 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    const early = { hits: 6, hitPoints: 600, interrupts: 2, interruptPoints: 200, comboPoints: 60, lives: 0, hitsTaken: 3, lunchLadyHits: 0, bestStreak: 3, throws: 12, timeMs: 12_000 };
    ok(judgeRun("food-fight", null, lunch(early)));
    expect(judgeRun("food-fight", null, lunch({ ...early, hitPoints: 650 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ ...early, lunchLadyHits: 1, throws: 13 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("food-fight", null, lunch({ ...early, hits: 20, hitPoints: 2000, throws: 30, interrupts: 0, interruptPoints: 0 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("counts the big rival's first hit even without a knockout", () => {
    ok(judgeRun("food-fight", null, lunch({ hits: 0, hitPoints: 50, interrupts: 0, interruptPoints: 0, comboPoints: 0, bestStreak: 0, throws: 3, lives: 0, hitsTaken: 3, timeMs: 40_000 })));
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
    expect(Object.is(metricValues("operation-recess", clean.rank)[0], 0)).toBe(true);
  });

  it("keeps resumed and lost runs off the board", () => {
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { resumed: 1 })))).toMatchObject({ eligible: false, ineligible: "resumed" });
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 5 }, false)))).toMatchObject({ eligible: false, ineligible: "not_won" });
  });

  it("checks hearts against bumps and the level's snacks", () => {
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 0, hearts: 3 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 3, hearts: 3 })));
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 3, hearts: 4 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    ok(judgeRun("operation-recess", "yard", recess("yard", { hits: 3, hearts: 4 })));
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 4 }, false))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 5, hearts: 1 }, false))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("only counts waves where something can blow a whistle, and a monitor twice only after the bell", () => {
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { extras: 3 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    ok(judgeRun("operation-recess", "yard", recess("yard", { extras: 3 })));
    ok(judgeRun("operation-recess", "corridor", recess("corridor", { kills: 7, killPoints: 700, resumed: 1, hearts: 5 })));
    expect(judgeRun("operation-recess", "corridor", recess("corridor", { kills: 7, killPoints: 700 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("reports bumps, the bell and what was left behind as mission evidence", () => {
    const v = ok(judgeRun("operation-recess", "yard", recess("yard", { kills: 9, killPoints: 4 * 100 + 5 * 150, stickers: 4, hits: 0 })));
    expect(v.evidence).toEqual({ bumps: 0, resumed: 0, stickersLeft: 0, monitorsLeft: 0, won: 1, score: v.score });
    const left = ok(judgeRun("operation-recess", "corridor", recess("corridor")));
    expect(left.evidence).toMatchObject({ bumps: 1, stickersLeft: 2, monitorsLeft: 3 });
  });

  it("gives the third star only for knocking out every monitor of the level", () => {
    expect(RECESS_MONITORS).toEqual({ corridor: 6, yard: 9, office: 9 });
    const runner = recess("corridor", { hits: 0, kills: 0, killPoints: 0 });
    expect(ok(judgeRun("operation-recess", "corridor", runner)).stars).toBe(2);
    expect(judgeRun("operation-recess", "corridor", { ...runner, stars: 3 })).toMatchObject({ ok: false, reason: "score_mismatch" });
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 3, hearts: 2, kills: 6, killPoints: 600 }))).stars).toBe(3);
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 0, kills: 5, killPoints: 500 }))).stars).toBe(2);
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 4, hearts: 1, kills: 6, killPoints: 600 }))).stars).toBe(2);
    expect(ok(judgeRun("operation-recess", "corridor", recess("corridor", { hits: 4, hearts: 1 }))).stars).toBe(1);
    expect(ok(judgeRun("operation-recess", "yard", recess("yard", { kills: 9, killPoints: 4 * 100 + 5 * 150, hits: 2, hearts: 3 }))).stars).toBe(3);
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
    expect(ok(judgeRun("pajama-war", "bedroom", pajama({ place: 2, hp: 0, damageTaken: 10 })))).toMatchObject({ eligible: false, ineligible: "not_won" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ place: 2, hp: 3 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ throws: 200, timeMs: 30_000, kid: 0 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ hits: 40, throws: 30 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("checks energy against the pillows taken and knockouts against the final place", () => {
    expect(judgeRun("pajama-war", "bedroom", pajama({ hp: 6, damageTaken: 2 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ hp: 9, damageTaken: 0 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    ok(judgeRun("pajama-war", "bedroom", pajama({ hp: 10, damageTaken: 0 })));
    ok(judgeRun("pajama-war", "bedroom", pajama({ hp: 9, damageTaken: 6 })));
    expect(judgeRun("pajama-war", "bedroom", pajama({ place: 3, hp: 0, damageTaken: 10, kos: 1 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ place: 2, hp: 0, damageTaken: 10, kos: 2, hits: 20 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("needs the time that the pillows, the windup and the safety after each hit take", () => {
    expect(judgeRun("pajama-war", "bedroom", pajama({ place: 2, hp: 0, damageTaken: 30, timeMs: 10_000 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ throws: 5, hits: 5, timeMs: 4_000 }))).toMatchObject({ ok: false, reason: "inconsistent" });
    expect(judgeRun("pajama-war", "bedroom", pajama({ throws: 12, hits: 10, timeMs: 6_000, kid: 1 }))).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("reports pillows taken, knockouts, energy and the kid as mission evidence", () => {
    const v = ok(judgeRun("pajama-war", "living", pajama()));
    expect(v.evidence).toEqual({ damageTaken: 2, kos: 1, hp: 8, kid: 1, won: 1, score: v.score });
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
