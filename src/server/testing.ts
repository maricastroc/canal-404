import { LEVELS as LAB_LEVELS } from "@/games/bad-ideas-lab/levels";
import { boardId, type GameSlug, type RunClaim } from "@/lib/competition/rules";
import { getDb, type Db } from "./db";
import { hashToken, newTag, newToken } from "./identity";
import { issueTicket } from "./tickets";

export const TEST_SECRET = "test-secret-for-canal-404-competition-0123456789";

export const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

export function testDb(): Db {
  return getDb(process.env.TEST_DATABASE_URL!);
}

export async function resetDb(db: Db) {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "personal_bests", "runs", "player_achievements", "daily_challenges", "rate_limits", "players" RESTART IDENTITY CASCADE',
  );
}

export async function makePlayer(db: Db, nickname = "Pato Veloz", status: "active" | "hidden" | "banned" = "active") {
  const token = newToken();
  const player = await db.player.create({
    data: { tokenHash: hashToken(token), nickname, nicknameKey: nickname.toLowerCase().replace(/\s/g, ""), tag: newTag(), status },
  });
  return { player, token };
}

export function ticketFor(game: GameSlug, level: string | null, playerId: string | null, issuedAt: number) {
  return issueTicket(TEST_SECRET, { game, level, playerId, now: issuedAt });
}

export function boardOf(game: GameSlug, level: string | null) {
  return boardId(game, level);
}

export function labClaim(level: string, parts: { type: string; x: number; y: number; rot: number }[], steps: number, runs = 2): RunClaim {
  const def = LAB_LEVELS.find((l) => l.id === level)!;
  const total = Object.values(def.inventory).reduce((a, b) => a + (b ?? 0), 0);
  return {
    won: true,
    score: 1000 + (total - parts.length) * 150 + (runs === 1 ? 300 : 0),
    stars: parts.length <= def.par ? 3 : parts.length === def.par + 1 ? 2 : 1,
    stats: { parts: parts.length, inventory: total, par: def.par, runs, steps },
    replay: { kind: "lab-placements", version: 1, parts },
  };
}

export function streetClaim(score: { targetPoints: number; combos: number; mess: number; launches: number }, timeMs = 60_000): RunClaim {
  const ammoLeft = 7 - score.launches;
  const total = score.targetPoints + score.combos * 100 + 3 * 100 + score.mess * 25 + ammoLeft * 250;
  return {
    won: true,
    score: total,
    stars: total >= 2050 ? 3 : total >= 1500 ? 2 : 1,
    stats: { targets: 5, targetPoints: score.targetPoints, waves: 3, mess: score.mess, combos: score.combos, launches: score.launches, ammoLeft, timeMs },
  };
}

export function apiRequest(path: string, init: { method?: string; body?: unknown; cookie?: string; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { host: "localhost:4404", ...init.headers };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.cookie) headers.cookie = init.cookie;
  return new Request(`http://localhost:4404${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body),
  });
}

export function cookieFrom(response: Response) {
  const raw = response.headers.get("set-cookie");
  return raw ? raw.split(";")[0] : undefined;
}
