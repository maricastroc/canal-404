import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { hasLevel, isGameSlug, type GameSlug } from "@/lib/competition/rules";
import { isDayKey } from "@/lib/missions/calendar";

export const TICKET_TTL_MS = 12 * 60 * 60 * 1000;

export type Ticket = {
  id: string;
  game: GameSlug;
  level: string | null;
  seed: number;
  issuedAt: number;
  playerId: string | null;
  mission: string | null;
};

type Wire = { v: 1; id: string; g: string; l: string | null; s: number; t: number; p: string | null; m?: string };

function sign(secret: string, body: string) {
  return createHmac("sha256", secret).update(`ticket:${body}`).digest("base64url");
}

export function issueTicket(secret: string, input: { game: GameSlug; level: string | null; playerId: string | null; now?: number; mission?: string | null }) {
  const ticket: Ticket = {
    id: randomUUID(),
    game: input.game,
    level: input.level,
    seed: randomInt(0, 2 ** 31 - 1),
    issuedAt: input.now ?? Date.now(),
    playerId: input.playerId,
    mission: input.mission ?? null,
  };
  const wire: Wire = { v: 1, id: ticket.id, g: ticket.game, l: ticket.level, s: ticket.seed, t: ticket.issuedAt, p: ticket.playerId, ...(ticket.mission ? { m: ticket.mission } : {}) };
  const body = Buffer.from(JSON.stringify(wire)).toString("base64url");
  return { ticket, token: `${body}.${sign(secret, body)}`, expiresAt: ticket.issuedAt + TICKET_TTL_MS };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type TicketCheck = { ok: true; ticket: Ticket } | { ok: false; problem: "invalid" | "expired" };

export function readTicket(secret: string, token: unknown, now = Date.now()): TicketCheck {
  if (typeof token !== "string" || token.length > 1024) return { ok: false, problem: "invalid" };
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length) return { ok: false, problem: "invalid" };
  const expected = Buffer.from(sign(secret, body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, problem: "invalid" };
  let wire: Wire;
  try {
    wire = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Wire;
  } catch {
    return { ok: false, problem: "invalid" };
  }
  if (wire?.v !== 1 || typeof wire.id !== "string" || !UUID.test(wire.id) || !isGameSlug(wire.g)) return { ok: false, problem: "invalid" };
  const level = typeof wire.l === "string" ? wire.l : null;
  if (!hasLevel(wire.g, level) || !Number.isInteger(wire.s) || !Number.isInteger(wire.t)) return { ok: false, problem: "invalid" };
  if (wire.p !== null && (typeof wire.p !== "string" || !UUID.test(wire.p))) return { ok: false, problem: "invalid" };
  if (wire.m !== undefined && !isDayKey(wire.m)) return { ok: false, problem: "invalid" };
  if (wire.t > now + 60_000 || now - wire.t > TICKET_TTL_MS) return { ok: false, problem: "expired" };
  return { ok: true, ticket: { id: wire.id, game: wire.g, level, seed: wire.s, issuedAt: wire.t, playerId: wire.p, mission: wire.m ?? null } };
}
