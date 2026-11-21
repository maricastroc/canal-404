# 0012: Replaying Ladeira Abaixo on the server

## Context

Ladeira Abaixo is a downhill soapbox race against three friends. It was built as a prototype on a hidden route, with its physics already outside Phaser: `src/games/downhill-derby/sim/` steps a fixed 1/120 s, uses only plain arithmetic and the helpers in `sim/math.ts` (no `Math.sin`, `cos`, `pow` or `hypot`), and gives the same result in V8 and JavaScriptCore. The rivals are recorded input logs ("fitas") replayed through that same simulation. Joining the catalog needs a board per track that a modified client can't fill with invented times.

## Decision

- **The run is its inputs.** Every simulation step reads five bits (crouch, jump, spin left, spin right, Space held). The game records the step whenever the bits change and sends them as a compact base-32 tape (`sim/tapes.ts`) in `GameResult.replay`, kind `downhill-run`, version 1, together with the cart and the index of the rival tape raced in each of the three slots.
- **The server replays it** (`sim/judge.ts`, rule version 1). It reads the tape strictly (only the tape alphabet, strictly increasing steps, at most 12,000 characters and 240 s), refuses logs no keyboard or touch screen can produce (the same bits twice in a row, both spin directions at once, a jump held for more than one step), runs the race from the start line with the default physics and that cart's rules, and refuses runs that don't reach the finish or have inputs after it (`bad_run`, `run_failed`).
- **Place, stars and score come from the replay.** The rival times are the stored times of the raced tapes, so the place is the replayed time against them (a tie goes to the player, as in the game). 1st, 2nd and 3rd give 3, 2 and 1 stars and count as a win; 4th gives none. The score is the place bonus (1,000, 600, 300, 0) plus the show points the replay counted. The browser's claim must match (`score_mismatch` otherwise); other stats that differ are accepted and flagged `stats_mismatch`.
- **One board per track** (`downhill-derby/<track>/v1`): the fastest time in milliseconds, then fewer wipeouts, then more show points. Every finished race enters, whatever the place, because the rivals adapt to the player's pace during a visit and the board is about the clock. The minimum time since the ticket is the replayed race time. Replayed runs are stored as `replayed`, and the record arcade marks them "Descida refeita pelo canal".

## Evidence

- 42 bot runs (four carts, three tracks, careful and fast lines, poses and wheelies) replay on the judge to the exact finish time of the simulation that recorded them, in 1 to 10 ms each.
- Races played through the portal in Chrome (a win with a new record, a 4th place, a cart unlocked on Dia de Feira, the sewer route on Morro da Antena) were replayed from their tapes with the same time, place, show points and wipeouts.
- `rules.test.ts` keeps two known runs (Plano B on the rooftop route of Ladeira do Seu Arlindo, the Banheira through the sewer of Morro da Antena) with their replayed times, places and scores, plus tampered and impossible logs.

## Consequences

- Anything that changes how a run plays out (physics constants, cart rules, a track, the step rate) or which place a time earns (re-recorded rival tapes) needs a new rule version, which starts new boards.
- The adaptive rivals mean stars measure the race the player actually had, not a fixed time per medal. A player could take it slow on purpose to face slower rivals; that only affects their own stars, never the board.
- As with the other replayed games, a record proves that the inputs produce the time, not that a person pressed them. A good log can be sent by anyone, and ties go to whoever got there first.
