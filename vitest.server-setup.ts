import { afterAll } from "vitest";
import { closeDb } from "@/server/db";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "";
process.env.COMPETITION_SECRET = "test-secret-for-canal-404-competition-0123456789";
process.env.CRON_SECRET = "test-cron-secret-404";

afterAll(async () => {
  await closeDb();
});
