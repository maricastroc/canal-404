import { BOARD_META, boardId, hasLevel } from "@/lib/competition/rules";
import { standing, topOfBoard } from "@/server/boards";
import { addressKey, HttpError, json } from "@/server/http";
import { currentPlayer } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { boardQuerySchema } from "@/server/schemas";

export const dynamic = "force-dynamic";

export const GET = competitionRoute(async ({ request, db, secret, now }) => {
  const params = new URL(request.url).searchParams;
  const parsed = boardQuerySchema.safeParse({ game: params.get("game"), level: params.get("level"), limit: params.get("limit") ?? undefined });
  if (!parsed.success) throw new HttpError("bad_request", "Placar inválido.");
  const { game, level, limit } = parsed.data;
  if (!hasLevel(game, level)) throw new HttpError("not_found", "Esse placar não existe.");
  await enforce(db, LIMITS.board, addressKey(request, secret), now);
  const board = boardId(game, level);
  const player = await currentPlayer(db, request, now);
  const [top, mine] = await Promise.all([topOfBoard(db, game, board, limit, player?.id ?? null), player ? standing(db, game, board, player.id) : null]);
  return json({
    board: { id: board, game, level, explain: BOARD_META[game].explain, metrics: BOARD_META[game].metrics },
    entries: top.entries,
    total: top.total,
    you: player ? { nickname: player.nickname, tag: player.tag, standing: mine } : null,
  });
});
