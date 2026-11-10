import { z } from "zod";
import type { DailyChallenge, Player, Run } from "@/generated/prisma/client";
import type { GameStats } from "@/games/types";
import { isGameSlug, type GameSlug, type Verdict } from "@/lib/competition/rules";
import { CHAMPION_MIN_PLAYERS, earnedOnCompletion, isMissionAchievement, type MissionAchievementId } from "@/lib/missions/achievements";
import { acceptsResults, addDays, dayEnd, missionDay, MISSION_GRACE_MS } from "@/lib/missions/calendar";
import { checkGoal, isCondition, type Condition } from "@/lib/missions/goals";
import { missionSeed, pickMission } from "@/lib/missions/select";
import type {
  MissionBest,
  MissionBoardResponse,
  MissionHistoryItem,
  MissionHistoryResponse,
  MissionLeader,
  MissionOutcome,
  MissionProgress,
  MissionTodayResponse,
  MissionView,
  MissionYou,
  RecentDay,
  UnlockedAchievement,
} from "@/lib/missions/types";
import { bestView, leaderOf, standing, topOfBoard, upsertBest } from "./boards";
import type { Db, Tx } from "./db";
import { HttpError } from "./http";
import type { Ticket } from "./tickets";

const snapshotSchema = z.object({
  title: z.string().min(1).max(64),
  objective: z.string().min(1).max(240),
  goal: z.array(z.custom<Condition>(isCondition)).min(1).max(8),
  ranked: z.boolean(),
});

type Snapshot = z.infer<typeof snapshotSchema>;

const MISSION_FLAG = "mission:";

export function missionBoard(day: string) {
  return `mission/${day}`;
}

function snapshotOf(row: DailyChallenge): Snapshot {
  return snapshotSchema.parse(row.variant);
}

export function viewOf(row: DailyChallenge): MissionView {
  const snapshot = snapshotOf(row);
  if (!isGameSlug(row.game)) throw new Error(`unknown mission game ${row.game}`);
  const end = dayEnd(row.id).getTime();
  return {
    day: row.id,
    key: row.key,
    version: row.rulesVersion,
    game: row.game,
    level: row.level === "-" ? null : row.level,
    title: snapshot.title,
    objective: snapshot.objective,
    goal: snapshot.goal,
    ranked: snapshot.ranked,
    endsAt: new Date(end).toISOString(),
    closesAt: new Date(end + MISSION_GRACE_MS).toISOString(),
  };
}

export async function ensureChallenge(db: Db | Tx, day: string): Promise<DailyChallenge> {
  const found = await db.dailyChallenge.findUnique({ where: { id: day } });
  if (found) return found;
  const yesterday = await db.dailyChallenge.findUnique({ where: { id: addDays(day, -1) }, select: { key: true } });
  const def = pickMission(day, yesterday?.key ?? null);
  const variant: Snapshot = { title: def.title, objective: def.objective, goal: def.goal, ranked: def.ranked };
  await db.dailyChallenge.createMany({
    data: [{ id: day, key: def.key, game: def.game, level: def.level ?? "-", seed: missionSeed(day), variant, rulesVersion: def.version }],
    skipDuplicates: true,
  });
  return db.dailyChallenge.findUniqueOrThrow({ where: { id: day } });
}

export async function todayChallenge(db: Db | Tx, now: Date) {
  return ensureChallenge(db, missionDay(now));
}

export function missionFits(row: DailyChallenge, game: GameSlug, level: string | null) {
  return row.game === game && row.level === (level ?? "-");
}

export async function startMission(db: Db, playerId: string, day: string, now: Date) {
  await db.challengeEntry.createMany({ data: [{ playerId, challengeId: day, startedAt: now }], skipDuplicates: true });
}

export type MissionJudgement = {
  day: string;
  title: string;
  ranked: boolean;
  status: MissionOutcome["status"];
  shortfall: MissionOutcome["shortfall"];
};

