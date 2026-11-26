INSERT INTO "personal_bests" ("player_id", "board", "run_id", "rank1", "rank2", "rank3", "score", "stars", "stats", "achieved_at", "updated_at")
SELECT pb."player_id", regexp_replace(pb."board", '/v3$', '/v4'), pb."run_id", pb."rank1", pb."rank2", pb."rank3", pb."score", pb."stars", pb."stats", pb."achieved_at", CURRENT_TIMESTAMP
FROM "personal_bests" pb
WHERE pb."board" IN (
  'operation-recess/corridor/v3',
  'operation-recess/yard/v3',
  'operation-recess/library/v3'
)
ON CONFLICT ("player_id", "board") DO UPDATE SET
  "run_id" = EXCLUDED."run_id",
  "rank1" = EXCLUDED."rank1",
  "rank2" = EXCLUDED."rank2",
  "rank3" = EXCLUDED."rank3",
  "score" = EXCLUDED."score",
  "stars" = EXCLUDED."stars",
  "stats" = EXCLUDED."stats",
  "achieved_at" = EXCLUDED."achieved_at",
  "updated_at" = EXCLUDED."updated_at"
WHERE (EXCLUDED."rank1", EXCLUDED."rank2", EXCLUDED."rank3") > ("personal_bests"."rank1", "personal_bests"."rank2", "personal_bests"."rank3")
   OR ((EXCLUDED."rank1", EXCLUDED."rank2", EXCLUDED."rank3") = ("personal_bests"."rank1", "personal_bests"."rank2", "personal_bests"."rank3")
       AND EXCLUDED."achieved_at" < "personal_bests"."achieved_at");
