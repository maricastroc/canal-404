import { checkNickname, NICKNAME_PROBLEMS } from "@/lib/competition/nickname";
import { assertWritable, HttpError, json, readJson, sameOrigin } from "@/server/http";
import { clearedPlayerCookie, currentPlayer, publicPlayer } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { nicknameSchema } from "@/server/schemas";

export const dynamic = "force-dynamic";

export const GET = competitionRoute(async ({ request, db, now }) => {
  const player = await currentPlayer(db, request, now);
  return json({ player: player ? publicPlayer(player) : null });
});

export const PATCH = competitionRoute(async ({ request, db, now }) => {
  assertWritable(request);
  const player = await currentPlayer(db, request, now);
  if (!player) throw new HttpError("not_joined", "Você ainda não entrou no placar.");
  const parsed = nicknameSchema.safeParse(await readJson(request, 1024));
  if (!parsed.success) throw new HttpError("bad_request", "Pedido inválido.");
  const check = checkNickname(parsed.data.nickname);
  if (!check.ok) throw new HttpError("bad_nickname", NICKNAME_PROBLEMS[check.problem], { problem: check.problem });
  await enforce(db, LIMITS.rename, player.id, now);
  const updated = await db.player.update({
    where: { id: player.id },
    data: { nickname: check.nickname, nicknameKey: check.key, renamedAt: now, lastSeenAt: now },
  });
  return json({ player: publicPlayer(updated) });
});

export const DELETE = competitionRoute(async ({ request, db, now }) => {
  if (!sameOrigin(request)) throw new HttpError("bad_origin", "Pedido de outro site.");
  const player = await currentPlayer(db, request, now);
  if (player) await db.player.delete({ where: { id: player.id } });
  return json({ deleted: Boolean(player) }, { headers: { "Set-Cookie": clearedPlayerCookie() } });
});
