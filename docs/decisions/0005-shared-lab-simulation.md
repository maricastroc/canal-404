# 0005: One Laboratório simulation for the browser and the server

## Context

The Laboratório is the only game whose result can be reproduced exactly: it steps physics at a fixed rate and has no randomness. But the physics lived inside Phaser's Matter plugin, the scene read part state from its sprites, and the step called `Math.sin` and `Math.cos`. That had three problems:

- The server can't run Phaser, so it could only check whether a machine was buildable, not whether it worked.
- `Math.sin` and `Math.cos` are not specified to the last bit. V8, SpiderMonkey and JavaScriptCore use different math libraries; on Node 22, about 2% of the angles between 0.2 and π/4 differ in the last bit from fdlibm. Physics is chaotic enough that one bit can, in rare cases, change where the ball ends up, so a record set in Safari could fail when replayed on the server.
- The level editor planned for Stage 3 needs to run machines outside the game.

## Decision

`src/games/bad-ideas-lab/sim.ts` is the only physics of the Laboratório.

- **No Phaser.** `LabSim` builds a fresh `matter-js` engine for each run, advances it in fixed steps of 1/60 s (`Matter.Engine.update(engine, STEP_MS)`), applies the fans, springs and belts, and decides the outcome (goal, out of the garage, stopped, timeout). It reports touches, spring launches, belt pushes and wind to the scene through callbacks. The scene only draws, plays sounds and narrates. `simulateLab(level, parts)` runs a machine to the end; the server uses it.
- **Same engine as before.** `matter-js` is pinned to exactly 0.20.0, the version bundled in Phaser 3.90. Phaser's copy differs only in render fields, wrapping, attractors and a speed value updated mid-step that the game read only to set the volume of collision sounds; the scene now computes that value the same way.
- **Deterministic trigonometry.** `trig.ts` is a port of fdlibm's `sin` and `cos` that uses only additions, multiplications and comparisons, which every JavaScript engine computes identically. The simulation replaces `Matter.Vertices.rotate` and `Matter.Axes.rotate`, the only places Matter uses trigonometry when creating bodies and during a step, and computes spring directions with it.
- **Fixed body order.** Floor, left edge, right edge, the level's blocks in level order, the goal's blocks, the parts in the order of the submitted list, and the ball last. The ball is always created after the static bodies, so it keeps the same side in every collision pair as before.
- **Explicit constants.** The resting thresholds (2 and √6) are set by the simulation, with the same values the game already used.

Anything that changes trajectories (the engine version, a constant, the trigonometry, the body order) must come with a new version of the Laboratório board in `src/lib/competition/rules.ts`, so old records are never compared with new physics.

## Evidence

- Before the extraction, the keyboard test that solves all six levels was run in Chromium and the step counts sent by the game were recorded: 235, 256, 242, 112, 241 and 295. After the extraction the game reports the same numbers for the same machines, and `STEPS_BEFORE_EXTRACTION` keeps them as golden values in the tests.
- `sim.test.ts` keeps a frozen copy of the old step loop running on Phaser's own Matter with `Math.sin`. On more than 1,000 machines (the known solutions plus every variant that moves one part up to three grid steps in any direction with every rotation):
  - plain `matter-js` produces bit-identical trajectories to Phaser's Matter;
  - the new simulation has the same outcome and the same step count on every machine, and bit-identical trajectories on more than 99% of them.

  A wider run of 2,536 machines during the extraction found two trajectories that differed in the last bits near the end, both with the same outcome and step count.
- `trig.test.ts` locks the exact output bits for a set of angles, checks symmetry bit for bit and keeps the distance to the engine's own `Math.sin` and `Math.cos` within two units in the last place.

## Server replay

The Laboratório rule first checks that the machine can be built in the level (grid, stock, build area, overlaps, using `geometry.ts`), then runs `simulateLab`. A machine that does not reach the goal is rejected (`replay_failed`). The ranking and the minimum time since the ticket use the step count the server measured, not the one the browser sent; a different claimed count is accepted and flagged `steps_mismatch` for moderation, since it can't change the ranking. A replay takes about a millisecond.

Replayed results are stored with `verification = replayed`, and the record arcade marks them as "máquina testada pelo canal".

## Consequences

- A Laboratório record is proof that the machine works, not that a person built it in the game: anyone who knows a solution can submit it. For a puzzle board that is the right thing to rank, and ties go to whoever got there first.
- The first-try bonus stays in the local score only.
- The level editor can run any `SimLevel` with `LabSim`, in the browser and on the server, without the game scene.
- The Laboratório play page now loads `matter-js` (about 80 kB minified) next to Phaser, whose bundle still contains its own copy of Matter.
