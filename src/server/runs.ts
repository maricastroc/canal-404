import type { Player, Run } from "@/generated/prisma/client";
import { boardId, judgeRun, RULES, type IneligibleReason, type RunClaim, type Verdict } from "@/lib/competition/rules";
import type { BestView, SubmitResponse } from "@/lib/competition/types";
import { leaderOf, standing, upsertBest } from "./boards";
import { judgeMission, missionFlag, recordMission, storedMissionOutcome } from "./missions";
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
  replay_failed: "O laboratório do canal montou essa máquina e a bolinha não chegou lá.",
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
  const isBest = board && run.board ? (await db.personalBest.findFirst({ where: { runId: run.id, board: run.board }, select: { runId: true } })) !== null : false;
  const leader = run.board ? await leaderOf(db, game, run.board, run.playerId) : null;
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
        ? { ...board, id: run.board, improved: isBest, previous: null, leader }
        : { id: run.board, improved: false, previous: null, position: null, total: await db.personalBest.count({ where: { board: run.board, player: { status: "active" } } }), best: null, leader }
      : null,
    repeated,
    mission: await storedMissionOutcome(db, run),
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
  const mission = await judgeMission(db, ticket, verdict, now);
  const counted = mission && mission.status !== "late" ? mission : null;
  const flags = [...verdict.flags, ...(verdict.ineligible ? [`${INELIGIBLE_FLAG}${verdict.ineligible}`] : []), ...(mission ? [missionFlag(mission)] : [])];
  try {
    return await db.$transaction(async (tx) => {
      if (counted) await tx.$queryRaw`SELECT id FROM players WHERE id = ${player.id}::uuid FOR UPDATE`;
      const run = await tx.run.create({
        data: {
          ticketId: ticket.id,
          playerId: player.id,
          game: ticket.game,
          level: ticket.level ?? "-",
          board,
          challengeId: counted?.day ?? null,
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
      if (run.eligible && board) ({ improved, previous } = await upsertBest(tx, { playerId: player.id, board, game: ticket.game, run, stats: claim.stats, now }));
      const place = board ? await standing(tx, ticket.game, board, player.id) : null;
      const leader = board ? await leaderOf(tx, ticket.game, board, player.id) : null;
      const missionOutcome = mission ? await recordMission(tx, { judgement: mission, player, ticket, run, stats: claim.stats, now }) : null;
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
            ? { ...place, id: board, improved, previous, leader }
            : { id: board, improved: false as const, previous: null, position: null, total: await tx.personalBest.count({ where: { board, player: { status: "active" } } }), best: null, leader }
          : null,
        repeated: false,
        mission: missionOutcome,
      };
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const again = await existing(db, ticket, player);
    if (again) return again;
    throw error;
  }
}
