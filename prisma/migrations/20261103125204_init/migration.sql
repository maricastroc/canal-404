-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('active', 'hidden', 'banned');

-- CreateEnum
CREATE TYPE "Verification" AS ENUM ('replayed', 'checked', 'rejected');

-- CreateEnum
CREATE TYPE "AchievementSource" AS ENUM ('verified', 'reported');

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "nickname" VARCHAR(16) NOT NULL,
    "nickname_key" VARCHAR(32) NOT NULL,
    "tag" CHAR(4) NOT NULL,
    "status" "PlayerStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renamed_at" TIMESTAMPTZ(3),

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runs" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "game" VARCHAR(32) NOT NULL,
    "level" VARCHAR(32) NOT NULL,
    "board" VARCHAR(64),
    "challenge_id" CHAR(10),
    "won" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "stars" SMALLINT NOT NULL,
    "stats" JSONB NOT NULL,
    "replay" JSONB,
    "rank1" INTEGER NOT NULL,
    "rank2" INTEGER NOT NULL,
    "rank3" INTEGER NOT NULL,
    "verification" "Verification" NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rules_version" SMALLINT NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_bests" (
    "player_id" UUID NOT NULL,
    "board" VARCHAR(64) NOT NULL,
    "run_id" UUID NOT NULL,
    "rank1" INTEGER NOT NULL,
    "rank2" INTEGER NOT NULL,
    "rank3" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "stars" SMALLINT NOT NULL,
    "stats" JSONB NOT NULL,
    "achieved_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_bests_pkey" PRIMARY KEY ("player_id","board")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" CHAR(10) NOT NULL,
    "game" VARCHAR(32) NOT NULL,
    "level" VARCHAR(32) NOT NULL,
    "seed" INTEGER NOT NULL,
    "variant" JSONB NOT NULL,
    "rules_version" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_achievements" (
    "player_id" UUID NOT NULL,
    "achievement" VARCHAR(48) NOT NULL,
    "source" "AchievementSource" NOT NULL,
    "run_id" UUID,
    "unlocked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_achievements_pkey" PRIMARY KEY ("player_id","achievement")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(96) NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_token_hash_key" ON "players"("token_hash");

-- CreateIndex
CREATE INDEX "players_last_seen_at_idx" ON "players"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "runs_ticket_id_key" ON "runs"("ticket_id");

-- CreateIndex
CREATE INDEX "runs_player_id_created_at_idx" ON "runs"("player_id", "created_at");

-- CreateIndex
CREATE INDEX "runs_board_created_at_idx" ON "runs"("board", "created_at");

-- CreateIndex
CREATE INDEX "runs_created_at_idx" ON "runs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "personal_bests_run_id_key" ON "personal_bests"("run_id");

-- CreateIndex
CREATE INDEX "personal_bests_board_rank1_rank2_rank3_achieved_at_idx" ON "personal_bests"("board", "rank1" DESC, "rank2" DESC, "rank3" DESC, "achieved_at");

-- CreateIndex
CREATE INDEX "player_achievements_achievement_idx" ON "player_achievements"("achievement");

-- CreateIndex
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits"("window_start");

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "daily_challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
