import type { Db } from "./db";
import { HttpError } from "./http";

export type Limit = { name: string; max: number; windowMs: number };

export const LIMITS = {
  join: { name: "join", max: 30, windowMs: 60 * 60 * 1000 },
  joinDaily: { name: "join-day", max: 120, windowMs: 24 * 60 * 60 * 1000 },
  rename: { name: "rename", max: 6, windowMs: 60 * 60 * 1000 },
  ticket: { name: "ticket", max: 1200, windowMs: 60 * 60 * 1000 },
  submitPlayer: { name: "submit", max: 90, windowMs: 60 * 60 * 1000 },
  submitAddress: { name: "submit-ip", max: 1200, windowMs: 60 * 60 * 1000 },
  rejected: { name: "rejected", max: 8, windowMs: 60 * 60 * 1000 },
  board: { name: "board", max: 3000, windowMs: 60 * 60 * 1000 },
} satisfies Record<string, Limit>;

export async function consume(db: Db, limit: Limit, subject: string, now = new Date()) {
  const start = new Date(Math.floor(now.getTime() / limit.windowMs) * limit.windowMs);
  const key = `${limit.name}:${subject}`.slice(0, 96);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, ${start}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`;
  const count = rows[0]?.count ?? 1;
  const retryAfter = Math.max(1, Math.ceil((start.getTime() + limit.windowMs - now.getTime()) / 1000));
  return { ok: count <= limit.max, count, retryAfter };
}

export async function enforce(db: Db, limit: Limit, subject: string, now = new Date()) {
  const result = await consume(db, limit, subject, now);
  if (!result.ok) {
    throw new HttpError("rate_limited", "Calma! Muitas tentativas seguidas. Espere um pouco.", { retryAfter: result.retryAfter }, { "Retry-After": String(result.retryAfter) });
  }
}

export async function peek(db: Db, limit: Limit, subject: string, now = new Date()) {
  const start = new Date(Math.floor(now.getTime() / limit.windowMs) * limit.windowMs);
  const row = await db.rateLimit.findUnique({ where: { key_windowStart: { key: `${limit.name}:${subject}`.slice(0, 96), windowStart: start } } });
  return row?.count ?? 0;
}
