-- AlterTable
ALTER TABLE "challenge_entries" ADD COLUMN     "final_position" INTEGER,
ADD COLUMN     "final_total" INTEGER;

-- AlterTable
ALTER TABLE "daily_challenges" ADD COLUMN     "settled_at" TIMESTAMPTZ(3);

ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_final_check" CHECK (("final_position" IS NULL AND "final_total" IS NULL) OR ("final_position" >= 1 AND "final_total" >= "final_position"));

WITH done AS (
  SELECT player_id, challenge_id, completed_at, completed_run_id,
    ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY challenge_id) AS n,
    LAG(challenge_id) OVER (PARTITION BY player_id ORDER BY challenge_id) AS previous
  FROM challenge_entries
  WHERE completed_at IS NOT NULL
), comeback AS (
  SELECT DISTINCT ON (player_id) player_id, completed_run_id, completed_at
  FROM done
  WHERE previous IS NOT NULL AND (challenge_id::date - previous::date) - 1 >= 7
  ORDER BY player_id, challenge_id
)
INSERT INTO "player_achievements" ("player_id", "achievement", "source", "run_id", "unlocked_at")
SELECT player_id, 'mission-first', 'verified'::"AchievementSource", completed_run_id, completed_at FROM done WHERE n = 1
UNION ALL
SELECT player_id, 'mission-regular', 'verified'::"AchievementSource", completed_run_id, completed_at FROM done WHERE n = 3
UNION ALL
SELECT player_id, 'mission-marathon', 'verified'::"AchievementSource", completed_run_id, completed_at FROM done WHERE n = 7
UNION ALL
SELECT player_id, 'mission-back-on-air', 'verified'::"AchievementSource", completed_run_id, completed_at FROM comeback
ON CONFLICT DO NOTHING;
