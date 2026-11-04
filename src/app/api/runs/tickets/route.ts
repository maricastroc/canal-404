import { hasLevel } from "@/lib/competition/rules";
import { addressKey, assertWritable, HttpError, json, readJson } from "@/server/http";
import { currentPlayer } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { missionFits, startMission, todayChallenge } from "@/server/missions";
import { competitionRoute } from "@/server/route";
import { ticketSchema } from "@/server/schemas";
import { issueTicket } from "@/server/tickets";

export const dynamic = "force-dynamic";

export const POST = competitionRoute(async ({ request, db, secret, now }) => {
  assertWritable(request);
  const parsed = ticketSchema.safeParse(await readJson(request, 512));
  if (!parsed.success) throw new HttpError("bad_request", "Pedido inválido.");
  const level = parsed.data.level ?? null;
  if (!hasLevel(parsed.data.game, level)) throw new HttpError("bad_request", "Essa fase não existe no canal.");
  await enforce(db, LIMITS.ticket, addressKey(request, secret), now);
  const player = await currentPlayer(db, request, now);
  const today = parsed.data.mission ? await todayChallenge(db, now) : null;
  const mission = today && today.id === parsed.data.mission && missionFits(today, parsed.data.game, level) ? today.id : null;
  if (mission && player) await startMission(db, player.id, mission, now);
  const issued = issueTicket(secret, { game: parsed.data.game, level, playerId: player?.id ?? null, now: now.getTime(), mission });
  return json({ ticket: issued.token, seed: issued.ticket.seed, expiresAt: new Date(issued.expiresAt).toISOString(), mission }, { status: 201 });
});
