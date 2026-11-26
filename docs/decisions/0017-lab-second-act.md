# 0017: Laboratório de Péssimas Ideias gets a second act

## Context

A comparative audit (2026-11-25) found the Laboratório still at the portal's bar in art, interface, onboarding, phones and accessibility, but behind in two places:

- The six levels happen in the same room, drawn the same way. Only two or three shelves and the goal change.
- The campaign ends as soon as every part has been introduced. The minimum machines use 1, 1, 1, 1, 2 and 2 parts, so the player never builds a machine where parts work in sequence.

## Decision

### Ten levels in two acts

- The six levels stay exactly as they were (ids, data, solutions, golden steps, boards, missions) and become Act 1. Four levels are appended as Act 2: `kibble`, `vinyl`, `strike` and `chain`. They are appended, not inserted, so each player's per-level records, the unlock rule (the level after the furthest one won), the boards (`bad-ideas-lab/<level>/v1`) and the missions keep working without a migration.
- No new parts, no physics change, no scoring change. `LabSim`, the constants, the body order and the rules version are untouched; the new levels only add boards.
- New goals are data in `geometry.ts`. `feeder` uses the remote's shapes and `record` the toaster's; `pins` (a wide sensor in front of a backboard) and `button` (a tall panel with the sensor on its left face) are new.
- The HUD and the narration name the act ("ATO 2 · FASE 7 DE 10").

| Level | Idea | Box | Par | One part | Two parts | Three parts |
|---|---|---|---|---|---|---|
| Pazes com o Pixel (`kibble`) | The ball rolls the wrong way over a long shelf; a reversed belt brings it back under the shelf to the feeder | belt, ramp | 2 | none | 12,022, all with the belt pointing left | — |
| Música lá no alto (`vinyl`) | The ball drops down a chimney; a spring throws it back up and wind or a ramp steers it at the top | spring, ramp, fan | 2 | none | 4,843 (4,469 spring + fan, 503 spring + ramp) | — |
| Strike! (`strike`) | A fan gives the ball a run-up on the counter; a ramp at the end becomes a ski jump over the gap | fan, 2 ramps | 2 | none | 604, all fan + ramp | — |
| A máquina de tudo (`chain`) | A transport (belt, ramp or fan) to a spring under a window, a straight-up launch, then a push (fan, ramp or belt) through the window | ramp, spring, fan, belt | 3 | none | none in 1.29 million pairs | 189,791 |

### How the levels were designed

A scratch solver enumerated every placement on the 20 px grid with every rotation: each single part that touches the ball's path, then each second part that touches the path the first one makes, and for the finale a guided third step (transport, then spring, then whatever reaches the top). Levels were adjusted until no single part (and, for the finale, no pair) solves them, while the intended combination works across a wide area:

- Around each reference machine, moving any one part by up to two grid steps still works in 58% of the cases in `kibble`, 83% in `vinyl`, 52% in `strike` and 67% in `chain`.
- The spring sets the ball to 21 px per step, so it reaches almost anywhere when it can catch a long fall. Act 2 limits where it can launch from (a chimney, short drops) and protects goals with roofs, walls and a window.
- A rolling ball can't climb onto a part: every part is thicker than the ball's radius. Parts that carry the ball must catch it as it falls.

The reference machines are in `solutions.ts`, with their step counts in `GOLDEN_STEPS` (renamed from `STEPS_BEFORE_EXTRACTION`, see [0005](0005-shared-lab-simulation.md)). The tests replay them in the simulation and through the server judge.

### Completion

- `lab-complete` (Cientista Maluca) is given by the last level, now `chain`. Players who earned it on the old finale keep it, since achievements are never taken back. There is no migration.
- A player who had finished the six levels finds level 7 open and suggested. The campaign stars go from 18 to 30.
- "A pior ideia de todas" closes Act 1: its result says "Fim do primeiro ato!" and its line teases Act 2. "A máquina de tudo" says "Laboratório concluído!" and carries the cross-promotion that used to follow the old finale.
- Missions are unchanged.

### Presentation

- The room accumulates what earlier levels left behind. In level N, everything from levels 1 to N-1 is there. Each level places the mementos itself (`room.ts`) away from its build area, blocks, goal, pipe and the paths the ball takes. They are drawn behind all physics and have no collision.
- During a run, Lina follows the ball with her eyes and covers her ears on every spring launch. She covers her eyes while the ball is above the garage, clenches her fists on a near miss and gasps when the machine beats the par.
- Bruno has one cameo, at the end of the finale's chain reaction, with his catchphrase. He stays in the cast without competing with Lina.
- A near miss is geometric: the ball's edge got within one ball diameter (44 px) of the goal's sensor box. The screen reader measures the same distance in steps. "Quase!" lines only play then, and the trail marks the closest point.
- A run where a spring launches the ball four times in a row from the same spot, within 4 px, is periodic and can never reach the goal. The scene turns it off. The simulation and the server don't change, because failed runs are never submitted.
- Lina's speech bubble picks the position that covers least of the goal, the build area, the blocks and the pipe. Phones in portrait move the coach dialog down while the win banner is up. On a win, they frame the goal's reaction instead of showing the cheer, which the result card repeats.
- Wins on desktop and on landscape phones dim the room around the goal's reaction. The finale's chain reaction instead spans the room. It lasts about 5.6 s, and a tap, Space or Enter skips it after 0.9 s.
- Reduced motion turns off the window cloud, the blinking LED, the tweens in the chain and the eye tracking. The pose changes stay.

## Consequences

- Any change to the data of one of the four new levels changes its trajectories. It needs a new rules version for that level's board only, carrying the other boards over as in [0011](0011-street-campaign.md).
- A new Laboratório level needs a solver run like these before it ships, recorded in its decision.
