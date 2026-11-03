import { addressKey, assertWritable, HttpError, json, readJson } from "@/server/http";
import { currentPlayer } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { submitRun } from "@/server/runs";
import { submitSchema } from "@/server/schemas";
import { readTicket } from "@/server/tickets";

export const dynamic = "force-dynamic";

export const POST = competitionRoute(async ({ request, db, secret, now }) => {
  assertWritable(request);
  const parsed = submitSchema.safeParse(await readJson(request, 16 * 1024));
  if (!parsed.success) throw new HttpError("bad_request", "Resultado em formato inválido.");
  const check = readTicket(secret, parsed.data.ticket, now.getTime());
  if (!check.ok) {
    if (check.problem === "expired") throw new HttpError("expired_ticket", "Esse resultado demorou demais para chegar ao placar.");
    throw new HttpError("bad_ticket", "Ingresso inválido.");
  }
  const player = await currentPlayer(db, request, now);
  if (!player) throw new HttpError("not_joined", "Escolha um apelido para entrar no placar.");
  await enforce(db, LIMITS.submitPlayer, player.id, now);
  await enforce(db, LIMITS.submitAddress, addressKey(request, secret), now);
  const outcome = await submitRun(db, { player, ticket: check.ticket, claim: parsed.data.result, now });
  return json(outcome, { status: outcome.repeated ? 200 : 201 });
});