export async function judgeMission(db: Db, ticket: Ticket, verdict: Extract<Verdict, { ok: true }>, now: Date): Promise<MissionJudgement | null> {
  if (!ticket.mission) return null;
  const row = await db.dailyChallenge.findUnique({ where: { id: ticket.mission } });
  if (!row || !missionFits(row, ticket.game, ticket.level)) return null;
  const snapshot = snapshotOf(row);
  const base = { day: row.id, title: snapshot.title, ranked: snapshot.ranked };
  if (!acceptsResults(row.id, now) || missionDay(new Date(ticket.issuedAt)) !== row.id) return { ...base, status: "late", shortfall: null };
  const check = checkGoal(snapshot.goal, verdict.evidence);
  if (check.passed) return { ...base, status: "completed", shortfall: null };
  return { ...base, status: "missed", shortfall: { condition: check.condition, actual: check.actual } };
}

export function missionFlag(judgement: MissionJudgement) {
  const tail = judgement.shortfall ? `:${judgement.shortfall.condition.stat}:${judgement.shortfall.actual ?? "none"}` : "";
  return `${MISSION_FLAG}${judgement.day}:${judgement.status}${tail}`;
}

function parseFlag(flags: string[]) {
  const flag = flags.find((f) => f.startsWith(MISSION_FLAG));
  if (!flag) return null;
  const [, day, status] = flag.split(":");
  if (status !== "completed" && status !== "missed" && status !== "late") return null;
  return { day, status } as const;
}

async function missionBestOf(db: Db | Tx, game: GameSlug, day: string, playerId: string): Promise<MissionBest | null> {
  const place = await standing(db, game, missionBoard(day), playerId);
  return place ? { score: place.best.score, metrics: place.best.metrics, position: place.position, total: place.total, achievedAt: place.best.achievedAt } : null;
}

export async function recordMission(
  tx: Tx,
  input: { judgement: MissionJudgement; player: Player; ticket: Ticket; run: Run; stats: GameStats; now: Date },
): Promise<MissionOutcome> {
  const { judgement, player, ticket, run, stats, now } = input;
  const { day } = judgement;
  const outcome: MissionOutcome = { day, title: judgement.title, status: judgement.status, firstTime: false, shortfall: judgement.shortfall, best: null, improved: false, achievements: [] };
  if (judgement.status === "late") return outcome;
  await tx.$queryRaw`SELECT id FROM players WHERE id = ${player.id}::uuid FOR UPDATE`;
  const entry = await tx.challengeEntry.findUnique({ where: { playerId_challengeId: { playerId: player.id, challengeId: day } } });
  const passed = judgement.status === "completed";
  const firstTime = passed && !entry?.completedAt;
  if (entry) {
    await tx.challengeEntry.update({
      where: { playerId_challengeId: { playerId: player.id, challengeId: day } },
      data: { attempts: { increment: 1 }, lastPlayedAt: now, ...(firstTime ? { completedAt: now, completedRunId: run.id } : {}) },
    });
  } else {
    await tx.challengeEntry.create({
      data: { playerId: player.id, challengeId: day, startedAt: new Date(ticket.issuedAt), lastPlayedAt: now, attempts: 1, ...(passed ? { completedAt: now, completedRunId: run.id } : {}) },
    });
  }
  outcome.firstTime = firstTime;
  if (firstTime) {
    const done = await tx.challengeEntry.findMany({ where: { playerId: player.id, completedAt: { not: null } }, select: { challengeId: true } });
    outcome.achievements = await grantAchievements(
      tx,
      player.id,
      earnedOnCompletion(
        done.map((d) => d.challengeId),
        day,
      ),
      run.id,
      now,
    );
  }
  if (passed && judgement.ranked) {
    const { improved } = await upsertBest(tx, { playerId: player.id, board: missionBoard(day), game: ticket.game, run, stats, now });
    outcome.improved = improved;
  }
  if (judgement.ranked) outcome.best = await missionBestOf(tx, ticket.game, day, player.id);
  return outcome;
}

