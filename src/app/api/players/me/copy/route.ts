import { SNAPSHOT_MAX_BYTES } from "@/lib/competition/recovery";
import { assertWritable, HttpError, json, readJson } from "@/server/http";
import { cloudCopyView, currentPlayer } from "@/server/identity";
import { LIMITS, enforce } from "@/server/rate-limit";
import { competitionRoute } from "@/server/route";
import { snapshotSchema } from "@/server/schemas";

export const dynamic = "force-dynamic";

export const GET = competitionRoute(async ({ request, db, now }) => {
  const player = await currentPlayer(db, request, now);
  if (!player) throw new HttpError("not_joined", "Você ainda não entrou no placar.");
  const save = await db.playerSave.findUnique({ where: { playerId: player.id } });
  return json({ copy: cloudCopyView(save) });
});

export const PUT = competitionRoute(async ({ request, db, now }) => {
  assertWritable(request);
  const player = await currentPlayer(db, request, now);
  if (!player) throw new HttpError("not_joined", "Você ainda não entrou no placar.");
  const parsed = snapshotSchema.safeParse(await readJson(request, SNAPSHOT_MAX_BYTES));
  if (!parsed.success) throw new HttpError("bad_request", "Pedido inválido.");
  await enforce(db, LIMITS.cloudCopy, player.id, now);
  const save = await db.playerSave.upsert({
    where: { playerId: player.id },
    create: { playerId: player.id, data: parsed.data, savedAt: now },
    update: { data: parsed.data, savedAt: now },
  });
  return json({ savedAt: save.savedAt.toISOString() });
});
