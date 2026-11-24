# 0011: Rua Sem Saída becomes a nine-level campaign

## Context

Rua Sem Saída was three short rounds of aiming at ornaments, won with four or five launches. The server already replayed every match ([0009](0009-street-replay.md)), but the whole match was one fixed queue of seven projectiles and one board for the whole game. The new campaign asks the player to read the yard and use its contraptions, choose which projectile to throw, and replay levels to do better, so the simulation, the result and the rules had to change together.

## Decision

### Levels are data

- `phases.ts` describes the nine levels in three acts: the ammo stock, the stars par, the static structures, the loose pieces, the targets and the gadgets. `StreetSim` builds any level from that data; nothing in the simulation or the scene checks for a specific level.
- Targets are knocked down (moved more than 44 px, turned more than 0.7 rad, hit by a flying projectile, or struck by any moving piece faster than 2.5 px/step) or soaked (a balloon bursting within 150 px with no wall in between, a tipped bucket, or the hose stream). A target can refuse direct projectile hits (`direct: false`) or balloon shoves (`sturdy`), and can wobble when hit.
- Gadgets: pivots, cuttable ropes, buckets that spill when tipped or after landing, a faucet whose hose soaks and pushes what is in its stream, a leaf blower that pushes back projectiles by how light they are until it is knocked off its stand, and a turnstile or hinged gate that turns after every launch. Every gadget is a pure function of the simulation steps.
- `Matter.Vector.rotate`, used by constraints, now uses the deterministic `trig.ts`, like the vertex and axis rotations ([0005](0005-shared-lab-simulation.md)). The Laboratório has no constraints, so its golden results are unchanged.
- Spent projectiles vanish 250 ms after their shot ends, so a shoe resting on a ramp can't block a chain reaction a moment later.

### The player picks the ammo

Each level has a stock (for example 2 balloons, 1 sneaker, 2 ducks). The player picks the projectile before each launch (tap the ammo, keys 1 to 4 or Q). The launch log records it: `{ at, angle, power, ammo }`, replay format `street-launches` version 2. A log that spends ammo the level doesn't have is rejected as `bad_launches`.

### Stars, score and progress

- Stars measure efficiency: 1 star for clearing the level, 2 or 3 for clearing it within that level's launch limits (`par`). The limits come from the solutions found by brute-force bots over the whole aim grid, so 3 stars needs a smart plan, not a perfect pixel.
- The score keeps its parts: targets, yard mess (25 each), combos (100 per extra target in one launch), gadgets set off (50 each), clearing the level (300) and leftover ammo (250 each).
- The portal treats the game like the other games with levels: level picker with unlocks, best stars and score per level, "Próxima fase". The shell now passes the saved stars and scores to the game at start (`StartOptions.records`), so the game can show the level's best and the campaign stars in the result.

### Competition rules, version 3

- One board per level (`dead-end-street/<level>/v3`), ranked by score, then fewer launches. Only cleared levels enter the board (`not_won` otherwise).
- The server replays the version 2 log with `replayStreet(level, launches)` and takes the score, stars and win from the replay; the minimum time since the ticket is the replayed step count. Tickets without a level are refused for this game.
- The whole-game board `dead-end-street/all/v2` stays in the database and no longer shows. Its results came from a different game (three rounds, fixed ammo) and are never compared with the new levels.
- Missions: the four old missions had no level, so they are marked `retired` (out of the rotation, kept for history and English text). Four new missions point at levels and have replayed proofs in `catalog.test.ts`. A day that already stored an old street mission keeps it; its runs can't match a level, so that day can't be completed after the deploy.

## Evidence

- Bots scanned every level over angles from −8° to 82° and power from 16% to 100%, for each projectile, step by step from each reachable state. Every level has a solution with 3 stars; one-launch wins exist only where the level is about that (Aquecimento, Mira fina, Efeito dominó) or are rare (a single tire shot in Lá no alto, about 0.6% of the aim grid). Shortcuts found while building (a balloon toppling the giant gnome, shoes sliding into the garage, the whole of Lá no alto with one tire) were closed or turned into stars limits.
- `sim.test.ts` keeps the nine solutions as golden replays (step count and score), plus the repeatability check. `rules.test.ts` covers accepted, tampered, wrong-level, old-format and impossible logs and lost levels.
- The nine solutions were played in Chrome through the real game: same score and stars as the simulation. Two levels played in real time against the local board were accepted as replayed on their level boards; the same runs sent faster than real time were refused as `too_fast`.

## Consequences

- Any change to a level's data, the gadgets or the thresholds changes trajectories and needs a new rules version for the street boards, as in [0009](0009-street-replay.md).
- Players' old street high score is replaced by the sum of their best level scores the first time they clear a level, as in every game with levels.

> Rules version 4 (2026-11-24): in "Caminho bloqueado" the crate starts at the edge of its beam (x 1272 → 1302), so knocking it into the pit no longer needs a pixel-perfect lob. Around the best aim, a 7×7 grid of whole degrees and percents goes from 27 to 47 cells that drop the crate, and the new 3-launch solution holds for 44, 48 and 39 of the 49 cells around each launch. About 1% of the aim grid now drops the crate and cuts the rope in one launch, a 2-launch route with the same 3 stars as the planned 3 launches. "Confusão geral" was measured too and is unchanged: its launches already hold for 34, 48 and 36 of 49 cells around the middle of each window. Only "Caminho bloqueado" starts an empty board. The other eight levels play exactly as in version 3, so the migration `20261124190000_street_v4_carry_over` copies each player's version 3 best onto the version 4 board of the same level, keeping whichever ranks higher (the earlier one on a tie). The first deploy of version 4 started all nine boards empty, and players who had cleared the campaign vanished from them while the game still showed their stars; from now on, a bump that changes only some levels carries the others' bests over the same way. The launch log stays `street-launches` version 2.
