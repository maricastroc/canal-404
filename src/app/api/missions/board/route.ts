import { addressKey, HttpError, json } from "@/server/http";
import { currentPlayer } from "@/server/identity";
import { missionBoardPage } from "@/server/missions";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { missionBoardSchema } from "@/server/schemas";

export const dynamic = "force-dynamic";

export const GET = competitionRoute(async ({ request, db, secret, now }) => {
  const params = new URL(request.url).searchParams;
  const parsed = missionBoardSchema.safeParse({ day: params.get("day"), page: params.get("page") ?? undefined });
  if (!parsed.success) throw new HttpError("bad_request", "Placar inválido.");
  await enforce(db, LIMITS.mission, addressKey(request, secret), now);
  const player = await currentPlayer(db, request, now);
  return json(await missionBoardPage(db, player, parsed.data, now));
});
