# 0013: Replaying Madrugada on the server

## Context

Madrugada (EN "Past Bedtime") is a turn-based stealth puzzle in ten parts. Bruno moves one tile or waits per turn, and the house (Dad, Grandma, Pipoca, Pixel, the cuckoo clock) answers each turn the same way every time. The rules already live outside Phaser in `src/games/past-bedtime/sim/`: `step()` is a pure function of the level, the state and one action, with no randomness and no clock. Joining the catalog needs a board per part that a modified client can't fill with invented move counts.

## Decision

- **The run is its moves.** The game sends the actions it accepted, in order, as one letter each (`u`, `r`, `d`, `l` for the four directions and `w` for waiting), in `GameResult.replay`, kind `bedtime-moves`, version 1. Moves into a wall are never recorded, and an undo removes the last letter, so a valid list is exactly the plan that won.
- **The server replays it** (`sim/judge.ts`, rule version 1). It reads the list strictly (only those five letters, at most 400), refuses any action the rules don't allow (`bad_moves`), and requires that Bruno is never caught along the way and reaches the goal on the last move, not before (`moves_failed` otherwise).
- **Stars and score come from the replay.** Stars are 3 at par, 2 within par + 3 and 1 after that, as in the game. The score is 1,000 for the part plus 100 for each move under par + 10. The browser's claim must match (`score_mismatch` otherwise); stats that differ are accepted and flagged `stats_mismatch`.
- **Hints cap the stars and keep the run off the board.** A hint shows the solver's next steps, so the result carries the hint count, stars are capped at 2 when it is above zero, and such runs are stored as ineligible (`hinted`). The server can't see hints and trusts the count it receives.
- **One board per part** (`past-bedtime/<part>/v1`): fewest moves, then fewer people woken up, then fewer creaks outside the cuckoo's song. The minimum time since the ticket is 150 ms per move. Replayed runs are stored as `replayed`, and the record arcade marks them "Jogadas refeitas pelo canal".
- **No daily missions at launch.** They can be added later from the same evidence (moves, wake-ups, creaks).

## Evidence

- `npm run solve:bedtime` finds a plan at par for every part; `rules.test.ts` replays each of those ten plans through the judge (3 stars, 2,000 points, eligible), plus a hinted run, tampered scores and stars, malformed, impossible, unfinished and overlong lists, and unknown parts.
- Parts won in the browser through the portal were checked against the judge with the moves the game sent.

## Consequences

- Anything that changes how a turn plays out (a map, a resident's routine, a par, the hearing or sight rules) needs a new rule version, which starts new boards.
- Every part has at least one plan at par, so the top of each board fills with par runs and the tiebreakers (wake-ups, creaks) and arrival order decide the order.
- As with the other replayed games, a record proves that the moves win the part, not that a person found them. A solver's plan can be sent by anyone.
