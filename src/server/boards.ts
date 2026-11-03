import type { PersonalBest } from "@/generated/prisma/client";
import type { BestView, BoardEntry, Standing } from "@/lib/competition/types";
import { metricValues, type GameSlug, type RankKey } from "@/lib/competition/boards";
import type { Db, Tx } from "./db";

export type { BestView, BoardEntry, Standing };

type BestRow = Pick<PersonalBest, "rank1" | "rank2" | "rank3" | "score" | "stars" | "achievedAt" | "runId">;

export function rankOf(row: Pick<PersonalBest, "rank1" | "rank2" | "rank3">): RankKey {
  return [row.rank1, row.rank2, row.rank3];
}

export function bestView(game: GameSlug, row: BestRow): BestView {
  return { score: row.score, stars: row.stars, metrics: metricValues(game, rankOf(row)), achievedAt: row.achievedAt.toISOString() };
}

const ORDER = [{ rank1: "desc" }, { rank2: "desc" }, { rank3: "desc" }, { achievedAt: "asc" }, { runId: "asc" }] as const;

export async function standing(db: Db | Tx, game: GameSlug, board: string, playerId: string): Promise<Standing | null> {
  const mine = await db.personalBest.findUnique({ where: { playerId_board: { playerId, board } }, include: { player: { select: { status: true } } } });
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
  return { position: ahead + 1, total, best: bestView(game, mine) };
}

export async function topOfBoard(db: Db, game: GameSlug, board: string, limit: number, playerId: string | null): Promise<{ entries: BoardEntry[]; total: number }> {
  const [rows, total] = await Promise.all([
    db.personalBest.findMany({
      where: { board, player: { status: "active" } },
      orderBy: [...ORDER],
      take: limit,
      include: { player: { select: { nickname: true, tag: true } } },
    }),
    db.personalBest.count({ where: { board, player: { status: "active" } } }),
  ]);
  const entries = rows.map((row, i) => ({
    ...bestView(game, row),
    position: i + 1,
    nickname: row.player.nickname,
    tag: row.player.tag,
    you: row.playerId === playerId,
  }));
  return { entries, total };
}
