import type { Player, Run } from "@/generated/prisma/client";
import { boardId, judgeRun, RULES, type IneligibleReason, type RunClaim, type Verdict } from "@/lib/competition/rules";
import type { BestView, SubmitResponse } from "@/lib/competition/types";
import { bestView, standing } from "./boards";
import { isUniqueViolation, type Db } from "./db";
import { HttpError } from "./http";
import { LIMITS, consume, peek } from "./rate-limit";
import type { Ticket } from "./tickets";

export type SubmitOutcome = SubmitResponse;

const ELAPSED_SLACK_MS = 3000;
const ELAPSED_RATIO = 0.9;

export const REJECTION_TEXT: Record<string, string> = {
  unknown_level: "Essa fase não existe no canal.",
  bad_stats: "O resultado chegou incompleto.",
  inconsistent: "Os números dessa partida não fecham.",
  score_mismatch: "A pontuação não bate com o que aconteceu na partida.",
  bad_replay: "A máquina enviada não pode ser montada nessa fase.",
  too_fast: "Essa partida terminou rápido demais para ser verdade.",
};

function boardFor(ticket: Ticket, verdict: Extract<Verdict, { ok: true }>) {
  if (verdict.ineligible === "practice") return null;
  return boardId(ticket.game, ticket.level);
}

const INELIGIBLE_FLAG = "ineligible:";

function ineligibleOf(run: Run): IneligibleReason | undefined {
  const flag = run.flags.find((f) => f.startsWith(INELIGIBLE_FLAG));
  return flag ? (flag.slice(INELIGIBLE_FLAG.length) as IneligibleReason) : undefined;
}

async function outcomeOf(db: Db, run: Run, repeated: boolean): Promise<SubmitOutcome> {
  const game = run.game as Ticket["game"];
  const board = run.board ? await standing(db, game, run.board, run.playerId) : null;
  const isBest = board ? (await db.personalBest.findUnique({ where: { runId: run.id }, select: { runId: true } })) !== null : false;
  const ineligible = ineligibleOf(run);
  return {
    run: {
      id: run.id,
      verification: run.verification === "replayed" ? "replayed" : "checked",
      eligible: run.eligible,
      ...(ineligible ? { ineligible } : {}),
      score: run.score,
      stars: run.stars,
    },
    board: run.board
      ? board
        ? { ...board, id: run.board, improved: isBest, previous: null }
        : { id: run.board, improved: false, previous: null, position: null, total: await db.personalBest.count({ where: { board: run.board, player: { status: "active" } } }), best: null }
      : null,
    repeated,
  };
}

async function existing(db: Db, ticket: Ticket, player: Player) {
  const run = await db.run.findUnique({ where: { ticketId: ticket.id } });
  if (!run) return null;
  if (run.playerId !== player.id) throw new HttpError("conflict", "Esse resultado já foi enviado por outra pessoa.");
  if (run.verification === "rejected") {
    const reason = run.flags[0] ?? "inconsistent";
    throw new HttpError("rejected", REJECTION_TEXT[reason] ?? REJECTION_TEXT.inconsistent, { reason });
  }
  return outcomeOf(db, run, true);
}

