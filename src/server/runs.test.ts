import { beforeEach, describe, expect, it } from "vitest";
import { standing, topOfBoard } from "./boards";
import { cleanup } from "./cleanup";
import { HttpError } from "./http";
import { consume, LIMITS } from "./rate-limit";
import { submitRun } from "./runs";
import { boardOf, hasTestDb, labClaim, lunchClaim, makePlayer, resetDb, testDb, ticketFor } from "./testing";

const START = Date.UTC(2026, 10, 3, 15, 0, 0);
const BOARD = boardOf("food-fight", null);

function claimWith(interrupts: number, timeMs = 75_000) {
  return lunchClaim({ interrupts, interruptPoints: interrupts * 100, timeMs });
}

async function rejectionOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof HttpError) return { code: error.code, ...error.extra };
    throw error;
  }
  throw new Error("expected a rejection");
}

describe.skipIf(!hasTestDb)("run submissions", () => {
  const db = testDb();

  beforeEach(async () => {
    await resetDb(db);
  });

  function submitLunch(playerId: string, interrupts: number, at: number, player: Awaited<ReturnType<typeof makePlayer>>["player"]) {
    const { ticket } = ticketFor("food-fight", null, playerId, at);
    return submitRun(db, { player, ticket, claim: claimWith(interrupts), now: new Date(at + 90_000) });
  }

  it("stores a checked run and makes it the personal best", async () => {
    const { player } = await makePlayer(db);
    const outcome = await submitLunch(player.id, 2, START, player);
    expect(outcome.run).toMatchObject({ verification: "checked", eligible: true, score: 6000, stars: 1 });
    expect(outcome.board).toMatchObject({ id: BOARD, improved: true, previous: null, position: 1, total: 1 });
    const best = await db.personalBest.findUnique({ where: { playerId_board: { playerId: player.id, board: BOARD } } });
    expect(best).toMatchObject({ runId: outcome.run.id, score: 6000, rank1: 6000, rank2: -2 });
  });

  it("keeps only the replay the game's judge uses", async () => {
    const { player } = await makePlayer(db);
    const lunch = ticketFor("food-fight", null, player.id, START);
    const stray = { kind: "bedtime-moves" as const, version: 1 as const, moves: "w".repeat(400) };
    const checked = await submitRun(db, { player, ticket: lunch.ticket, claim: { ...claimWith(2), replay: stray }, now: new Date(START + 90_000) });
    expect(checked.run).toMatchObject({ verification: "checked", eligible: true });
    expect((await db.run.findUnique({ where: { id: checked.run.id } }))?.replay).toBeNull();
    const lab = ticketFor("bad-ideas-lab", "juice", player.id, START);
    const replayed = await submitRun(db, { player, ticket: lab.ticket, claim: labClaim("juice", [{ type: "fan", x: 160, y: 580, rot: 0 }]), now: new Date(START + 90_000) });
    expect(replayed.run).toMatchObject({ verification: "replayed" });
    expect((await db.run.findUnique({ where: { id: replayed.run.id } }))?.replay).toMatchObject({ kind: "lab-placements" });
  });

  it("only replaces the personal best with a better result", async () => {
    const { player } = await makePlayer(db);
    await submitLunch(player.id, 2, START, player);
    const worse = await submitLunch(player.id, 0, START + 1000, player);
    expect(worse.board).toMatchObject({ improved: false, best: { score: 6000 } });
    const better = await submitLunch(player.id, 6, START + 2000, player);
    expect(better.board).toMatchObject({ improved: true, previous: { score: 6000 }, best: { score: 6400 } });
    expect(await db.run.count({ where: { playerId: player.id } })).toBe(3);
  });

  it("is idempotent: the same ticket never creates a second run", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("food-fight", null, player.id, START);
    const claim = claimWith(2);
    const first = await submitRun(db, { player, ticket, claim, now: new Date(START + 90_000) });
    const again = await submitRun(db, { player, ticket, claim, now: new Date(START + 95_000) });
    expect(again.repeated).toBe(true);
    expect(again.run.id).toBe(first.run.id);
    expect(again.board).toMatchObject({ improved: true, position: 1 });
    expect(await db.run.count()).toBe(1);
  });

  it("handles the same ticket sent many times at once", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("food-fight", null, player.id, START);
    const claim = claimWith(2);
    const results = await Promise.all(Array.from({ length: 8 }, () => submitRun(db, { player, ticket, claim, now: new Date(START + 90_000) })));
    expect(new Set(results.map((r) => r.run.id)).size).toBe(1);
    expect(results.filter((r) => !r.repeated).length).toBe(1);
    expect(await db.run.count()).toBe(1);
  });

  it("keeps the best of many concurrent submissions", async () => {
    const { player } = await makePlayer(db);
    const interrupts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const results = await Promise.all(interrupts.map((m, i) => submitLunch(player.id, m, START + i, player)));
    const best = await db.personalBest.findMany({ where: { playerId: player.id } });
    expect(best).toHaveLength(1);
    expect(best[0].score).toBe(5800 + 9 * 100);
    expect(results.some((r) => r.board && "improved" in r.board && r.board.improved)).toBe(true);
    expect(await db.run.count()).toBe(10);
  });

  it("orders the board by the rule, then by who got there first", async () => {
    const a = await makePlayer(db, "Primeira");
    const b = await makePlayer(db, "Segunda");
    const c = await makePlayer(db, "Terceira");
    await submitLunch(a.player.id, 2, START + 3000, a.player);
    await submitLunch(b.player.id, 2, START, b.player);
    await submitLunch(c.player.id, 5, START + 6000, c.player);
    const top = await topOfBoard(db, "food-fight", BOARD, 10, a.player.id);
    expect(top.entries.map((e) => e.nickname)).toEqual(["Terceira", "Segunda", "Primeira"]);
    expect(top.entries.map((e) => e.position)).toEqual([1, 2, 3]);
    expect(top.entries[2].you).toBe(true);
    expect(await standing(db, "food-fight", BOARD, a.player.id)).toMatchObject({ position: 3, total: 3 });
    expect(await standing(db, "food-fight", BOARD, b.player.id)).toMatchObject({ position: 2, total: 3 });
  });

  it("hides hidden players from everyone else but still shows them their place", async () => {
    const visible = await makePlayer(db, "Visivel");
    const hidden = await makePlayer(db, "Escondido", "hidden");
    await submitLunch(visible.player.id, 0, START, visible.player);
    await submitLunch(hidden.player.id, 9, START, hidden.player);
    const top = await topOfBoard(db, "food-fight", BOARD, 10, null);
    expect(top.entries.map((e) => e.nickname)).toEqual(["Visivel"]);
    expect(top.total).toBe(1);
    expect(await standing(db, "food-fight", BOARD, hidden.player.id)).toMatchObject({ position: 1, total: 2 });
    expect(await standing(db, "food-fight", BOARD, visible.player.id)).toMatchObject({ position: 1, total: 1 });
  });

  it("stores rejected runs without touching the board and explains why", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("food-fight", null, player.id, START);
    const claim = { ...claimWith(2), score: 99_999 };
    expect(await rejectionOf(submitRun(db, { player, ticket, claim, now: new Date(START + 90_000) }))).toMatchObject({ code: "rejected", reason: "score_mismatch" });
    const run = await db.run.findUnique({ where: { ticketId: ticket.id } });
    expect(run).toMatchObject({ verification: "rejected", eligible: false, flags: ["score_mismatch"], board: null });
    expect(await db.personalBest.count()).toBe(0);
    expect(await rejectionOf(submitRun(db, { player, ticket, claim, now: new Date(START + 91_000) }))).toMatchObject({ code: "rejected", reason: "score_mismatch" });
  });

  it("rejects results that arrive faster than the match could be played", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("food-fight", null, player.id, START);
    const claim = claimWith(2);
    expect(await rejectionOf(submitRun(db, { player, ticket, claim, now: new Date(START + 10_000) }))).toMatchObject({ code: "rejected", reason: "too_fast" });
  });

  it("refuses a ticket issued to another player and a run someone else already sent", async () => {
    const owner = await makePlayer(db, "Dona");
    const other = await makePlayer(db, "Outra");
    const claim = claimWith(2);
    const bound = ticketFor("food-fight", null, owner.player.id, START).ticket;
    expect(await rejectionOf(submitRun(db, { player: other.player, ticket: bound, claim, now: new Date(START + 90_000) }))).toMatchObject({ code: "wrong_player" });
    const open = ticketFor("food-fight", null, null, START).ticket;
    await submitRun(db, { player: owner.player, ticket: open, claim, now: new Date(START + 90_000) });
    expect(await rejectionOf(submitRun(db, { player: other.player, ticket: open, claim, now: new Date(START + 90_000) }))).toMatchObject({ code: "conflict" });
  });

  it("pauses a player after too many rejected results", async () => {
    const { player } = await makePlayer(db);
    const bad = { ...claimWith(2), score: 1 };
    for (let i = 0; i < LIMITS.rejected.max; i += 1) {
      const { ticket } = ticketFor("food-fight", null, player.id, START + i);
      await rejectionOf(submitRun(db, { player, ticket, claim: bad, now: new Date(START + 90_000) }));
    }
    const { ticket } = ticketFor("food-fight", null, player.id, START);
    const good = claimWith(2);
    expect(await rejectionOf(submitRun(db, { player, ticket, claim: good, now: new Date(START + 90_000) }))).toMatchObject({ code: "rate_limited" });
  });

  it("keeps the pause when many rejected results arrive at once", async () => {
    const { player } = await makePlayer(db);
    const bad = { ...claimWith(2), score: 1 };
    const sent = Array.from({ length: 20 }, (_, i) => rejectionOf(submitRun(db, { player, ticket: ticketFor("food-fight", null, player.id, START + i).ticket, claim: bad, now: new Date(START + 90_000) })));
    const codes = (await Promise.all(sent)).map((r) => r.code);
    expect(codes.filter((c) => c === "rejected")).toHaveLength(LIMITS.rejected.max);
    expect(codes.filter((c) => c === "rate_limited")).toHaveLength(20 - LIMITS.rejected.max);
    expect(await db.run.count({ where: { playerId: player.id, verification: "rejected" } })).toBe(LIMITS.rejected.max);
  });

  it("erases everything about a player when they leave", async () => {
    const { player } = await makePlayer(db);
    await submitLunch(player.id, 2, START, player);
    await db.playerAchievement.create({ data: { playerId: player.id, achievement: "street-win", source: "verified" } });
    await db.player.delete({ where: { id: player.id } });
    expect(await db.run.count()).toBe(0);
    expect(await db.personalBest.count()).toBe(0);
    expect(await db.playerAchievement.count()).toBe(0);
  });
});