export async function storedMissionOutcome(db: Db, run: Run): Promise<MissionOutcome | null> {
  const parsed = parseFlag(run.flags);
  if (!parsed) return null;
  const row = await db.dailyChallenge.findUnique({ where: { id: parsed.day } });
  if (!row) return null;
  const view = viewOf(row);
  const flag = run.flags.find((f) => f.startsWith(MISSION_FLAG))!;
  const [, , , stat, actual] = flag.split(":");
  const condition = parsed.status === "missed" ? view.goal.find((c) => c.stat === stat) : undefined;
  const entry = parsed.status === "late" ? null : await db.challengeEntry.findUnique({ where: { playerId_challengeId: { playerId: run.playerId, challengeId: parsed.day } } });
  const best = view.ranked && parsed.status !== "late" ? await missionBestOf(db, view.game, parsed.day, run.playerId) : null;
  const unlocked =
    parsed.status === "completed"
      ? await db.playerAchievement.findMany({ where: { playerId: run.playerId, runId: run.id, achievement: { not: "mission-champion" } }, select: { achievement: true } })
      : [];
  return {
    day: parsed.day,
    title: view.title,
    status: parsed.status,
    firstTime: entry?.completedRunId === run.id,
    shortfall: condition ? { condition, actual: actual === "none" || actual === undefined ? null : Number(actual) } : null,
    best,
    improved: false,
    achievements: unlocked.map((a) => a.achievement).filter(isMissionAchievement),
  };
}

async function grantAchievements(tx: Tx, playerId: string, ids: MissionAchievementId[], runId: string | null, at: Date): Promise<MissionAchievementId[]> {
  if (!ids.length) return [];
  const rows = await tx.$queryRaw<{ achievement: string }[]>`
    INSERT INTO player_achievements (player_id, achievement, source, run_id, unlocked_at)
    SELECT ${playerId}::uuid, a, 'verified'::"AchievementSource", ${runId}::uuid, ${at}
    FROM unnest(${ids}::text[]) AS a
    ON CONFLICT DO NOTHING
    RETURNING achievement`;
  return ids.filter((id) => rows.some((r) => r.achievement === id));
}

const SETTLE_BATCH = 31;

export function closesAt(day: string) {
  return new Date(dayEnd(day).getTime() + MISSION_GRACE_MS);
}

export async function settleDay(db: Db, day: string, now: Date) {
  return db.$transaction(async (tx) => {
    const claimed = await tx.$executeRaw`UPDATE daily_challenges SET settled_at = ${now} WHERE id = ${day} AND settled_at IS NULL`;
    if (!claimed) return false;
    const row = await tx.dailyChallenge.findUniqueOrThrow({ where: { id: day } });
    if (!snapshotOf(row).ranked) return true;
    const board = missionBoard(day);
    await tx.$executeRaw`
      UPDATE challenge_entries e SET final_position = r.position, final_total = r.total
      FROM (
        SELECT pb.player_id,
          ROW_NUMBER() OVER (ORDER BY pb.rank1 DESC, pb.rank2 DESC, pb.rank3 DESC, pb.achieved_at ASC, pb.run_id ASC)::int AS position,
          COUNT(*) OVER ()::int AS total
        FROM personal_bests pb JOIN players p ON p.id = pb.player_id
        WHERE pb.board = ${board} AND p.status = 'active'
      ) r
      WHERE e.player_id = r.player_id AND e.challenge_id = ${day}`;
    await tx.$executeRaw`
      INSERT INTO player_achievements (player_id, achievement, source, run_id, unlocked_at)
      SELECT e.player_id, 'mission-champion', 'verified'::"AchievementSource", pb.run_id, ${closesAt(day)}
      FROM challenge_entries e JOIN personal_bests pb ON pb.player_id = e.player_id AND pb.board = ${board}
      WHERE e.challenge_id = ${day} AND e.final_position = 1 AND e.final_total >= ${CHAMPION_MIN_PLAYERS}
      ON CONFLICT DO NOTHING`;
    return true;
  });
}

export async function settleClosedDays(db: Db, now: Date) {
  const cutoff = missionDay(new Date(now.getTime() - MISSION_GRACE_MS));
  const open = await db.dailyChallenge.findMany({ where: { settledAt: null, id: { lt: cutoff } }, select: { id: true }, orderBy: { id: "asc" }, take: SETTLE_BATCH });
  let settled = 0;
  for (const { id } of open) if (await settleDay(db, id, now)) settled += 1;
  return settled;
}

