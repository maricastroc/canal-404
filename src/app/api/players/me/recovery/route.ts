import { formatRecoveryCode } from "@/lib/competition/recovery";
import { assertWritable, HttpError, json } from "@/server/http";
import { currentPlayer, hashToken, newRecoveryCode, playerCookie, publicPlayer, tokenFromRecoveryCode } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";

export const dynamic = "force-dynamic";

export const POST = competitionRoute(async ({ request, db, now }) => {
  assertWritable(request);
  const player = await currentPlayer(db, request, now);
  if (!player) throw new HttpError("not_joined", "Você ainda não entrou no placar.");
  await enforce(db, LIMITS.recoveryCode, player.id, now);
  const code = newRecoveryCode();
  const token = tokenFromRecoveryCode(code);
  const updated = await db.player.update({ where: { id: player.id }, data: { tokenHash: hashToken(token), recoveryAt: now, lastSeenAt: now } });
  return json({ code: formatRecoveryCode(code), player: publicPlayer(updated) }, { headers: { "Set-Cookie": playerCookie(token) } });
});
