import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { beforeEach, describe, expect, it } from "vitest";
import { standing, topOfBoard } from "./boards";
import { cleanup } from "./cleanup";
import { HttpError } from "./http";
import { consume, LIMITS } from "./rate-limit";
import { submitRun } from "./runs";
import { boardOf, hasTestDb, labClaim, makePlayer, resetDb, streetClaim, testDb, ticketFor } from "./testing";

const START = Date.UTC(2026, 10, 3, 15, 0, 0);
const PIXEL: PlacedPart[] = [{ type: "ramp", x: 620, y: 420, rot: 4 }];
const STREET = boardOf("dead-end-street", null);

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

  function submitStreet(playerId: string, score: Parameters<typeof streetClaim>[0], at: number, player: Awaited<ReturnType<typeof makePlayer>>["player"]) {
    const { ticket } = ticketFor("dead-end-street", null, playerId, at);
    return submitRun(db, { player, ticket, claim: streetClaim(score), now: new Date(at + 90_000) });
  }

  it("stores a checked run and makes it the personal best", async () => {
    const { player } = await makePlayer(db);
    const outcome = await submitStreet(player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START, player);
    expect(outcome.run).toMatchObject({ verification: "checked", eligible: true, score: 1900, stars: 2 });
    expect(outcome.board).toMatchObject({ id: STREET, improved: true, previous: null, position: 1, total: 1 });
    const best = await db.personalBest.findUnique({ where: { playerId_board: { playerId: player.id, board: STREET } } });
    expect(best).toMatchObject({ runId: outcome.run.id, score: 1900, rank1: 1900, rank2: -5 });
  });

  it("only replaces the personal best with a better result", async () => {
    const { player } = await makePlayer(db);
    await submitStreet(player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START, player);
    const worse = await submitStreet(player.id, { targetPoints: 900, combos: 0, mess: 0, launches: 6 }, START + 1000, player);
    expect(worse.board).toMatchObject({ improved: false, best: { score: 1900 } });
    const better = await submitStreet(player.id, { targetPoints: 900, combos: 2, mess: 6, launches: 4 }, START + 2000, player);
    expect(better.board).toMatchObject({ improved: true, previous: { score: 1900 }, best: { score: 2300 } });
    expect(await db.run.count({ where: { playerId: player.id } })).toBe(3);
  });

  it("keeps the first of two equal results", async () => {
    const { player } = await makePlayer(db);
    const first = await submitStreet(player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START, player);
    const same = await submitStreet(player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START + 5000, player);
    expect(same.board).toMatchObject({ improved: false });
    const best = await db.personalBest.findFirst({ where: { playerId: player.id } });
    expect(best?.runId).toBe(first.run.id);
  });

  it("is idempotent: the same ticket never creates a second run", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("dead-end-street", null, player.id, START);
    const claim = streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 5 });
    const first = await submitRun(db, { player, ticket, claim, now: new Date(START + 90_000) });
    const again = await submitRun(db, { player, ticket, claim, now: new Date(START + 95_000) });
    expect(again.repeated).toBe(true);
    expect(again.run.id).toBe(first.run.id);
    expect(again.board).toMatchObject({ improved: true, position: 1 });
    expect(await db.run.count()).toBe(1);
  });

  it("handles the same ticket sent many times at once", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("dead-end-street", null, player.id, START);
    const claim = streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 5 });
    const results = await Promise.all(Array.from({ length: 8 }, () => submitRun(db, { player, ticket, claim, now: new Date(START + 90_000) })));
    expect(new Set(results.map((r) => r.run.id)).size).toBe(1);
    expect(results.filter((r) => !r.repeated).length).toBe(1);
    expect(await db.run.count()).toBe(1);
  });

  it("keeps the best of many concurrent submissions", async () => {
    const { player } = await makePlayer(db);
    const mess = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const results = await Promise.all(mess.map((m, i) => submitStreet(player.id, { targetPoints: 900, combos: 1, mess: m, launches: 5 }, START + i, player)));
    const best = await db.personalBest.findMany({ where: { playerId: player.id } });
    expect(best).toHaveLength(1);
    expect(best[0].score).toBe(900 + 100 + 300 + 9 * 25 + 500);
    expect(results.some((r) => r.board && "improved" in r.board && r.board.improved)).toBe(true);
    expect(await db.run.count()).toBe(10);
  });

  it("orders the board by the rule, then by who got there first", async () => {
    const a = await makePlayer(db, "Primeira");
    const b = await makePlayer(db, "Segunda");
    const c = await makePlayer(db, "Terceira");
    await submitStreet(a.player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START + 3000, a.player);
    await submitStreet(b.player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START, b.player);
    await submitStreet(c.player.id, { targetPoints: 900, combos: 3, mess: 0, launches: 4 }, START + 6000, c.player);
    const top = await topOfBoard(db, "dead-end-street", STREET, 10, a.player.id);
    expect(top.entries.map((e) => e.nickname)).toEqual(["Terceira", "Segunda", "Primeira"]);
    expect(top.entries.map((e) => e.position)).toEqual([1, 2, 3]);
    expect(top.entries[2].you).toBe(true);
    expect(await standing(db, "dead-end-street", STREET, a.player.id)).toMatchObject({ position: 3, total: 3 });
    expect(await standing(db, "dead-end-street", STREET, b.player.id)).toMatchObject({ position: 2, total: 3 });
  });

  it("tells each submission who holds the channel record", async () => {
    const champ = await makePlayer(db, "Campea");
    const rival = await makePlayer(db, "Rival");
    const first = await submitStreet(champ.player.id, { targetPoints: 900, combos: 3, mess: 0, launches: 4 }, START, champ.player);
    expect(first.board?.leader).toMatchObject({ nickname: "Campea", you: true });
    const second = await submitStreet(rival.player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START + 3000, rival.player);
    expect(second.board?.leader).toMatchObject({ nickname: "Campea", tag: champ.player.tag, you: false });
    expect(second.board).toMatchObject({ position: 2, verified: false });
  });

  it("marks Laboratório records as replayed by the server", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("bad-ideas-lab", "pixel", player.id, START);
    const outcome = await submitRun(db, { player, ticket, claim: labClaim("pixel", PIXEL), now: new Date(START + 20_000) });
    expect(outcome.run.verification).toBe("replayed");
    expect(outcome.board).toMatchObject({ verified: true, best: { metrics: [1, 256] } });
    const top = await topOfBoard(db, "bad-ideas-lab", boardOf("bad-ideas-lab", "pixel"), 10, null);
    expect(top.entries[0]).toMatchObject({ verified: true, metrics: [1, 256] });
  });

  it("uses fewer launches to break a score tie", async () => {
    const a = await makePlayer(db, "Menos Tiros");
    const b = await makePlayer(db, "Mais Tiros");
    await submitStreet(b.player.id, { targetPoints: 900, combos: 2, mess: 4, launches: 5 }, START, b.player);
    await submitStreet(a.player.id, { targetPoints: 900, combos: 0, mess: 2, launches: 4 }, START + 1000, a.player);
    const top = await topOfBoard(db, "dead-end-street", STREET, 10, null);
    expect(top.entries.map((e) => [e.nickname, e.score])).toEqual([
      ["Menos Tiros", 2000],
      ["Mais Tiros", 2000],
    ]);
  });

  it("hides hidden players from everyone else but still shows them their place", async () => {
    const visible = await makePlayer(db, "Visivel");
    const hidden = await makePlayer(db, "Escondido", "hidden");
    await submitStreet(visible.player.id, { targetPoints: 900, combos: 0, mess: 0, launches: 6 }, START, visible.player);
    await submitStreet(hidden.player.id, { targetPoints: 900, combos: 3, mess: 9, launches: 4 }, START, hidden.player);
    const top = await topOfBoard(db, "dead-end-street", STREET, 10, null);
    expect(top.entries.map((e) => e.nickname)).toEqual(["Visivel"]);
    expect(top.total).toBe(1);
    expect(await standing(db, "dead-end-street", STREET, hidden.player.id)).toMatchObject({ position: 1, total: 2 });
    expect(await standing(db, "dead-end-street", STREET, visible.player.id)).toMatchObject({ position: 1, total: 1 });
  });

  it("keeps per-level boards apart and leaves practice levels off the board", async () => {
    const { player } = await makePlayer(db);
    const pixel = ticketFor("bad-ideas-lab", "pixel", player.id, START).ticket;
    const outcome = await submitRun(db, { player, ticket: pixel, claim: labClaim("pixel", PIXEL), now: new Date(START + 20_000) });
    expect(outcome.board).toMatchObject({ id: boardOf("bad-ideas-lab", "pixel"), position: 1 });
    const practice = ticketFor("bad-ideas-lab", "test", player.id, START).ticket;
    const tutorial = await submitRun(db, { player, ticket: practice, claim: labClaim("test", [{ type: "ramp", x: 680, y: 560, rot: 4 }]), now: new Date(START + 20_000) });
    expect(tutorial.board).toBeNull();
    expect(tutorial.run).toMatchObject({ eligible: false, ineligible: "practice" });
    expect(await db.personalBest.count()).toBe(1);
  });

  it("stores rejected runs without touching the board and explains why", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("dead-end-street", null, player.id, START);
    const claim = { ...streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 5 }), score: 99_999 };
    expect(await rejectionOf(submitRun(db, { player, ticket, claim, now: new Date(START + 90_000) }))).toMatchObject({ code: "rejected", reason: "score_mismatch" });
    const run = await db.run.findUnique({ where: { ticketId: ticket.id } });
    expect(run).toMatchObject({ verification: "rejected", eligible: false, flags: ["score_mismatch"], board: null });
    expect(await db.personalBest.count()).toBe(0);
    expect(await rejectionOf(submitRun(db, { player, ticket, claim, now: new Date(START + 91_000) }))).toMatchObject({ code: "rejected", reason: "score_mismatch" });
  });

  it("rejects results that arrive faster than the match could be played", async () => {
    const { player } = await makePlayer(db);
    const { ticket } = ticketFor("dead-end-street", null, player.id, START);
    const claim = streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 5 }, 70_000);
    expect(await rejectionOf(submitRun(db, { player, ticket, claim, now: new Date(START + 10_000) }))).toMatchObject({ code: "rejected", reason: "too_fast" });
  });

  it("refuses a ticket issued to another player and a run someone else already sent", async () => {
    const owner = await makePlayer(db, "Dona");
    const other = await makePlayer(db, "Outra");
    const claim = streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 5 });
    const bound = ticketFor("dead-end-street", null, owner.player.id, START).ticket;
    expect(await rejectionOf(submitRun(db, { player: other.player, ticket: bound, claim, now: new Date(START + 90_000) }))).toMatchObject({ code: "wrong_player" });
    const open = ticketFor("dead-end-street", null, null, START).ticket;
    await submitRun(db, { player: owner.player, ticket: open, claim, now: new Date(START + 90_000) });
    expect(await rejectionOf(submitRun(db, { player: other.player, ticket: open, claim, now: new Date(START + 90_000) }))).toMatchObject({ code: "conflict" });
  });

  it("pauses a player after too many rejected results", async () => {
    const { player } = await makePlayer(db);
    const bad = { ...streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 5 }), score: 1 };
    for (let i = 0; i < LIMITS.rejected.max; i += 1) {
      const { ticket } = ticketFor("dead-end-street", null, player.id, START + i);
      await rejectionOf(submitRun(db, { player, ticket, claim: bad, now: new Date(START + 90_000) }));
    }
    const { ticket } = ticketFor("dead-end-street", null, player.id, START);
    const good = streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 5 });
    expect(await rejectionOf(submitRun(db, { player, ticket, claim: good, now: new Date(START + 90_000) }))).toMatchObject({ code: "rate_limited" });
  });

  it("erases everything about a player when they leave", async () => {
    const { player } = await makePlayer(db);
    await submitStreet(player.id, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, START, player);
    await db.playerAchievement.create({ data: { playerId: player.id, achievement: "street-win", source: "verified" } });
    await db.player.delete({ where: { id: player.id } });
    expect(await db.run.count()).toBe(0);
    expect(await db.personalBest.count()).toBe(0);
    expect(await db.playerAchievement.count()).toBe(0);
  });

  it("enforces the database constraints", async () => {
    await expect(db.player.create({ data: { tokenHash: "x".repeat(64), nickname: "ab", nicknameKey: "ab", tag: "0001" } })).rejects.toThrow();
    await expect(db.player.create({ data: { tokenHash: "y".repeat(64), nickname: "Valido", nicknameKey: "valido", tag: "12a4" } })).rejects.toThrow();
    const { player } = await makePlayer(db);
    await expect(
      db.run.create({
        data: {
          ticketId: "00000000-0000-4000-8000-000000000001",
          playerId: player.id,
          game: "dead-end-street",
          level: "-",
          won: true,
          score: 10,
          stars: 4,
          stats: {},
          rank1: 0,
          rank2: 0,
          rank3: 0,
          verification: "checked",
          eligible: true,
          rulesVersion: 1,
          startedAt: new Date(),
        },
      }),
    ).rejects.toThrow();
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

  it("counts concurrent requests exactly", async () => {
    const limit = { name: "burst", max: 100, windowMs: 60_000 };
    const now = new Date(START);
    await Promise.all(Array.from({ length: 25 }, () => consume(db, limit, "same", now)));
    const row = await db.rateLimit.findFirst({ where: { key: "burst:same" } });
    expect(row?.count).toBe(25);
  });

  it("deletes old rate limits, old runs that are not records, and long-gone players", async () => {
    const { player } = await makePlayer(db);
    const old = START - 120 * 24 * 60 * 60 * 1000;
    const kept = await submitStreet(player, { targetPoints: 900, combos: 1, mess: 4, launches: 5 }, old);
    await submitStreet(player, { targetPoints: 900, combos: 0, mess: 0, launches: 6 }, old + 1000);
    await consume(db, { name: "old", max: 5, windowMs: 60_000 }, "x", new Date(old));
    const gone = await makePlayer(db, "Sumido");
    await db.player.update({ where: { id: gone.player.id }, data: { lastSeenAt: new Date(START - 800 * 24 * 60 * 60 * 1000) } });
    const removed = await cleanup(db, new Date(START));
    expect(removed).toMatchObject({ rateLimits: 1, oldRuns: 1, players: 1 });
    expect(await db.run.findMany({ select: { id: true } })).toEqual([{ id: kept.run.id }]);
  });

  async function submitStreet(player: Awaited<ReturnType<typeof makePlayer>>["player"], score: Parameters<typeof streetClaim>[0], at: number) {
    const { ticket } = ticketFor("dead-end-street", null, player.id, at);
    return submitRun(db, { player, ticket, claim: streetClaim(score), now: new Date(at + 90_000) });
  }
});
