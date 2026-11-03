import { competitionConfig } from "@/server/config";
import { getDb } from "@/server/db";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

const PROBE_MS = 3000;

export async function GET() {
  const config = competitionConfig();
  if (!config.ok) return json({ status: "unconfigured" });
  try {
    const db = getDb(config.databaseUrl);
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), PROBE_MS)),
    ]);
    return json({ status: "online" });
  } catch {
    return json({ status: "offline" });
  }
}
