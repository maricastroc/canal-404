import type { Db } from "./db";

const DAY = 24 * 60 * 60 * 1000;

export const RETENTION = {
  rateLimitsDays: 2,
  rejectedRunsDays: 30,
  runsDays: 90,
  inactivePlayersDays: 730,
};

export async function cleanup(db: Db, now = new Date()) {
  const before = (days: number) => new Date(now.getTime() - days * DAY);
  const rateLimits = await db.rateLimit.deleteMany({ where: { windowStart: { lt: before(RETENTION.rateLimitsDays) } } });
  const rejectedRuns = await db.run.deleteMany({ where: { verification: "rejected", createdAt: { lt: before(RETENTION.rejectedRunsDays) } } });
  const oldRuns = await db.run.deleteMany({ where: { createdAt: { lt: before(RETENTION.runsDays) }, bests: { none: {} } } });
  const players = await db.player.deleteMany({ where: { lastSeenAt: { lt: before(RETENTION.inactivePlayersDays) } } });
  return { rateLimits: rateLimits.count, rejectedRuns: rejectedRuns.count, oldRuns: oldRuns.count, players: players.count };
}
