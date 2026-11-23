import { normalizeRecoveryCode } from "@/lib/competition/recovery";
import { addressKey, assertWritable, HttpError, json, readJson } from "@/server/http";
import { cloudCopyView, hashToken, playerCookie, publicPlayer, tokenFromRecoveryCode } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { recoverSchema } from "@/server/schemas";

export const dynamic = "force-dynamic";

export const POST = competitionRoute(async ({ request, db, secret, now }) => {
  assertWritable(request);
  const parsed = recoverSchema.safeParse(await readJson(request, 256));
  if (!parsed.success) throw new HttpError("bad_request", "Pedido inválido.");
  const address = addressKey(request, secret);
  await enforce(db, LIMITS.recover, address, now);
  await enforce(db, LIMITS.recoverDaily, address, now);
  const code = normalizeRecoveryCode(parsed.data.code);
  const token = code ? tokenFromRecoveryCode(code) : null;
  const player = token ? await db.player.findUnique({ where: { tokenHash: hashToken(token) }, include: { save: true } }) : null;
  if (!token || !player || player.status === "banned") throw new HttpError("not_found", "Código não encontrado.");
  await db.player.update({ where: { id: player.id }, data: { lastSeenAt: now } });
  return json({ player: publicPlayer(player), copy: cloudCopyView(player.save) }, { headers: { "Set-Cookie": playerCookie(token) } });
});
