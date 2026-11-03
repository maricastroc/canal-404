import { checkNickname, NICKNAME_PROBLEMS } from "@/lib/competition/nickname";
import { addressKey, assertWritable, HttpError, json, readJson } from "@/server/http";
import { currentPlayer, hashToken, newTag, newToken, playerCookie, publicPlayer } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { nicknameSchema } from "@/server/schemas";

export const dynamic = "force-dynamic";

export const POST = competitionRoute(async ({ request, db, secret, now }) => {
  assertWritable(request);
  const existing = await currentPlayer(db, request, now);
  if (existing) return json({ player: publicPlayer(existing) });
  const parsed = nicknameSchema.safeParse(await readJson(request, 1024));
  if (!parsed.success) throw new HttpError("bad_request", "Pedido inválido.");
  const check = checkNickname(parsed.data.nickname);
  if (!check.ok) throw new HttpError("bad_nickname", NICKNAME_PROBLEMS[check.problem], { problem: check.problem });
  const address = addressKey(request, secret);
  await enforce(db, LIMITS.join, address, now);
  await enforce(db, LIMITS.joinDaily, address, now);
  const token = newToken();
  const player = await db.player.create({
    data: { tokenHash: hashToken(token), nickname: check.nickname, nicknameKey: check.key, tag: newTag(), createdAt: now, lastSeenAt: now },
  });
  return json({ player: publicPlayer(player) }, { status: 201, headers: { "Set-Cookie": playerCookie(token) } });
});
