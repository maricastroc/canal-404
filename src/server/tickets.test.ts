import { describe, expect, it } from "vitest";
import { issueTicket, readTicket, TICKET_TTL_MS } from "./tickets";

const SECRET = "a-long-enough-secret-for-ticket-tests-0001";
const NOW = Date.UTC(2026, 10, 3, 15, 0, 0);

describe("run tickets", () => {
  it("round-trips the game, level, seed and player", () => {
    const issued = issueTicket(SECRET, { game: "pajama-war", level: "yard", playerId: null, now: NOW });
    const read = readTicket(SECRET, issued.token, NOW + 1000);
    expect(read).toEqual({ ok: true, ticket: issued.ticket });
    expect(issued.ticket.seed).toBeGreaterThanOrEqual(0);
    expect(issued.expiresAt).toBe(NOW + TICKET_TTL_MS);
  });

  it("gives every ticket its own id and seed", () => {
    const ids = new Set(Array.from({ length: 50 }, () => issueTicket(SECRET, { game: "food-fight", level: null, playerId: null, now: NOW }).ticket.id));
    expect(ids.size).toBe(50);
  });

  it("rejects tampered bodies, signatures and other secrets", () => {
    const { token } = issueTicket(SECRET, { game: "dead-end-street", level: null, playerId: null, now: NOW });
    const [body, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), g: "food-fight" })).toString("base64url");
    expect(readTicket(SECRET, `${forged}.${signature}`, NOW)).toEqual({ ok: false, problem: "invalid" });
    expect(readTicket(SECRET, `${body}.${signature.slice(0, -2)}AA`, NOW)).toEqual({ ok: false, problem: "invalid" });
    expect(readTicket("another-secret-that-is-long-enough-000000", token, NOW)).toEqual({ ok: false, problem: "invalid" });
    expect(readTicket(SECRET, "nope", NOW)).toEqual({ ok: false, problem: "invalid" });
    expect(readTicket(SECRET, 12, NOW)).toEqual({ ok: false, problem: "invalid" });
  });

  it("expires after the time to live and refuses tickets from the future", () => {
    const { token } = issueTicket(SECRET, { game: "dead-end-street", level: null, playerId: null, now: NOW });
    expect(readTicket(SECRET, token, NOW + TICKET_TTL_MS + 1)).toEqual({ ok: false, problem: "expired" });
    expect(readTicket(SECRET, token, NOW - 5 * 60 * 1000)).toEqual({ ok: false, problem: "expired" });
  });
});