describe.skipIf(!hasTestDb)("rate limits and retention", () => {
  const db = testDb();

  beforeEach(async () => {
    await resetDb(db);
  });

  it("counts requests per window and resets in the next one", async () => {
    const limit = { name: "test", max: 3, windowMs: 60_000 };
    const now = new Date(START);
    const counts = [];
    for (let i = 0; i < 4; i += 1) counts.push((await consume(db, limit, "abc", now)).ok);
    expect(counts).toEqual([true, true, true, false]);
    expect((await consume(db, limit, "abc", new Date(START + 60_000))).ok).toBe(true);
    expect((await consume(db, limit, "other", now)).ok).toBe(true);
  });

  it("deletes old rate limits, old runs that are not records, and long-gone players", async () => {
    const { player } = await makePlayer(db);
    const old = START - 120 * 24 * 60 * 60 * 1000;
    const kept = await submitLunch(player, 2, old);
    await submitLunch(player, 0, old + 1000);
    await consume(db, { name: "old", max: 5, windowMs: 60_000 }, "x", new Date(old));
    const gone = await makePlayer(db, "Sumido");
    await db.player.update({ where: { id: gone.player.id }, data: { lastSeenAt: new Date(START - 800 * 24 * 60 * 60 * 1000) } });
    const removed = await cleanup(db, new Date(START));
    expect(removed).toMatchObject({ rateLimits: 1, oldRuns: 1, players: 1 });
    expect(await db.run.findMany({ select: { id: true } })).toEqual([{ id: kept.run.id }]);
  });

  async function submitLunch(player: Awaited<ReturnType<typeof makePlayer>>["player"], interrupts: number, at: number) {
    const { ticket } = ticketFor("food-fight", null, player.id, at);
    return submitRun(db, { player, ticket, claim: claimWith(interrupts), now: new Date(at + 90_000) });
  }
});
