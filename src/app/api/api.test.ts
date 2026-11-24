import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { attemptBonus } from "@/games/bad-ideas-lab/levels";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CloudCopy } from "@/lib/competition/recovery";
import type { ApiErrorBody, LeaderboardResponse, PublicPlayer } from "@/lib/competition/types";
import { closeDb, type Db } from "@/server/db";
import { LIMITS } from "@/server/rate-limit";
import { missionDay } from "@/lib/missions/calendar";
import type { MissionHistoryResponse, MissionTodayResponse } from "@/lib/missions/types";
import { apiRequest, cookieFrom, hasTestDb, labClaim, resetDb, scheduleMission, testDb } from "@/server/testing";
import { GET as cleanupGet } from "./cron/cleanup/route";
import { GET as boardGet } from "./leaderboards/route";
import { GET as missionHistoryGet } from "./missions/history/route";
import { GET as missionTodayGet } from "./missions/today/route";
import { GET as copyGet, PUT as copyPut } from "./players/me/copy/route";
import { POST as recoveryPost } from "./players/me/recovery/route";
import { DELETE as meDelete, GET as meGet, PATCH as mePatch } from "./players/me/route";
import { POST as recoverPost } from "./players/recover/route";
import { POST as join } from "./players/route";
import { POST as submit } from "./runs/route";
import { POST as ticket } from "./runs/tickets/route";
import { GET as status } from "./status/route";

const JUICE: PlacedPart[] = [{ type: "fan", x: 160, y: 580, rot: 0 }];
const QUICK_JUICE: PlacedPart[] = [{ type: "fan", x: 220, y: 580, rot: 0 }];

async function body<T = Record<string, unknown>>(response: Response) {
  return (await response.json()) as T;
}

describe("without configuration", () => {
  const saved = { url: process.env.DATABASE_URL, secret: process.env.COMPETITION_SECRET };

  afterEach(() => {
    process.env.DATABASE_URL = saved.url;
    process.env.COMPETITION_SECRET = saved.secret;
  });

  it("reports the board as not configured instead of failing", async () => {
    process.env.DATABASE_URL = "";
    expect(await body(await status())).toEqual({ status: "unconfigured" });
    const response = await join(apiRequest("/api/players", { method: "POST", body: { nickname: "Pato Veloz" } }));
    expect(response.status).toBe(503);
    expect(await body(response)).toMatchObject({ error: { code: "unconfigured" } });
  });

  it("refuses a short secret", async () => {
    process.env.COMPETITION_SECRET = "short";
    expect(await body(await status())).toEqual({ status: "unconfigured" });
  });
});

describe("when the database is down", () => {
  const saved = process.env.DATABASE_URL;

  afterEach(async () => {
    await closeDb();
    process.env.DATABASE_URL = saved;
  });

  it("answers offline and 503 without leaking errors", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await closeDb();
    process.env.DATABASE_URL = "postgresql://nobody:nothing@127.0.0.1:1/none";
    expect(await body(await status())).toEqual({ status: "offline" });
    const response = await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "dead-end-street", level: "warm-up" } }));
    expect(response.status).toBe(503);
    expect(await body(response)).toEqual({ error: { code: "unavailable", message: expect.any(String) } });
    expect(warn).toHaveBeenCalledWith("scoreboard database unavailable", expect.any(String));
    expect(warn.mock.calls.flat().join(" ")).not.toContain("postgresql://");
  });
});

