ALTER TABLE "players" ADD CONSTRAINT "players_tag_check" CHECK ("tag" ~ '^[0-9]{4}$');
ALTER TABLE "players" ADD CONSTRAINT "players_nickname_check" CHECK (char_length("nickname") BETWEEN 3 AND 16);
ALTER TABLE "runs" ADD CONSTRAINT "runs_stars_check" CHECK ("stars" BETWEEN 0 AND 3);
ALTER TABLE "runs" ADD CONSTRAINT "runs_score_check" CHECK ("score" >= 0);
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_stars_check" CHECK ("stars" BETWEEN 0 AND 3);
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_score_check" CHECK ("score" >= 0);
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_id_check" CHECK ("id" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_count_check" CHECK ("count" > 0);
