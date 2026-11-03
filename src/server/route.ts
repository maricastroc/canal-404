import { competitionConfig } from "./config";
import { getDb, isUnavailable, type Db } from "./db";
import { fail, HttpError } from "./http";

export type RouteContext = { request: Request; db: Db; secret: string; now: Date };

export function competitionRoute(handler: (ctx: RouteContext) => Promise<Response>) {
  return async (request: Request) => {
    const config = competitionConfig();
    if (!config.ok) return fail("unconfigured", "O placar do canal ainda não estreou.");
    try {
      return await handler({ request, db: getDb(config.databaseUrl), secret: config.secret, now: new Date() });
    } catch (error) {
      if (error instanceof HttpError) return error.toResponse();
      if (!isUnavailable(error)) console.error(error);
      return fail("unavailable", "O placar saiu do ar. Tente de novo daqui a pouco.");
    }
  };
}
