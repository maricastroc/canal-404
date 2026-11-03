import { execFileSync } from "node:child_process";
import { Client } from "pg";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    if (process.env.REQUIRE_DB_TESTS) throw new Error("TEST_DATABASE_URL is required when REQUIRE_DB_TESTS is set.");
    return;
  }
  const target = new URL(url);
  const name = decodeURIComponent(target.pathname.slice(1));
  if (!/^[a-z0-9_]+$/i.test(name) || !/test/i.test(name)) throw new Error("TEST_DATABASE_URL must point to a database whose name contains 'test'.");
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!found.rowCount) await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url },
    stdio: "pipe",
  });
}