export async function achievementsOf(db: Db, playerId: string): Promise<UnlockedAchievement[]> {
  const rows = await db.playerAchievement.findMany({ where: { playerId, achievement: { startsWith: "mission-" } }, orderBy: { unlockedAt: "asc" } });
  const runIds = rows.map((r) => r.runId).filter((id): id is string => Boolean(id));
  const runs = runIds.length ? await db.run.findMany({ where: { id: { in: runIds } }, select: { id: true, challengeId: true } }) : [];
  return rows.flatMap((row) =>
    isMissionAchievement(row.achievement)
      ? [{ id: row.achievement, unlockedAt: row.unlockedAt.toISOString(), day: runs.find((r) => r.id === row.runId)?.challengeId ?? null }]
      : [],
  );
}

const RECENT_DAYS = 14;

async function recentOf(db: Db, playerId: string, today: string): Promise<RecentDay[]> {
  const since = addDays(today, -(RECENT_DAYS - 1));
  const rows = await db.challengeEntry.findMany({ where: { playerId, challengeId: { gte: since } }, select: { challengeId: true, completedAt: true } });
  return Array.from({ length: RECENT_DAYS }, (_, i) => {
    const day = addDays(since, i);
    const entry = rows.find((r) => r.challengeId === day);
    return { day, state: entry ? (entry.completedAt ? "completed" : "started") : "none" };
  });
}

function youOf(entry: { attempts: number; startedAt: Date; completedAt: Date | null } | null, best: MissionBest | null): MissionYou {
  if (!entry) return { state: "new", attempts: 0, startedAt: null, completedAt: null, best: null };
  return {
    state: entry.completedAt ? "completed" : "started",
    attempts: entry.attempts,
    startedAt: entry.startedAt.toISOString(),
    completedAt: entry.completedAt?.toISOString() ?? null,
    best,
  };
}

export function progressFrom(days: string[], today: string): MissionProgress {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    run = i > 0 && addDays(sorted[i - 1], 1) === sorted[i] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const last = sorted[sorted.length - 1] ?? null;
  const alive = last === today || last === addDays(today, -1);
  return { days: sorted.length, streak: alive ? run : 0, bestStreak: best, lastDay: last };
}

async function progressOf(db: Db, playerId: string, today: string) {
  const rows = await db.challengeEntry.findMany({ where: { playerId, completedAt: { not: null } }, select: { challengeId: true } });
  return progressFrom(
    rows.map((r) => r.challengeId),
    today,
  );
}

export async function missionToday(db: Db, player: Player | null, now: Date): Promise<MissionTodayResponse> {
  await settleClosedDays(db, now);
  const row = await todayChallenge(db, now);
  const mission = viewOf(row);
  const board = missionBoard(mission.day);
  const [completions, leader, entry, best, progress, achievements, championDays, recent] = await Promise.all([
    db.challengeEntry.count({ where: { challengeId: mission.day, completedAt: { not: null }, player: { status: "active" } } }),
    mission.ranked ? leaderOf(db, mission.game, board, player?.id ?? null) : null,
    player ? db.challengeEntry.findUnique({ where: { playerId_challengeId: { playerId: player.id, challengeId: mission.day } } }) : null,
    player && mission.ranked ? missionBestOf(db, mission.game, mission.day, player.id) : null,
    player ? progressOf(db, player.id, mission.day) : null,
    player ? achievementsOf(db, player.id) : [],
    player ? db.challengeEntry.count({ where: { playerId: player.id, finalPosition: 1, finalTotal: { gte: CHAMPION_MIN_PLAYERS } } }) : 0,
    player ? recentOf(db, player.id, mission.day) : [],
  ]);
  return {
    now: now.toISOString(),
    mission,
    completions,
    leader: leader as MissionLeader | null,
    you: player && progress ? { ...youOf(entry, best), progress, achievements, championDays, recent } : null,
  };
}

