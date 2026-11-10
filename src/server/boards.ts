import type { PersonalBest, Run } from "@/generated/prisma/client";
import type { GameStats } from "@/games/types";
import type { BestView, BoardEntry, Leader, Standing } from "@/lib/competition/types";
import { metricValues, type GameSlug, type RankKey } from "@/lib/competition/boards";
import type { Db, Tx } from "./db";

export type { BestView, BoardEntry, Leader, Standing };

type BestRow = Pick<PersonalBest, "rank1" | "rank2" | "rank3" | "score" | "stars" | "achievedAt" | "runId">;

export function rankOf(row: Pick<PersonalBest, "rank1" | "rank2" | "rank3">): RankKey {
  return [row.rank1, row.rank2, row.rank3];
}

export function bestView(game: GameSlug, row: BestRow): BestView {
  return { score: row.score, stars: row.stars, metrics: metricValues(game, rankOf(row)), achievedAt: row.achievedAt.toISOString() };
}

const ORDER = [{ rank1: "desc" }, { rank2: "desc" }, { rank3: "desc" }, { achievedAt: "asc" }, { runId: "asc" }] as const;

export async function standing(db: Db | Tx, game: GameSlug, board: string, playerId: string): Promise<Standing | null> {
  const mine = await db.personalBest.findUnique({
    where: { playerId_board: { playerId, board } },
    include: { player: { select: { status: true } }, run: { select: { verification: true } } },
  });
  if (!mine) return null;
  const [r1, r2, r3] = rankOf(mine);
  const [ahead, visible] = await Promise.all([
    db.personalBest.count({
      where: {
        board,
        playerId: { not: playerId },
        player: { status: "active" },
        OR: [
          { rank1: { gt: r1 } },
          { rank1: r1, rank2: { gt: r2 } },
          { rank1: r1, rank2: r2, rank3: { gt: r3 } },
          { rank1: r1, rank2: r2, rank3: r3, achievedAt: { lt: mine.achievedAt } },
          { rank1: r1, rank2: r2, rank3: r3, achievedAt: mine.achievedAt, runId: { lt: mine.runId } },
        ],
      },
    }),
    db.personalBest.count({ where: { board, player: { status: "active" } } }),
  ]);
  const total = visible + (mine.player.status === "active" ? 0 : 1);
  return { position: ahead + 1, total, best: bestView(game, mine), verified: mine.run.verification === "replayed" };
}

export async function topOfBoard(db: Db | Tx, game: GameSlug, board: string, limit: number, playerId: string | null, offset = 0): Promise<{ entries: BoardEntry[]; total: number }> {
  const [rows, total] = await Promise.all([
    db.personalBest.findMany({
      where: { board, player: { status: "active" } },
      orderBy: [...ORDER],
      skip: offset,
      take: limit,
      include: { player: { select: { nickname: true, tag: true } }, run: { select: { verification: true } } },
    }),
    db.personalBest.count({ where: { board, player: { status: "active" } } }),
  ]);
  const entries = rows.map((row, i) => ({
    ...bestView(game, row),
    position: offset + i + 1,
    nickname: row.player.nickname,
    tag: row.player.tag,
    you: row.playerId === playerId,
    verified: row.run.verification === "replayed",
  }));
  return { entries, total };
}

export async function leaderOf(db: Db | Tx, game: GameSlug, board: string, playerId: string | null): Promise<Leader | null> {
  const { entries } = await topOfBoard(db, game, board, 1, playerId);
  const top = entries[0];
  return top ? { nickname: top.nickname, tag: top.tag, metrics: top.metrics, you: top.you } : null;
}

type LockedBest = { rank1: number; rank2: number; rank3: number; score: number; stars: number; achieved_at: Date; run_id: string };

export async function upsertBest(
  tx: Tx,
  input: { playerId: string; board: string; game: GameSlug; run: Pick<Run, "id" | "rank1" | "rank2" | "rank3" | "score" | "stars">; stats: GameStats; now: Date },
): Promise<{ improved: boolean; previous: BestView | null }> {
  const { playerId, board, game, run, stats, now } = input;
  const locked = await tx.$queryRaw<LockedBest[]>`
    SELECT rank1, rank2, rank3, score, stars, achieved_at, run_id FROM personal_bests
    WHERE player_id = ${playerId}::uuid AND board = ${board} FOR UPDATE`;
  const before = locked[0];
  const previous = before
    ? bestView(game, { rank1: before.rank1, rank2: before.rank2, rank3: before.rank3, score: before.score, stars: before.stars, achievedAt: before.achieved_at, runId: before.run_id })
    : null;
  const changed = await tx.$executeRaw`
    INSERT INTO personal_bests (player_id, board, run_id, rank1, rank2, rank3, score, stars, stats, achieved_at, updated_at)
    VALUES (${playerId}::uuid, ${board}, ${run.id}::uuid, ${run.rank1}, ${run.rank2}, ${run.rank3}, ${run.score}, ${run.stars}, ${JSON.stringify(stats)}::jsonb, ${now}, ${now})
    ON CONFLICT (player_id, board) DO UPDATE SET
      run_id = EXCLUDED.run_id, rank1 = EXCLUDED.rank1, rank2 = EXCLUDED.rank2, rank3 = EXCLUDED.rank3,
      score = EXCLUDED.score, stars = EXCLUDED.stars, stats = EXCLUDED.stats,
      achieved_at = EXCLUDED.achieved_at, updated_at = EXCLUDED.updated_at
    WHERE (EXCLUDED.rank1, EXCLUDED.rank2, EXCLUDED.rank3) > (personal_bests.rank1, personal_bests.rank2, personal_bests.rank3)`;
  return { improved: changed > 0, previous };
}
