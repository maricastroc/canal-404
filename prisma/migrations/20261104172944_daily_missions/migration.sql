-- DropIndex
DROP INDEX "personal_bests_run_id_key";

-- AlterTable
ALTER TABLE "daily_challenges" ADD COLUMN     "key" VARCHAR(48) NOT NULL DEFAULT 'legacy';
ALTER TABLE "daily_challenges" ALTER COLUMN "key" DROP DEFAULT;

-- CreateTable
CREATE TABLE "challenge_entries" (
    "player_id" UUID NOT NULL,
    "challenge_id" CHAR(10) NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "last_played_at" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(3),
    "completed_run_id" UUID,

    CONSTRAINT "challenge_entries_pkey" PRIMARY KEY ("player_id","challenge_id")
);

-- CreateIndex
CREATE INDEX "challenge_entries_challenge_id_completed_at_idx" ON "challenge_entries"("challenge_id", "completed_at");

-- CreateIndex
CREATE INDEX "personal_bests_run_id_idx" ON "personal_bests"("run_id");

-- AddForeignKey
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_completed_run_id_fkey" FOREIGN KEY ("completed_run_id") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_key_check" CHECK ("key" ~ '^[a-z0-9-]{3,48}$');
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_attempts_check" CHECK ("attempts" >= 0);
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_completed_check" CHECK ("completed_run_id" IS NULL OR "completed_at" IS NOT NULL);
