DO $$
DECLARE
  duplicate RECORD;
  fresh CHAR(4);
BEGIN
  FOR duplicate IN
    SELECT id, nickname_key
    FROM (
      SELECT id, nickname_key, row_number() OVER (PARTITION BY nickname_key, tag ORDER BY created_at, id) AS rank_in_tag
      FROM players
    ) ranked
    WHERE rank_in_tag > 1
  LOOP
    SELECT lpad(n::text, 4, '0') INTO fresh
    FROM generate_series(0, 9999) AS n
    WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.nickname_key = duplicate.nickname_key AND p.tag = lpad(n::text, 4, '0'))
    ORDER BY random()
    LIMIT 1;
    UPDATE players SET tag = fresh WHERE id = duplicate.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX "players_nickname_key_tag_key" ON "players"("nickname_key", "tag");
