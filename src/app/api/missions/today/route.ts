import { addressKey, json } from "@/server/http";
import { currentPlayer } from "@/server/identity";
import { missionToday } from "@/server/missions";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";

export const dynamic = "force-dynamic";

export const GET = competitionRoute(async ({ request, db, secret, now }) => {
  await enforce(db, LIMITS.mission, addressKey(request, secret), now);
  const player = await currentPlayer(db, request, now);
  return json(await missionToday(db, player, now));
});
