import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameResult } from "@/games/types";
import { connect, flushOutbox, getCompetition, join, leave, pendingCount, requestTicket, resetCompetitionForTests, submitResult } from "./client";

type Route = (init: RequestInit | undefined) => { status: number; body?: unknown } | "network";

function serve(routes: Record<string, Route>) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input).split("?")[0];
    const method = init?.method ?? "GET";
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const route = routes[`${method} ${path}`];
    const answer = route ? route(init) : { status: 404, body: { error: { code: "not_found", message: "?" } } };
    if (answer === "network") throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(answer.body ?? {}), { status: answer.status, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

const PLAYER = { id: "p1", nickname: "Pato Veloz", tag: "0427", createdAt: "2026-11-03T12:00:00.000Z" };

const RESULT: GameResult = {
  won: true,
  score: 1900,
  stars: 2,
  breakdown: [],
  stats: { targets: 5, targetPoints: 900, waves: 3, mess: 4, combos: 1, launches: 5, ammoLeft: 2, timeMs: 70_000 },
};

const ACCEPTED = {
  run: { id: "r1", verification: "checked", eligible: true, score: 1900, stars: 2 },
  board: { id: "dead-end-street/all/v1", improved: true, previous: null, position: 1, total: 1, best: { score: 1900, stars: 2, metrics: [1900, 5], achievedAt: "2026-11-03T12:00:00.000Z" } },
  repeated: false,
};

describe("competition client", () => {
  beforeEach(() => {
    resetCompetitionForTests();
  });

  it("stops at the status check when the board is not configured", async () => {
    const calls = serve({ "GET /api/status": () => ({ status: 200, body: { status: "unconfigured" } }) });
    expect(await connect()).toEqual({ status: "unconfigured", player: null });
    expect(await requestTicket("dead-end-street", null)).toBeNull();
    expect(calls.map((c) => c.path)).toEqual(["/api/status"]);
  });

  it("goes offline when the status check cannot reach the server", async () => {
    serve({ "GET /api/status": () => "network" });
    expect((await connect()).status).toBe("offline");
    expect(await requestTicket("dead-end-street", null)).toBeNull();
  });

  it("knows the player when online", async () => {
    serve({
      "GET /api/status": () => ({ status: 200, body: { status: "online" } }),
      "GET /api/players/me": () => ({ status: 200, body: { player: PLAYER } }),
    });
    expect(await connect()).toEqual({ status: "online", player: PLAYER });
    expect(getCompetition().player?.nickname).toBe("Pato Veloz");
  });

  it("submits a finished run with its ticket and only the claim fields", async () => {
    const calls = serve({
      "GET /api/status": () => ({ status: 200, body: { status: "online" } }),
      "GET /api/players/me": () => ({ status: 200, body: { player: PLAYER } }),
      "POST /api/runs/tickets": () => ({ status: 201, body: { ticket: "t.sig", seed: 1, expiresAt: "x" } }),
      "POST /api/runs": () => ({ status: 201, body: ACCEPTED }),
    });
    await connect();
    const outcome = await submitResult(requestTicket("dead-end-street", null), { ...RESULT, summary: "texto", copy: { title: "a", text: "b" } });
    expect(outcome).toEqual({ kind: "accepted", response: ACCEPTED });
    const sent = calls.find((c) => c.path === "/api/runs")!.body as { ticket: string; result: Record<string, unknown> };
    expect(sent.ticket).toBe("t.sig");
    expect(Object.keys(sent.result).sort()).toEqual(["score", "stars", "stats", "won"]);
  });

  it("asks for a mission ticket only when the run is a mission, and reports what the channel granted", async () => {
    const calls = serve({
      "GET /api/status": () => ({ status: 200, body: { status: "online" } }),
      "GET /api/players/me": () => ({ status: 200, body: { player: PLAYER } }),
      "POST /api/runs/tickets": (init) => {
        const body = JSON.parse(String(init?.body)) as { mission?: string };
        return { status: 201, body: { ticket: "t.sig", seed: 1, expiresAt: "x", mission: body.mission === "2026-11-04" ? "2026-11-04" : null } };
      },
    });
    expect(await requestTicket("food-fight", null)).toEqual({ token: "t.sig", mission: null });
    expect(await requestTicket("food-fight", null, "2026-11-04")).toEqual({ token: "t.sig", mission: "2026-11-04" });
    expect(await requestTicket("food-fight", null, "2026-11-03")).toEqual({ token: "t.sig", mission: null });
    const bodies = calls.filter((c) => c.path === "/api/runs/tickets").map((c) => c.body);
    expect(bodies[0]).toEqual({ game: "food-fight", level: null });
    expect(bodies[1]).toEqual({ game: "food-fight", level: null, mission: "2026-11-04" });
  });

  it("asks for a nickname when nobody joined yet", async () => {
    serve({
      "GET /api/status": () => ({ status: 200, body: { status: "online" } }),
      "GET /api/players/me": () => ({ status: 200, body: { player: null } }),
      "POST /api/runs/tickets": () => ({ status: 201, body: { ticket: "t.sig", seed: 1, expiresAt: "x" } }),
    });
    await connect();
    expect(await submitResult(requestTicket("dead-end-street", null), RESULT)).toEqual({ kind: "not-joined" });
  });

  it("keeps the result in the outbox when the board drops, and sends it later", async () => {
    let up = false;
    serve({
      "GET /api/status": () => ({ status: 200, body: { status: "online" } }),
      "GET /api/players/me": () => ({ status: 200, body: { player: PLAYER } }),
      "POST /api/runs/tickets": () => ({ status: 201, body: { ticket: "t.sig", seed: 1, expiresAt: "x" } }),
      "POST /api/runs": () => (up ? { status: 201, body: ACCEPTED } : { status: 503, body: { error: { code: "unavailable", message: "fora" } } }),
    });
    await connect();
    expect(await submitResult(requestTicket("dead-end-street", null), RESULT)).toEqual({ kind: "queued" });
    expect(getCompetition().status).toBe("offline");
    expect(pendingCount()).toBe(1);
    up = true;
    expect(await flushOutbox()).toBe(1);
    expect(pendingCount()).toBe(0);
  });

  it("reports a run that started without a ticket as local only", async () => {
    serve({ "GET /api/status": () => "network" });
    await connect();
    expect(await submitResult(requestTicket("dead-end-street", null), RESULT)).toEqual({ kind: "unranked", why: "no-ticket" });
  });

  it("passes the server's reason when a result is rejected", async () => {
    serve({
      "GET /api/status": () => ({ status: 200, body: { status: "online" } }),
      "GET /api/players/me": () => ({ status: 200, body: { player: PLAYER } }),
      "POST /api/runs/tickets": () => ({ status: 201, body: { ticket: "t.sig", seed: 1, expiresAt: "x" } }),
      "POST /api/runs": () => ({ status: 422, body: { error: { code: "rejected", message: "A pontuação não bate.", reason: "score_mismatch" } } }),
    });
    await connect();
    expect(await submitResult(requestTicket("dead-end-street", null), RESULT)).toEqual({ kind: "rejected", message: "A pontuação não bate." });
  });

  it("joins, explains a refused nickname and leaves", async () => {
    serve({
      "POST /api/players": (init) =>
        JSON.parse(String(init?.body)).nickname === "Admin"
          ? { status: 422, body: { error: { code: "bad_nickname", message: "Esse apelido é da equipe do canal." } } }
          : { status: 201, body: { player: PLAYER } },
      "DELETE /api/players/me": () => ({ status: 200, body: { deleted: true } }),
    });
    expect(await join("Admin")).toEqual({ ok: false, message: "Esse apelido é da equipe do canal." });
    expect(await join("Pato Veloz")).toEqual({ ok: true, player: PLAYER });
    expect(getCompetition()).toEqual({ status: "online", player: PLAYER });
    expect(await leave()).toBe(true);
    expect(getCompetition().player).toBeNull();
  });
});
