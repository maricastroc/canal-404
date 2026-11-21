import { browserLabel } from "@/server/browser";
import { addressKey, assertWritable, HttpError, json, OUTDATED_MESSAGE, readJson } from "@/server/http";
import { currentPlayer } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { submitRun } from "@/server/runs";
import { outdatedReplay, submitSchema } from "@/server/schemas";
import { readTicket } from "@/server/tickets";

export const dynamic = "force-dynamic";

export const POST = competitionRoute(async ({ request, db, secret, now }) => {
  assertWritable(request);
  const body = await readJson(request, 16 * 1024);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    if (outdatedReplay(body)) throw new HttpError("outdated", OUTDATED_MESSAGE);
    throw new HttpError("bad_request", "Resultado em formato inválido.");
  }
  const check = readTicket(secret, parsed.data.ticket, now.getTime());
  if (!check.ok) {
    if (check.problem === "expired") throw new HttpError("expired_ticket", "Esse resultado demorou demais para chegar ao placar.");
    throw new HttpError("bad_ticket", "Ingresso inválido.");
  }
  const player = await currentPlayer(db, request, now);
  if (!player) throw new HttpError("not_joined", "Escolha um apelido para entrar no placar.");
  await enforce(db, LIMITS.submitPlayer, player.id, now);
  await enforce(db, LIMITS.submitAddress, addressKey(request, secret), now);
  const outcome = await submitRun(db, { player, ticket: check.ticket, claim: parsed.data.result, now, client: browserLabel(request.headers.get("user-agent")) });
  return json(outcome, { status: outcome.repeated ? 200 : 201 });
});