async function recordRejection(db: Db, ticket: Ticket, player: Player, claim: RunClaim, reason: string, now: Date): Promise<never> {
  try {
    await db.run.create({
      data: {
        ticketId: ticket.id,
        playerId: player.id,
        game: ticket.game,
        level: ticket.level ?? "-",
        board: null,
        won: claim.won,
        score: Math.max(0, Math.min(claim.score, 2_000_000_000)),
        stars: Math.max(0, Math.min(claim.stars, 3)),
        stats: claim.stats,
        replay: claim.replay ?? undefined,
        rank1: 0,
        rank2: 0,
        rank3: 0,
        verification: "rejected",
        eligible: false,
        flags: [reason],
        rulesVersion: RULES[ticket.game].version,
        startedAt: new Date(ticket.issuedAt),
        createdAt: now,
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
  await consume(db, LIMITS.rejected, player.id, now);
  throw new HttpError("rejected", REJECTION_TEXT[reason] ?? REJECTION_TEXT.inconsistent, { reason });
}

export async function submitRun(db: Db, input: { player: Player; ticket: Ticket; claim: RunClaim; now: Date }): Promise<SubmitOutcome> {
  const { player, ticket, claim, now } = input;
  if (ticket.playerId && ticket.playerId !== player.id) throw new HttpError("wrong_player", "Esse ingresso é de outra pessoa.");
  const repeated = await existing(db, ticket, player);
  if (repeated) return repeated;
  if ((await peek(db, LIMITS.rejected, player.id, now)) >= LIMITS.rejected.max) {
    throw new HttpError("rate_limited", "O placar pausou seus envios por um tempo. Volte daqui a pouco.", { retryAfter: 3600 }, { "Retry-After": "3600" });
  }
  const verdict = judgeRun(ticket.game, ticket.level, claim);
  if (!verdict.ok) return recordRejection(db, ticket, player, claim, verdict.reason, now);
  const elapsed = now.getTime() - ticket.issuedAt;
  if (elapsed + ELAPSED_SLACK_MS < verdict.minElapsedMs * ELAPSED_RATIO) return recordRejection(db, ticket, player, claim, "too_fast", now);

  const board = boardFor(ticket, verdict);
  const flags = verdict.ineligible ? [`${INELIGIBLE_FLAG}${verdict.ineligible}`] : [];
  try {
    return await db.$transaction(async (tx) => {
      const run = await tx.run.create({
        data: {
          ticketId: ticket.id,
          playerId: player.id,
          game: ticket.game,
          level: ticket.level ?? "-",
          board,
          won: verdict.won,
          score: verdict.score,
          stars: verdict.stars,
          stats: claim.stats,
          replay: claim.replay ?? undefined,
          rank1: verdict.rank[0],
          rank2: verdict.rank[1],
          rank3: verdict.rank[2],
          verification: verdict.verification,
          eligible: verdict.eligible && board !== null,
          flags,
          rulesVersion: RULES[ticket.game].version,
          startedAt: new Date(ticket.issuedAt),
          createdAt: now,
        },
      });
      let previous: BestView | null = null;
      let improved = false;
      if (run.eligible && board) {
        const locked = await tx.$queryRaw<{ rank1: number; rank2: number; rank3: number; score: number; stars: number; achieved_at: Date; run_id: string }[]>`
          SELECT rank1, rank2, rank3, score, stars, achieved_at, run_id FROM personal_bests
          WHERE player_id = ${player.id}::uuid AND board = ${board} FOR UPDATE`;
        const before = locked[0];
        if (before) {
          previous = bestView(ticket.game, {
            rank1: before.rank1,
            rank2: before.rank2,
            rank3: before.rank3,
            score: before.score,
            stars: before.stars,
            achievedAt: before.achieved_at,
            runId: before.run_id,
          });
        }
        const changed = await tx.$executeRaw`
          INSERT INTO personal_bests (player_id, board, run_id, rank1, rank2, rank3, score, stars, stats, achieved_at, updated_at)
          VALUES (${player.id}::uuid, ${board}, ${run.id}::uuid, ${run.rank1}, ${run.rank2}, ${run.rank3}, ${run.score}, ${run.stars}, ${JSON.stringify(claim.stats)}::jsonb, ${now}, ${now})
          ON CONFLICT (player_id, board) DO UPDATE SET
            run_id = EXCLUDED.run_id, rank1 = EXCLUDED.rank1, rank2 = EXCLUDED.rank2, rank3 = EXCLUDED.rank3,
            score = EXCLUDED.score, stars = EXCLUDED.stars, stats = EXCLUDED.stats,
            achieved_at = EXCLUDED.achieved_at, updated_at = EXCLUDED.updated_at
          WHERE (EXCLUDED.rank1, EXCLUDED.rank2, EXCLUDED.rank3) > (personal_bests.rank1, personal_bests.rank2, personal_bests.rank3)`;
        improved = changed > 0;
      }
      const place = board ? await standing(tx, ticket.game, board, player.id) : null;
      return {
        run: {
          id: run.id,
          verification: verdict.verification,
          eligible: run.eligible,
          ...(verdict.ineligible ? { ineligible: verdict.ineligible } : {}),
          score: run.score,
          stars: run.stars,
        },
        board: board
          ? place
            ? { ...place, id: board, improved, previous }
            : { id: board, improved: false as const, previous: null, position: null, total: await tx.personalBest.count({ where: { board, player: { status: "active" } } }), best: null }
          : null,
        repeated: false,
      };
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const again = await existing(db, ticket, player);
    if (again) return again;
    throw error;
  }
}