describe.skipIf(!hasTestDb)("competition API", () => {
  let db: Db;

  beforeEach(async () => {
    db = testDb();
    await resetDb(db);
  });

  async function joinAs(nickname = "Pato Veloz", address = "203.0.113.7") {
    const response = await join(apiRequest("/api/players", { method: "POST", body: { nickname }, headers: { "x-forwarded-for": address } }));
    return { response, cookie: cookieFrom(response), data: await body(response) };
  }

  async function ticketAs(cookie: string | undefined, game = "dead-end-street", level: string | null = "warm-up") {
    const response = await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game, level }, cookie }));
    return body(response);
  }

  it("joins with a nickname and an httpOnly cookie, with no personal data", async () => {
    const { response, cookie, data } = await joinAs("  Déco   Turbo ");
    expect(response.status).toBe(201);
    expect(data.player).toEqual({ id: expect.any(String), nickname: "Déco Turbo", tag: expect.stringMatching(/^\d{4}$/), createdAt: expect.any(String), recoveryAt: null });
    const header = response.headers.get("set-cookie")!;
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/SameSite=Lax/);
    expect(header).toMatch(/Path=\/api/);
    const me = await body<{ player: PublicPlayer }>(await meGet(apiRequest("/api/players/me", { cookie })));
    expect(me.player.nickname).toBe("Déco Turbo");
    const stored = await db.player.findFirstOrThrow();
    expect(stored.tokenHash).toHaveLength(64);
    expect(cookie).not.toContain(stored.tokenHash);
  });

  it("returns no player without a cookie, and with a bogus one", async () => {
    expect(await body(await meGet(apiRequest("/api/players/me")))).toEqual({ player: null });
    expect(await body(await meGet(apiRequest("/api/players/me", { cookie: "c404_player=nonsense" })))).toEqual({ player: null });
  });

  it("refuses cross-site writes, non-JSON bodies and oversized payloads", async () => {
    const cross = await join(apiRequest("/api/players", { method: "POST", body: { nickname: "Pato" }, headers: { origin: "https://evil.example" } }));
    expect(cross.status).toBe(403);
    const fetchSite = await join(apiRequest("/api/players", { method: "POST", body: { nickname: "Pato" }, headers: { "sec-fetch-site": "cross-site" } }));
    expect(fetchSite.status).toBe(403);
    const text = await join(new Request("http://localhost:4404/api/players", { method: "POST", headers: { "content-type": "text/plain" }, body: "nickname=Pato" }));
    expect(text.status).toBe(400);
    const huge = await join(apiRequest("/api/players", { method: "POST", body: { nickname: "x".repeat(5000) } }));
    expect(huge.status).toBe(413);
    const extra = await join(apiRequest("/api/players", { method: "POST", body: { nickname: "Pato Veloz", email: "a@b.c" } }));
    expect(extra.status).toBe(400);
  });

  it("limits how many players one address can create", async () => {
    const statuses: number[] = [];
    for (let i = 0; i <= LIMITS.join.max; i += 1) statuses.push((await joinAs(`Pato ${String.fromCharCode(97 + (i % 26))}${i}`, "198.51.100.4")).response.status);
    expect(statuses.slice(0, LIMITS.join.max).every((s) => s === 201)).toBe(true);
    expect(statuses[LIMITS.join.max]).toBe(429);
    const other = await joinAs("Pato Outro", "198.51.100.5");
    expect(other.response.status).toBe(201);
  });

  it("counts one IPv6 network as one address", async () => {
    const statuses: number[] = [];
    for (let i = 0; i <= LIMITS.join.max; i += 1) statuses.push((await joinAs(`Pato ${String.fromCharCode(97 + (i % 26))}${i}`, `2001:db8:7:42:${(i + 1).toString(16)}::1`)).response.status);
    expect(statuses.slice(0, LIMITS.join.max).every((s) => s === 201)).toBe(true);
    expect(statuses[LIMITS.join.max]).toBe(429);
    expect((await joinAs("Pato Vizinho", "2001:db8:7:43::1")).response.status).toBe(201);
  });

  it("renames and deletes the player", async () => {
    const { cookie } = await joinAs();
    const renamed = await mePatch(apiRequest("/api/players/me", { method: "PATCH", body: { nickname: "Lina Elétrica" }, cookie }));
    expect((await body<{ player: PublicPlayer }>(renamed)).player.nickname).toBe("Lina Elétrica");
    const deleted = await meDelete(apiRequest("/api/players/me", { method: "DELETE", cookie }));
    expect(await body(deleted)).toEqual({ deleted: true });
    expect(deleted.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    expect(await db.player.count()).toBe(0);
    expect(await body(await meGet(apiRequest("/api/players/me", { cookie })))).toEqual({ player: null });
  });

  it("never gives two players the same nickname and tag", async () => {
    await db.$executeRawUnsafe(
      `INSERT INTO "players" ("id", "token_hash", "nickname", "nickname_key", "tag")
       SELECT gen_random_uuid(), lpad(n::text, 64, '0'), 'Pato Veloz', 'patoveloz', lpad(n::text, 4, '0')
       FROM generate_series(0, 9999) AS n WHERE n <> 404`,
    );
    const racing = await Promise.all([joinAs("pato-veloz", "203.0.113.8"), joinAs("PATO VELOZ", "203.0.113.9")]);
    const winner = racing.find((attempt) => attempt.response.status === 201)!;
    const loser = racing.find((attempt) => attempt.response.status !== 201)!;
    expect((winner.data.player as PublicPlayer).tag).toBe("0404");
    expect(loser.response.status).toBe(422);
    expect(loser.data).toMatchObject({ error: { code: "bad_nickname", problem: "full" } });

    const { cookie, data } = await joinAs("Lina Elétrica", "203.0.113.10");
    const tag = (data.player as PublicPlayer).tag;
    const refused = await mePatch(apiRequest("/api/players/me", { method: "PATCH", body: { nickname: "Pato Veloz" }, cookie }));
    expect(refused.status).toBe(422);
    const respelled = await mePatch(apiRequest("/api/players/me", { method: "PATCH", body: { nickname: "Lina Eletrica" }, cookie }));
    expect((await body<{ player: PublicPlayer }>(respelled)).player.tag).toBe(tag);
  });

  it("issues tickets only for real games and levels", async () => {
    expect((await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "strange-house" } }))).status).toBe(400);
    const levelless = await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "bad-ideas-lab" } }));
    expect(levelless.status).toBe(409);
    expect(await body(levelless)).toMatchObject({ error: { code: "outdated" } });
    expect((await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "bad-ideas-lab", level: "attic" } }))).status).toBe(400);
    const issued = await ticketAs(undefined, "bad-ideas-lab", "pixel");
    expect(issued).toEqual({ ticket: expect.any(String), seed: expect.any(Number), expiresAt: expect.any(String), mission: null });
  });

  it("stamps the mission on tickets only for today's game and level", async () => {
    const day = missionDay(new Date());
    await scheduleMission(db, day, "lab-juice-fast");
    const { cookie } = await joinAs();
    const ask = (level: string, mission: unknown) => ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "bad-ideas-lab", level, mission }, cookie }));
    expect(await body(await ask("juice", day))).toMatchObject({ mission: day });
    expect(await body(await ask("pixel", day))).toMatchObject({ mission: null });
    expect(await body(await ask("juice", "2020-01-01"))).toMatchObject({ mission: null });
    expect((await ask("juice", "ontem")).status).toBe(400);
    const started = await body<MissionTodayResponse>(await missionTodayGet(apiRequest("/api/missions/today", { cookie })));
    expect(started.you).toMatchObject({ state: "started", attempts: 0 });
  });

  it("completes the mission through the API and lists it in the history", async () => {
    const day = missionDay(new Date());
    await scheduleMission(db, day, "lab-juice-fast");
    const { cookie } = await joinAs();
    const issued = await body<{ ticket: string; mission: string }>(await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "bad-ideas-lab", level: "juice", mission: day }, cookie })));
    const quick = labClaim("juice", [{ type: "fan", x: 220, y: 580, rot: 0 }]);
    const sent = await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: issued.ticket, result: quick }, cookie }));
    expect(sent.status).toBe(201);
    expect((await body(sent)).mission).toMatchObject({ day, status: "completed", firstTime: true, best: { position: 1, total: 1, metrics: [1, 98] } });
    const today = await body<MissionTodayResponse>(await missionTodayGet(apiRequest("/api/missions/today", { cookie })));
    expect(today).toMatchObject({ completions: 1, leader: { you: true }, you: { state: "completed", attempts: 1, progress: { days: 1, streak: 1 }, championDays: 0, achievements: [{ id: "mission-first", day }] } });
    const history = await body<MissionHistoryResponse>(await missionHistoryGet(apiRequest("/api/missions/history?limit=5", { cookie })));
    expect(history).toMatchObject({ entries: [{ mission: { day, title: "Suco expresso" }, you: { state: "completed" } }], next: null });
  });

  it("submits a run, answers with the board standing and accepts the retry", async () => {
    const { cookie } = await joinAs();
    const { ticket: token } = await ticketAs(cookie, "bad-ideas-lab", "juice");
    const payload = { ticket: token, result: labClaim("juice", JUICE) };
    const first = await submit(apiRequest("/api/runs", { method: "POST", body: payload, cookie }));
    expect(first.status).toBe(201);
    const data = await body(first);
    expect(data.run).toMatchObject({ verification: "replayed", eligible: true, score: 1150 + attemptBonus(2), stars: 3 });
    expect(data.board).toMatchObject({ id: "bad-ideas-lab/juice/v1", improved: true, position: 1, total: 1, best: { metrics: [1, 112] } });
    const retry = await submit(apiRequest("/api/runs", { method: "POST", body: payload, cookie }));
    expect(retry.status).toBe(200);
    expect((await body(retry)).repeated).toBe(true);
  });

  it("asks for a nickname before accepting a run, and keeps the ticket usable after joining", async () => {
    const { ticket: token } = await ticketAs(undefined, "bad-ideas-lab", "juice");
    const payload = { ticket: token, result: labClaim("juice", JUICE) };
    const anonymous = await submit(apiRequest("/api/runs", { method: "POST", body: payload }));
    expect(anonymous.status).toBe(401);
    expect((await body<ApiErrorBody>(anonymous)).error.code).toBe("not_joined");
    const { cookie } = await joinAs();
    const accepted = await submit(apiRequest("/api/runs", { method: "POST", body: payload, cookie }));
    expect(accepted.status).toBe(201);
  });

  it("rejects forged tickets, malformed results and tampered scores", async () => {
    const { cookie } = await joinAs();
    const { ticket: token } = await ticketAs(cookie, "bad-ideas-lab", "juice");
    const forged = await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: `${token}x`, result: labClaim("juice", JUICE) }, cookie }));
    expect(forged.status).toBe(400);
    const malformed = await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: token, result: { won: "yes" } }, cookie }));
    expect(malformed.status).toBe(400);
    const tampered = await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: token, result: { ...labClaim("juice", JUICE), score: 5000 } }, cookie }));
    expect(tampered.status).toBe(422);
    expect((await body(tampered)).error).toMatchObject({ code: "rejected", reason: "score_mismatch" });
  });

  it("serves the board with the rule, metrics and the player's own standing", async () => {
    const a = await joinAs("Pato Veloz", "192.0.2.1");
    const b = await joinAs("Lina Turbo", "192.0.2.2");
    for (const [who, machine] of [
      [a.cookie, JUICE],
      [b.cookie, QUICK_JUICE],
    ] as const) {
      const { ticket: token } = await ticketAs(who, "bad-ideas-lab", "juice");
      await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: token, result: labClaim("juice", machine) }, cookie: who }));
    }
    const response = await boardGet(apiRequest("/api/leaderboards?game=bad-ideas-lab&level=juice&limit=5", { cookie: a.cookie }));
    const data = await body<LeaderboardResponse>(response);
    expect(data.board).toMatchObject({ id: "bad-ideas-lab/juice/v1", explain: expect.any(String), metrics: [{ label: "Peças" }, { label: "Tempo da bolinha" }] });
    expect(data.entries.map((e) => e.metrics)).toEqual([
      [1, 98],
      [1, 112],
    ]);
    expect(data.entries.map((e) => [e.nickname, e.you])).toEqual([
      ["Lina Turbo", false],
      ["Pato Veloz", true],
    ]);
    expect(data.entries[0]).not.toHaveProperty("playerId");
    expect(data.total).toBe(2);
    expect(data.you?.standing).toMatchObject({ position: 2, total: 2 });
    expect((await boardGet(apiRequest("/api/leaderboards?game=strange-house"))).status).toBe(400);
    expect((await boardGet(apiRequest("/api/leaderboards?game=bad-ideas-lab"))).status).toBe(404);
    expect((await boardGet(apiRequest("/api/leaderboards?game=bad-ideas-lab&level=attic"))).status).toBe(404);
  });

  it("moves the card and the copy of the progress to another device with the recovery code", async () => {
    const { cookie: original } = await joinAs();
    const created = await recoveryPost(apiRequest("/api/players/me/recovery", { method: "POST", body: {}, cookie: original }));
    expect(created.status).toBe(200);
    const { code, player } = await body<{ code: string; player: PublicPlayer }>(created);
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    expect(player.recoveryAt).toEqual(expect.any(String));
    const device = cookieFrom(created);
    expect(device).not.toBe(original);
    expect(created.headers.get("set-cookie")).toMatch(/HttpOnly/);
    expect(await body(await meGet(apiRequest("/api/players/me", { cookie: original })))).toEqual({ player: null });

    const snapshot = { version: 1, keys: { "canal404:progress:v1": JSON.stringify({ version: 1, visits: 3 }), "canal404:pajama-war:v1": '{"version":1}' } };
    expect((await copyPut(apiRequest("/api/players/me/copy", { method: "PUT", body: snapshot, cookie: device }))).status).toBe(200);

    const typed = code.toLowerCase().replaceAll("-", " ").replaceAll("0", "o").replaceAll("1", "l");
    const recovered = await recoverPost(apiRequest("/api/players/recover", { method: "POST", body: { code: typed } }));
    expect(recovered.status).toBe(200);
    const data = await body<{ player: PublicPlayer; copy: CloudCopy }>(recovered);
    expect(data.player.id).toBe(player.id);
    expect(data.copy.snapshot).toEqual(snapshot);
    expect(cookieFrom(recovered)).toBe(device);
    expect((await body<{ player: PublicPlayer }>(await meGet(apiRequest("/api/players/me", { cookie: device })))).player.id).toBe(player.id);

    const renewed = await recoveryPost(apiRequest("/api/players/me/recovery", { method: "POST", body: {}, cookie: device }));
    expect((await body<{ code: string }>(renewed)).code).not.toBe(code);
    expect(await body(await meGet(apiRequest("/api/players/me", { cookie: device })))).toEqual({ player: null });
    expect((await recoverPost(apiRequest("/api/players/recover", { method: "POST", body: { code } }))).status).toBe(404);
  });

  it("refuses wrong recovery codes, cross-site attempts and too many guesses from one address", async () => {
    const guess = (code: string, address = "198.51.100.20", headers: Record<string, string> = {}) =>
      recoverPost(apiRequest("/api/players/recover", { method: "POST", body: { code }, headers: { "x-forwarded-for": address, ...headers } }));
    expect((await guess("0000-0000-0000-0000", "198.51.100.21", { origin: "https://evil.example" })).status).toBe(403);
    const wrong = await guess("0000-0000-0000-0000");
    expect(wrong.status).toBe(404);
    expect(wrong.headers.get("set-cookie")).toBeNull();
    expect((await guess("abc")).status).toBe(404);
    for (let i = 2; i < LIMITS.recover.max; i += 1) await guess("0000-0000-0000-0000");
    expect((await guess("0000-0000-0000-0000")).status).toBe(429);
    expect((await guess("0000-0000-0000-0000", "198.51.100.22")).status).toBe(404);
    expect((await recoveryPost(apiRequest("/api/players/me/recovery", { method: "POST", body: {} }))).status).toBe(401);
  });

  it("limits how often one player reads the copy of the progress", async () => {
    const { cookie } = await joinAs("Pato Leitor", "203.0.113.40");
    const statuses: number[] = [];
    for (let i = 0; i <= LIMITS.cloudCopyRead.max; i += 1) statuses.push((await copyGet(apiRequest("/api/players/me/copy", { cookie }))).status);
    expect(statuses.slice(0, LIMITS.cloudCopyRead.max).every((s) => s === 200)).toBe(true);
    expect(statuses[LIMITS.cloudCopyRead.max]).toBe(429);
  });

  it("keeps the copy of the progress private, refuses the device's own keys and erases it with the player", async () => {
    const put = (cookie: string | undefined, keys: Record<string, string>, headers: Record<string, string> = {}) =>
      copyPut(apiRequest("/api/players/me/copy", { method: "PUT", body: { version: 1, keys }, cookie, headers }));
    const progress = { "canal404:progress:v1": '{"version":1}' };
    expect((await put(undefined, progress)).status).toBe(401);
    const { cookie: owner } = await joinAs("Pato Veloz", "203.0.113.30");
    const { cookie: other } = await joinAs("Lina Elétrica", "203.0.113.31");
    expect((await put(owner, progress, { origin: "https://evil.example" })).status).toBe(403);
    expect((await put(owner, { "canal404:outbox:v1": "{}" })).status).toBe(400);
    expect((await put(owner, { "canal404:progress:v1:backup:v0:1": "{}" })).status).toBe(400);
    expect((await put(owner, { "outro-site": "x" })).status).toBe(400);
    expect((await put(owner, { "canal404:progress:v1": "x".repeat(60_000) })).status).toBe(413);
    expect((await put(owner, progress)).status).toBe(200);
    expect((await body<{ copy: CloudCopy | null }>(await copyGet(apiRequest("/api/players/me/copy", { cookie: other })))).copy).toBeNull();
    expect((await body<{ copy: CloudCopy | null }>(await copyGet(apiRequest("/api/players/me/copy", { cookie: owner })))).copy?.snapshot.keys).toEqual(progress);
    await meDelete(apiRequest("/api/players/me", { method: "DELETE", cookie: owner }));
    expect(await db.playerSave.count()).toBe(0);
  });

  it("protects the cleanup job with the cron secret", async () => {
    expect((await cleanupGet(apiRequest("/api/cron/cleanup"))).status).toBe(401);
    expect((await cleanupGet(apiRequest("/api/cron/cleanup", { headers: { authorization: "Bearer wrong" } }))).status).toBe(401);
    const ok = await cleanupGet(apiRequest("/api/cron/cleanup", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }));
    expect(ok.status).toBe(200);
    expect((await body(ok)).removed).toMatchObject({ rateLimits: expect.any(Number) });
  });
});
