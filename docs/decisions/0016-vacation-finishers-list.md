# 0016: Férias Fora do Ar lists who finished

## Context

Férias Fora do Ar is an adventure played across many sessions, and its results are checked, not replayed ([0004](0004-result-validation.md)). Its board ranked by score, then the shorter playtime, then discoveries. It had no minimum elapsed time, because one ticket can't cover an adventure that spans days.

The technical audit (F21 in `docs/audit/AUDITORIA_TECNICA.md`) reproduced the consequence:

- a forged result with the highest possible score entered first place at once;
- it stayed there for good, because ties go to whoever got there first.

0004 already accepts that checked games can be forged. The difference here was that the forgery won a permanent first place. The audit also found that the highest real score is 2150, not the 2400 the rule allows, because the third secret only exists after the ending.

The options were:

- list who finished, without a contest;
- use the ticket's age as a minimum time, which doesn't fit an adventure played over many sessions;
- accept the permanent first place and document it.

## Decision

- **A list, not a ranking.** The Férias board lists who finished, with no positions, scores, champion or record. `BOARD_META["off-air-vacation"].finishers` marks it in `src/lib/competition/boards.ts`.
- **Order.** The latest finisher is on top: the board sorts by `achievedAt`, newest first.
- **One entry per player.** Each player appears once, with the date of their first finish. A later finish never replaces the entry (`upsertBest` inserts with `ON CONFLICT DO NOTHING`), and the board has no leader (`leaderOf` returns null).
- **What stays the same:**
  - the judge, the rule version, the stats and the stored rank keys, so the board id and the existing entries stay;
  - entries made before this change keep the date of their best-scoring finish;
  - the third secret doesn't matter for the board anymore, and the game's result screen and stars are unchanged.
- **Wording.** The result card, the record arcade and the game page say "Quem terminou" ("Who finished"). The game page shows how many people finished, and the arcade shows each name with its date.

## Consequences

- A forged result still puts a name on the list, as 0004 accepts for checked games, but there's no first place to keep.
- The board no longer rewards a higher score or a faster adventure. The game's own result screen still shows both.
- The test of the board order (`runs.test.ts`) covers the list: the order, no leader, and a later finish not replacing the first.
