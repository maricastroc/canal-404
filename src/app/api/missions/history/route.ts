import { addressKey, HttpError, json } from "@/server/http";
import { currentPlayer } from "@/server/identity";
import { missionHistory } from "@/server/missions";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { missionHistorySchema } from "@/server/schemas";

export const dynamic = "force-dynamic";

export const GET = competitionRoute(async ({ request, db, secret, now }) => {
  const params = new URL(request.url).searchParams;
  const parsed = missionHistorySchema.safeParse({ before: params.get("before"), limit: params.get("limit") ?? undefined });
  if (!parsed.success) throw new HttpError("bad_request", "Pedido inválido.");
  await enforce(db, LIMITS.mission, addressKey(request, secret), now);
  const player = await currentPlayer(db, request, now);
  if (!player) return json({ entries: [], next: null });
  return json(await missionHistory(db, player, parsed.data));
});
