INSERT INTO "personal_bests" ("player_id", "board", "run_id", "rank1", "rank2", "rank3", "score", "stars", "stats", "achieved_at", "updated_at")
SELECT pb."player_id", regexp_replace(pb."board", '/v2$', '/v3'), pb."run_id", pb."rank1", pb."rank2", pb."rank3", pb."score", pb."stars", pb."stats", pb."achieved_at", CURRENT_TIMESTAMP
FROM "personal_bests" pb
WHERE pb."board" IN (
  'past-bedtime/doorway/v2',
  'past-bedtime/hallway/v2',
  'past-bedtime/stairs/v2',
  'past-bedtime/kitchen/v2',
  'past-bedtime/pantry/v2',
  'past-bedtime/laundry/v2',
  'past-bedtime/dining/v2',
  'past-bedtime/living/v2',
  'past-bedtime/return/v2'
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
