import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

export type Db = PrismaClient;

export type Tx = Prisma.TransactionClient;

type Cached = { url: string; client: PrismaClient; pool: Pool };

const holder = globalThis as unknown as { canal404Db?: Cached };

export function getDb(url: string): Db {
  const cached = holder.canal404Db;
  if (cached && cached.url === url) return cached.client;
  const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 });
  pool.on("error", () => undefined);
  attachDatabasePool(pool);
  const client = new PrismaClient({ adapter: new PrismaPg(pool) });
  holder.canal404Db = { url, client, pool };
  return client;
}

export async function closeDb() {
  const cached = holder.canal404Db;
  holder.canal404Db = undefined;
  if (!cached) return;
  await cached.client.$disconnect();
  await cached.pool.end().catch(() => undefined);
}

const UNAVAILABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "P2028"]);
const NETWORK_CODES = new Set(["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "57P01", "57P03", "53300"]);

export function isUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) return UNAVAILABLE_CODES.has(error.code);
  if (error instanceof Prisma.PrismaClientUnknownRequestError || error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && NETWORK_CODES.has(code)) return true;
    const cause = (error as { cause?: unknown }).cause;
    if (cause && cause !== error) return isUnavailable(cause);
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && /connect|timeout|terminat/i.test(message)) return true;
  }
  return false;
}

export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