const BOARD_PAGE = 10;

export async function missionBoardPage(db: Db, player: Player | null, options: { day: string | null; page: number }, now: Date): Promise<MissionBoardResponse> {
  await settleClosedDays(db, now);
  const today = missionDay(now);
  const day = options.day ?? today;
  if (day > today) throw new HttpError("not_found", "Essa missão ainda não foi ao ar.");
  const row = day === today ? await ensureChallenge(db, day) : await db.dailyChallenge.findUnique({ where: { id: day } });
  if (!row) throw new HttpError("not_found", "Não teve Missão 404 nesse dia.");
  const mission = viewOf(row);
  const board = missionBoard(day);
  const [top, mine, previous, next] = await Promise.all([
    mission.ranked ? topOfBoard(db, mission.game, board, BOARD_PAGE, player?.id ?? null, (options.page - 1) * BOARD_PAGE) : { entries: [], total: 0 },
    player && mission.ranked ? standing(db, mission.game, board, player.id) : null,
    db.dailyChallenge.findFirst({ where: { id: { lt: day } }, orderBy: { id: "desc" }, select: { id: true } }),
    db.dailyChallenge.findFirst({ where: { id: { gt: day, lte: today } }, orderBy: { id: "asc" }, select: { id: true } }),
  ]);
  return {
    mission,
    closed: now.getTime() > closesAt(day).getTime(),
    entries: top.entries.map((e) => ({ position: e.position, nickname: e.nickname, tag: e.tag, you: e.you, metrics: e.metrics, score: e.score })),
    total: top.total,
    page: options.page,
    pages: Math.max(1, Math.ceil(top.total / BOARD_PAGE)),
    you: player && mine ? { nickname: player.nickname, tag: player.tag, position: mine.position, total: mine.total, metrics: mine.best.metrics } : null,
    previousDay: previous?.id ?? null,
    nextDay: next?.id ?? null,
  };
}

type Placement = { board: string; position: bigint | number; total: bigint | number };

export async function missionHistory(db: Db, player: Player, options: { before: string | null; limit: number }, now = new Date()): Promise<MissionHistoryResponse> {
  await settleClosedDays(db, now);
  const rows = await db.challengeEntry.findMany({
    where: { playerId: player.id, ...(options.before ? { challengeId: { lt: options.before } } : {}) },
    orderBy: { challengeId: "desc" },
    take: options.limit + 1,
    include: { challenge: true },
  });
  const page = rows.slice(0, options.limit);
  const boards = page.map((r) => missionBoard(r.challengeId));
  const [bests, places] = boards.length
    ? await Promise.all([
        db.personalBest.findMany({ where: { playerId: player.id, board: { in: boards } } }),
        db.$queryRaw<Placement[]>`
          SELECT board, position, total FROM (
            SELECT pb.board, pb.player_id,
              ROW_NUMBER() OVER (PARTITION BY pb.board ORDER BY pb.rank1 DESC, pb.rank2 DESC, pb.rank3 DESC, pb.achieved_at ASC, pb.run_id ASC) AS position,
              COUNT(*) OVER (PARTITION BY pb.board) AS total
            FROM personal_bests pb JOIN players p ON p.id = pb.player_id
            WHERE pb.board = ANY(${boards}) AND (p.status = 'active' OR pb.player_id = ${player.id}::uuid)
          ) ranked WHERE player_id = ${player.id}::uuid`,
      ])
    : [[], []];
  const entries: MissionHistoryItem[] = page.map((row) => {
    const mission = viewOf(row.challenge);
    const board = missionBoard(row.challengeId);
    const pb = bests.find((b) => b.board === board);
    const place = places.find((p) => p.board === board);
    const best = pb && place ? { ...bestView(mission.game, pb), position: Number(place.position), total: Number(place.total) } : null;
    return { mission, you: youOf(row, best ? { score: best.score, metrics: best.metrics, position: best.position, total: best.total, achievedAt: best.achievedAt } : null) };
  });
  return { entries, next: rows.length > options.limit ? page[page.length - 1].challengeId : null };
}
