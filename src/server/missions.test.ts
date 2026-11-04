import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { beforeEach, describe, expect, it } from "vitest";
import { dayEnd, MISSION_GRACE_MS } from "@/lib/missions/calendar";
import { missionByKey } from "@/lib/missions/catalog";
import { pickMission } from "@/lib/missions/select";
import { ensureChallenge, missionBoard, missionHistory, missionToday, progressFrom } from "./missions";
import { submitRun } from "./runs";
import { hasTestDb, labClaim, lunchClaim, makePlayer, resetDb, scheduleMission, testDb, ticketFor } from "./testing";

const DAY = "2026-11-04";
const NOON = Date.UTC(2026, 10, 4, 15, 0, 0);
const GOLDEN: PlacedPart[] = [{ type: "ramp", x: 620, y: 420, rot: 4 }];
const QUICK: PlacedPart[] = [{ type: "ramp", x: 720, y: 560, rot: 4 }];
const QUICKER: PlacedPart[] = [...GOLDEN, { type: "ramp", x: 740, y: 520, rot: 4 }];

describe("mission progress", () => {
  it("counts days, the current run of days and the best run", () => {
    expect(progressFrom([], DAY)).toEqual({ days: 0, streak: 0, bestStreak: 0, lastDay: null });
    expect(progressFrom(["2026-11-02", "2026-11-03", "2026-11-04"], DAY)).toEqual({ days: 3, streak: 3, bestStreak: 3, lastDay: DAY });
    expect(progressFrom(["2026-11-02", "2026-11-03"], DAY)).toMatchObject({ streak: 2 });
  });

  it("keeps the record but lets the current run rest after a missed day, without taking days away", () => {
    expect(progressFrom(["2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02"], DAY)).toEqual({ days: 4, streak: 0, bestStreak: 3, lastDay: "2026-11-02" });
  });

  it("follows the mission calendar across months", () => {
    expect(progressFrom(["2026-10-31", "2026-11-01"], "2026-11-01")).toMatchObject({ streak: 2, bestStreak: 2 });
  });
});

