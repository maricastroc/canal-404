import { timingSafeEqual } from "node:crypto";
import { cleanup } from "@/server/cleanup";
import { HttpError, json } from "@/server/http";
import { competitionRoute } from "@/server/route";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const GET = competitionRoute(async ({ request, db, now }) => {
  if (!authorized(request)) throw new HttpError("unauthorized", "Sem permissão.");
  return json({ removed: await cleanup(db, now) });
});
