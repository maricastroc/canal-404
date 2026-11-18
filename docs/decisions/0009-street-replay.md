# 0009: Replaying Rua Sem Saída on the server

## Context

Until now the server could only check Rua Sem Saída results for plausibility ([0004](0004-result-validation.md)): target points had to add up to real targets, ammo had to match, and the match had to last the minimum time. A modified client that sent invented but consistent numbers was accepted. The game already stepped Matter at a fixed 1/60 s, but four things kept it from being replayed:

- The physics lived in Phaser's Matter plugin, which the server can't run.
- Shots ended, targets appeared and armed, reloads and round breaks ran on `time.now` and Phaser timers, so the same launches could lead to different outcomes depending on frame timing and hit-stops.
- The world kept stepping while the player aimed, for as long as they wanted, so a replay would have to simulate every idle second.
- The rounded corners of every prop and target (`chamfer`) and the circle projectiles were built with `Math.pow`, `Math.acos`, `Math.sin` and `Math.cos`, which are not guaranteed to give the same last bits in every engine. Collision speeds used `Math.hypot`, which has the same problem.

## Decision

`src/games/dead-end-street/sim.ts` is the only physics and rule engine of Rua Sem Saída. The browser and the server run the same code.

- **No Phaser.** `StreetSim` builds its own `matter-js` engine (the version pinned in [0005](0005-shared-lab-simulation.md)) with the statics, props and targets in a fixed order, settles it for 90 steps, and owns everything that decides the score: loading projectiles, launches, the balloon burst, target hits and mess, combos, rounds, interludes, the end of the match and the ammo bonus. It reports what happened through callbacks; `PlayScene` only draws sprites at the bodies' positions, plays sounds, shows effects and talks to the host.
- **Timers count steps.** Every delay that used `time.now` or a Phaser timer is now a number of simulation steps, converted once from the old milliseconds (the shot ends after 2.6 s of contact or 7 s of flight, reloads after 380 or 650 ms, round breaks, spawns, target arming, the last-shot wait and the finale). Hit-stops freeze the scene's stepping, so they pause the timers too.
- **The yard rests while you aim.** In the aiming phase, with no timer pending, the simulation stops stepping once every body has been calm (speed under 0.3, spin under 0.005) for 30 steps, or after 10 s of aiming. Both the game and the server apply the same rule, so a long aim costs the replay nothing, and a match never needs more than about 8,000 steps.
- **Integer launches.** A launch is `{ at, angle, power }`: the step it happened on, the angle in hundredths of a degree and the power in thousandths. The game rounds the aim to those units before launching, so the replayed launch is exactly the one that was played. The result carries the log in `GameResult.replay` as `street-launches`, version 1.
- **Deterministic bodies.** `src/lib/physics/matter.ts` now holds the patches shared with the Laboratório (rotation with the deterministic `trig.ts`, which moved to `src/lib/physics/`, and the resting thresholds) and builds rounded rectangles and circles with that trigonometry and a fixed corner quality of four segments. Distances use `Math.sqrt` instead of `Math.hypot`.

The server rule (`rules.ts`, Rua Sem Saída version 2) replays the log with `replayStreet`. It rejects logs with more launches than ammo, values outside the aim limits or steps out of order (`bad_launches`), and logs whose launches happen when the game would not allow one or that don't reach the end of the match (`launches_failed`). The score, stars and win come from the replay; the client's claim must match them (`score_mismatch` otherwise), and other stats that differ are accepted and flagged `stats_mismatch`. The minimum time since the ticket is the replayed step count. Replayed runs are stored as `replayed`, and the record arcade marks them "Lançamentos refeitos pelo canal".

## Evidence

- A full match played in Chrome against the local backend was accepted as replayed, with the same score and no flags.
- The bundled simulation ran 200 random matches in JavaScriptCore (Safari's engine) and in V8 (Chrome and Node). Every body's position and angle after every step hashed to the same value in both, and replaying each match's log gave the same score as the live match.
- `sim.test.ts` keeps a known winning log (`solutions.ts`) as a golden replay (836 steps, 2,250 points, three stars) and checks that a trajectory is the same whatever ran before. `rules.test.ts` covers the accepted, tampered and impossible logs, and the mission proofs in `catalog.test.ts` are real replayed matches.
- A typical replay takes about 20 ms on the server and a long losing match about 40 ms.

## Consequences

- The Rua Sem Saída board moved to version 2 (`dead-end-street/all/v2`) and starts empty. Version 1 results can't be replayed because they have no launch log; they stay in the database but no longer show.
- The physics is close to the old one but not identical: the rounded corners have a fixed number of segments, and timers that used to keep running during hit-stops now pause with them. A record set before this change could play out slightly differently today, which is one more reason to start a new board.
- Anything that changes trajectories or rules (a constant, a timer, the body order, the corner quality, the calm thresholds) must come with a new board version, as in [0005](0005-shared-lab-simulation.md).
- Like the Laboratório, a replayed record proves that the launches score what they claim, not that a person aimed them in the game. Anyone who finds a good log can send it; for an aiming game that is an acceptable trade, and ties still go to whoever got there first.