describe.skipIf(!hasTestDb)("daily missions", () => {
  const db = testDb();

  beforeEach(async () => {
    await resetDb(db);
  });

  async function playLab(player: Awaited<ReturnType<typeof makePlayer>>["player"], parts: PlacedPart[], options: { at?: number; mission?: string | null; submitAfter?: number } = {}) {
    const at = options.at ?? NOON;
    const { ticket } = ticketFor("bad-ideas-lab", "pixel", player.id, at, options.mission === undefined ? DAY : options.mission);
    return submitRun(db, { player, ticket, claim: labClaim("pixel", parts), now: new Date(at + (options.submitAfter ?? 60_000)) });
  }

  it("stores the day's mission the first time it is asked for and never rewrites it", async () => {
    const first = await ensureChallenge(db, DAY);
    expect(first).toMatchObject({ id: DAY, key: pickMission(DAY).key });
    await db.dailyChallenge.update({ where: { id: DAY }, data: { variant: { title: "Regra antiga", objective: "x", goal: [{ stat: "parts", op: "max", value: 9 }], ranked: false } } });
    const again = await ensureChallenge(db, DAY);
    expect(again.variant).toMatchObject({ title: "Regra antiga" });
  });

  it("creates a single row when many requests arrive at midnight", async () => {
    await Promise.all(Array.from({ length: 8 }, () => ensureChallenge(db, DAY)));
    expect(await db.dailyChallenge.count()).toBe(1);
  });

  it("does not repeat yesterday's mission even if the catalog changed", async () => {
    await db.dailyChallenge.create({
      data: { id: "2026-11-03", key: pickMission(DAY).key, game: "bad-ideas-lab", level: "pixel", seed: 1, rulesVersion: 1, variant: { title: "x", objective: "x", goal: [{ stat: "parts", op: "max", value: 1 }], ranked: true } },
    });
    expect((await ensureChallenge(db, DAY)).key).not.toBe(pickMission(DAY).key);
  });

  it("completes the mission only from a server-checked run and ranks it on the day's board", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    const outcome = await playLab(player, QUICK);
    expect(outcome.mission).toMatchObject({ day: DAY, status: "completed", firstTime: true, shortfall: null, improved: true, best: { position: 1, total: 1, metrics: [1, 245] } });
    const entry = await db.challengeEntry.findUniqueOrThrow({ where: { playerId_challengeId: { playerId: player.id, challengeId: DAY } } });
    expect(entry).toMatchObject({ attempts: 1, completedRunId: outcome.run.id });
    expect(await db.run.findUniqueOrThrow({ where: { id: outcome.run.id } })).toMatchObject({ challengeId: DAY, flags: [`mission:${DAY}:completed`] });
    expect(outcome.board).toMatchObject({ id: "bad-ideas-lab/pixel/v1", improved: true });
  });

  it("explains a miss with the number the server measured", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    const outcome = await playLab(player, GOLDEN);
    expect(outcome.mission).toMatchObject({ status: "missed", firstTime: false, best: null, shortfall: { condition: { stat: "steps", op: "max", value: 252 }, actual: 256 } });
    const entry = await db.challengeEntry.findUniqueOrThrow({ where: { playerId_challengeId: { playerId: player.id, challengeId: DAY } } });
    expect(entry).toMatchObject({ attempts: 1, completedAt: null });
    expect(await db.personalBest.count({ where: { board: missionBoard(DAY) } })).toBe(0);
  });

  it("returns the same mission outcome when a result is sent twice, without counting it again", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("bad-ideas-lab", "pixel", player.id, NOON, DAY);
    const first = await submitRun(db, { player, ticket, claim: labClaim("pixel", QUICK), now: new Date(NOON + 60_000) });
    const again = await submitRun(db, { player, ticket, claim: labClaim("pixel", QUICK), now: new Date(NOON + 90_000) });
    expect(again.repeated).toBe(true);
    expect(again.mission).toMatchObject({ status: "completed", firstTime: true, best: first.mission!.best });
    expect(await db.challengeEntry.findFirstOrThrow()).toMatchObject({ attempts: 1 });
    expect(await db.run.count()).toBe(1);
  });

  it("keeps the first completion and the best result of the day", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    const first = await playLab(player, QUICK);
    const second = await playLab(player, QUICKER, { at: NOON + 120_000 });
    expect(second.mission).toMatchObject({ status: "completed", firstTime: false, improved: false, best: { metrics: [1, 245] } });
    const entry = await db.challengeEntry.findFirstOrThrow();
    expect(entry).toMatchObject({ attempts: 2, completedRunId: first.run.id });
  });

  it("grants the completion once when results arrive at the same time", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    const outcomes = await Promise.all(Array.from({ length: 6 }, (_, i) => playLab(player, QUICK, { at: NOON + i })));
    expect(outcomes.filter((o) => o.mission?.firstTime)).toHaveLength(1);
    const entry = await db.challengeEntry.findFirstOrThrow();
    expect(entry.attempts).toBe(6);
    expect(await db.personalBest.count({ where: { board: missionBoard(DAY) } })).toBe(1);
  });

  it("does not count runs played without the mission ticket, even on the mission level", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    const outcome = await playLab(player, QUICK, { mission: null });
    expect(outcome.mission).toBeNull();
    expect(await db.challengeEntry.count()).toBe(0);
  });

  it("ignores a mission ticket for another level", async () => {
    await scheduleMission(db, DAY, "lab-finale-two-parts");
    const { player } = await makePlayer(db);
    expect((await playLab(player, QUICK)).mission).toBeNull();
  });

  it("counts a run that started before midnight until the grace hour ends, then only for the normal board", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    const lastMinute = dayEnd(DAY).getTime() - 60_000;
    const inTime = await playLab(player, QUICK, { at: lastMinute, submitAfter: 30 * 60_000 });
    expect(inTime.mission).toMatchObject({ status: "completed", day: DAY });
    const { player: slow } = await makePlayer(db, "Tartaruga");
    const late = await playLab(slow, QUICK, { at: lastMinute, submitAfter: 60_000 + MISSION_GRACE_MS + 1000 });
    expect(late.mission).toMatchObject({ status: "late", firstTime: false, best: null });
    expect(late.board).toMatchObject({ improved: true });
    expect(await db.challengeEntry.count({ where: { playerId: slow.id } })).toBe(0);
    expect((await db.run.findUniqueOrThrow({ where: { id: late.run.id } })).challengeId).toBeNull();
  });

  it("judges Guerra de Lanche missions from the checked stats", async () => {
    await scheduleMission(db, DAY, "food-streak-eight");
    const { player } = await makePlayer(db);
    const play = (claim: ReturnType<typeof lunchClaim>, at: number) => {
      const { ticket } = ticketFor("food-fight", null, player.id, at, DAY);
      return submitRun(db, { player, ticket, claim, now: new Date(at + 90_000) });
    };
    expect((await play(lunchClaim({ bestStreak: 6 }), NOON)).mission).toMatchObject({ status: "missed", shortfall: { condition: { stat: "bestStreak" }, actual: 6 } });
    expect((await play(lunchClaim({ bestStreak: 8, comboPoints: 1200 }), NOON + 200_000)).mission).toMatchObject({ status: "completed", firstTime: true, best: { position: 1 } });
  });

  it("keeps players apart and leaves hidden players out of the count", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player: ana } = await makePlayer(db, "Ana");
    const { player: bia } = await makePlayer(db, "Bia");
    const { player: hidden } = await makePlayer(db, "Sombra", "hidden");
    await playLab(ana, QUICK);
    await playLab(hidden, QUICK, { at: NOON + 5000 });
    const forBia = await missionToday(db, bia, new Date(NOON + 300_000));
    expect(forBia).toMatchObject({ completions: 1, leader: { nickname: "Ana", you: false }, you: { state: "new", attempts: 0, best: null, progress: { days: 0 } } });
    const forAna = await missionToday(db, ana, new Date(NOON + 300_000));
    expect(forAna.you).toMatchObject({ state: "completed", attempts: 1, best: { position: 1, total: 1 }, progress: { days: 1, streak: 1 } });
    const anonymous = await missionToday(db, null, new Date(NOON + 300_000));
    expect(anonymous.you).toBeNull();
    expect(anonymous.mission).toMatchObject({ day: DAY, key: "lab-pixel-fast", game: "bad-ideas-lab", level: "pixel", title: missionByKey("lab-pixel-fast")!.title });
  });

  it("lists the player's missions newest first, page by page, with their final place", async () => {
    const { player } = await makePlayer(db);
    const { player: rival } = await makePlayer(db, "Rival");
    for (const [i, day] of ["2026-11-02", "2026-11-03", "2026-11-04"].entries()) {
      await scheduleMission(db, day, "lab-pixel-fast");
      const at = Date.UTC(2026, 10, 2 + i, 15, 0, 0);
      const parts = day === "2026-11-03" ? GOLDEN : QUICK;
      if (day === "2026-11-02") await playLab(rival, QUICKER, { at: at - 1000, mission: day });
      await playLab(player, parts, { at, mission: day });
    }
    const first = await missionHistory(db, player, { before: null, limit: 2 });
    expect(first.entries.map((e) => [e.mission.day, e.you.state])).toEqual([
      ["2026-11-04", "completed"],
      ["2026-11-03", "started"],
    ]);
    expect(first.next).toBe("2026-11-03");
    const second = await missionHistory(db, player, { before: first.next, limit: 2 });
    expect(second.entries).toHaveLength(1);
    expect(second.entries[0]).toMatchObject({ mission: { day: "2026-11-02" }, you: { state: "completed", best: { position: 1, total: 2 } } });
    expect(second.next).toBeNull();
    expect(await missionHistory(db, rival, { before: null, limit: 10 })).toMatchObject({ entries: [{ mission: { day: "2026-11-02" }, you: { best: { position: 2 } } }] });
  });

  it("forgets everything about a player who leaves the board", async () => {
    await scheduleMission(db, DAY, "lab-pixel-fast");
    const { player } = await makePlayer(db);
    await playLab(player, QUICK);
    await db.player.delete({ where: { id: player.id } });
    expect(await db.challengeEntry.count()).toBe(0);
    expect(await db.personalBest.count({ where: { board: missionBoard(DAY) } })).toBe(0);
    expect(await db.dailyChallenge.count()).toBe(1);
  });
});
