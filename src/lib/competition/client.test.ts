import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameResult } from "@/games/types";
import { connect, flushOutbox, getCompetition, holdUntilJoined, join, pendingCount, requestTicket, resetCompetitionForTests, submitResult } from "./client";

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

  it("holds a result left without a nickname and sends it once the visitor joins", async () => {
    let joined = false;
    const calls = serve({
      "GET /api/status": () => ({ status: 200, body: { status: "online" } }),
      "GET /api/players/me": () => ({ status: 200, body: { player: joined ? PLAYER : null } }),
      "POST /api/runs/tickets": () => ({ status: 201, body: { ticket: "t.early", seed: 1, expiresAt: "x" } }),
      "POST /api/players": () => {
        joined = true;
        return { status: 201, body: { player: PLAYER } };
      },
      "POST /api/runs": () => (joined ? { status: 201, body: ACCEPTED } : { status: 401, body: { error: { code: "not_joined", message: "?" } } }),
    });
    await connect();
    await holdUntilJoined(requestTicket("pajama-war", "bedroom"), RESULT);
    await holdUntilJoined(Promise.resolve({ token: "t.early", mission: null }), RESULT);
    expect(pendingCount()).toBe(1);
    expect(await flushOutbox()).toBe(0);
    expect(pendingCount()).toBe(1);
    expect((await join("Pato Veloz")).ok).toBe(true);
    await vi.waitFor(() => expect(pendingCount()).toBe(0));
    const sent = calls.filter((c) => c.method === "POST" && c.path === "/api/runs").map((c) => (c.body as { ticket: string }).ticket);
    expect(sent).toEqual(["t.early", "t.early"]);
  });

  it("reports a run that started without a ticket as local only", async () => {
    serve({ "GET /api/status": () => "network" });
    await connect();
    expect(await submitResult(requestTicket("dead-end-street", null), RESULT)).toEqual({ kind: "unranked", why: "no-ticket" });
  });
});
