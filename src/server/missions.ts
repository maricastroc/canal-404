import { z } from "zod";
import type { DailyChallenge, Player, Run } from "@/generated/prisma/client";
import type { GameStats } from "@/games/types";
import { isGameSlug, type GameSlug, type Verdict } from "@/lib/competition/rules";
import { acceptsResults, addDays, dayEnd, missionDay, MISSION_GRACE_MS } from "@/lib/missions/calendar";
import { checkGoal, isCondition, type Condition } from "@/lib/missions/goals";
import { missionSeed, pickMission } from "@/lib/missions/select";
import type { MissionBest, MissionHistoryItem, MissionHistoryResponse, MissionLeader, MissionOutcome, MissionProgress, MissionTodayResponse, MissionView, MissionYou } from "@/lib/missions/types";
import { bestView, leaderOf, standing, upsertBest } from "./boards";
import type { Db, Tx } from "./db";
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
  const outcome: MissionOutcome = { day, title: judgement.title, status: judgement.status, firstTime: false, shortfall: judgement.shortfall, best: null, improved: false };
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
  return {
    day: parsed.day,
    title: view.title,
    status: parsed.status,
    firstTime: entry?.completedRunId === run.id,
    shortfall: condition ? { condition, actual: actual === "none" || actual === undefined ? null : Number(actual) } : null,
    best,
    improved: false,
  };
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
  const row = await todayChallenge(db, now);
  const mission = viewOf(row);
  const board = missionBoard(mission.day);
  const [completions, leader, entry, best, progress] = await Promise.all([
    db.challengeEntry.count({ where: { challengeId: mission.day, completedAt: { not: null }, player: { status: "active" } } }),
    mission.ranked ? leaderOf(db, mission.game, board, player?.id ?? null) : null,
    player ? db.challengeEntry.findUnique({ where: { playerId_challengeId: { playerId: player.id, challengeId: mission.day } } }) : null,
    player && mission.ranked ? missionBestOf(db, mission.game, mission.day, player.id) : null,
    player ? progressOf(db, player.id, mission.day) : null,
  ]);
  return {
    now: now.toISOString(),
    mission,
    completions,
    leader: leader as MissionLeader | null,
    you: player && progress ? { ...youOf(entry, best), progress } : null,
  };
}

type Placement = { board: string; position: bigint | number; total: bigint | number };

export async function missionHistory(db: Db, player: Player, options: { before: string | null; limit: number }): Promise<MissionHistoryResponse> {
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
