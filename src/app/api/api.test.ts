import type { PlacedPart } from "@/games/bad-ideas-lab/geometry";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ApiErrorBody, LeaderboardResponse, PublicPlayer } from "@/lib/competition/types";
import { closeDb, type Db } from "@/server/db";
import { LIMITS } from "@/server/rate-limit";
import { apiRequest, cookieFrom, hasTestDb, labClaim, resetDb, streetClaim, testDb } from "@/server/testing";
import { GET as cleanupGet } from "./cron/cleanup/route";
import { GET as boardGet } from "./leaderboards/route";
import { DELETE as meDelete, GET as meGet, PATCH as mePatch } from "./players/me/route";
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
    await closeDb();
    process.env.DATABASE_URL = "postgresql://nobody:nothing@127.0.0.1:1/none";
    expect(await body(await status())).toEqual({ status: "offline" });
    const response = await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "dead-end-street" } }));
    expect(response.status).toBe(503);
    expect(await body(response)).toEqual({ error: { code: "unavailable", message: expect.any(String) } });
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

  async function ticketAs(cookie: string | undefined, game = "dead-end-street", level: string | null = null) {
    const response = await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game, level }, cookie }));
    return body(response);
  }

  it("is online with a database", async () => {
    expect(await body(await status())).toEqual({ status: "online" });
  });

  it("joins with a nickname and an httpOnly cookie, with no personal data", async () => {
    const { response, cookie, data } = await joinAs("  Déco   Turbo ");
    expect(response.status).toBe(201);
    expect(data.player).toEqual({ id: expect.any(String), nickname: "Déco Turbo", tag: expect.stringMatching(/^\d{4}$/), createdAt: expect.any(String) });
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

  it("refuses bad nicknames with a friendly reason", async () => {
    const { response, data } = await joinAs("p0rr4");
    expect(response.status).toBe(422);
    expect(data.error).toMatchObject({ code: "bad_nickname", problem: "blocked" });
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

  it("issues tickets only for real games and levels", async () => {
    expect((await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "strange-house" } }))).status).toBe(400);
    expect((await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "bad-ideas-lab" } }))).status).toBe(400);
    expect((await ticket(apiRequest("/api/runs/tickets", { method: "POST", body: { game: "bad-ideas-lab", level: "attic" } }))).status).toBe(400);
    const issued = await ticketAs(undefined, "bad-ideas-lab", "pixel");
    expect(issued).toEqual({ ticket: expect.any(String), seed: expect.any(Number), expiresAt: expect.any(String) });
  });

  it("submits a run, answers with the board standing and accepts the retry", async () => {
    const { cookie } = await joinAs();
    const { ticket: token } = await ticketAs(cookie, "bad-ideas-lab", "juice");
    const payload = { ticket: token, result: labClaim("juice", JUICE) };
    const first = await submit(apiRequest("/api/runs", { method: "POST", body: payload, cookie }));
    expect(first.status).toBe(201);
    const data = await body(first);
    expect(data.run).toMatchObject({ verification: "replayed", eligible: true, score: 1150, stars: 3 });
    expect(data.board).toMatchObject({ id: "bad-ideas-lab/juice/v1", improved: true, position: 1, total: 1, best: { metrics: [1, 112] } });
    const retry = await submit(apiRequest("/api/runs", { method: "POST", body: payload, cookie }));
    expect(retry.status).toBe(200);
    expect((await body(retry)).repeated).toBe(true);
  });

  it("asks for a nickname before accepting a run, and keeps the ticket usable after joining", async () => {
    const { ticket: token } = await ticketAs(undefined);
    const payload = { ticket: token, result: streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 4 }, 2800) };
    const anonymous = await submit(apiRequest("/api/runs", { method: "POST", body: payload }));
    expect(anonymous.status).toBe(401);
    expect((await body<ApiErrorBody>(anonymous)).error.code).toBe("not_joined");
    const { cookie } = await joinAs();
    const accepted = await submit(apiRequest("/api/runs", { method: "POST", body: payload, cookie }));
    expect(accepted.status).toBe(201);
  });

  it("rejects forged tickets, malformed results and tampered scores", async () => {
    const { cookie } = await joinAs();
    const { ticket: token } = await ticketAs(cookie);
    const forged = await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: `${token}x`, result: streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 4 }, 2800) }, cookie }));
    expect(forged.status).toBe(400);
    const malformed = await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: token, result: { won: "yes" } }, cookie }));
    expect(malformed.status).toBe(400);
    const tampered = await submit(apiRequest("/api/runs", { method: "POST", body: { ticket: token, result: { ...streetClaim({ targetPoints: 900, combos: 1, mess: 4, launches: 4 }, 2800), score: 5000 } }, cookie }));
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
    expect(data.board).toMatchObject({ id: "bad-ideas-lab/juice/v1", explain: expect.any(String), metrics: [{ label: "Peças" }, { label: "Passos da máquina" }] });
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

  it("protects the cleanup job with the cron secret", async () => {
    expect((await cleanupGet(apiRequest("/api/cron/cleanup"))).status).toBe(401);
    expect((await cleanupGet(apiRequest("/api/cron/cleanup", { headers: { authorization: "Bearer wrong" } }))).status).toBe(401);
    const ok = await cleanupGet(apiRequest("/api/cron/cleanup", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }));
    expect(ok.status).toBe(200);
    expect((await body(ok)).removed).toMatchObject({ rateLimits: expect.any(Number) });
  });
});
