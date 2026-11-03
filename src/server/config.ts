export type CompetitionConfig = { ok: true; databaseUrl: string; secret: string } | { ok: false; missing: string[] };

const MIN_SECRET = 32;

export function competitionConfig(env: Record<string, string | undefined> = process.env): CompetitionConfig {
  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  const secret = env.COMPETITION_SECRET?.trim() ?? "";
  const missing: string[] = [];
  if (!databaseUrl) missing.push("DATABASE_URL");
  if (secret.length < MIN_SECRET) missing.push("COMPETITION_SECRET");
  return missing.length ? { ok: false, missing } : { ok: true, databaseUrl, secret };
}
