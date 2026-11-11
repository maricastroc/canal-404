# 0004: How results are ranked and validated

## Context

A public board invites cheating, and the browser can send anything. The games are very different: one deterministic physics puzzle, one physics toy with wall-clock timers, three real-time action games with unseeded randomness, and one multi-session adventure. A single "highest score wins" board would be unfair for some games and meaningless for others, and calling plausibility checks "anti-cheat" would be dishonest.

## Decision

### The server is the authority

Each game reports structured stats in `GameResult.stats` (and the Laboratório also sends the placed parts in `GameResult.replay`). The server never ranks by the score it receives: `src/lib/competition/rules.ts` recomputes the score, the stars and the ranking keys from the stats with the same constants the games use, and rejects the result if any of them differs from what the browser claimed.

### Ranking rules

| Game | Board | Order | Who enters |
| --- | --- | --- | --- |
| Rua Sem Saída | whole game | score, then fewer launches | finished matches with points |
| Laboratório | per level | fewer parts, then fewer simulation steps to the goal | solved levels except the practice level |
| Guerra de Lanche | whole game | score, then fewer puddings taken, then the best streak | finished rounds with points |
| Operação: Recreio | per level | fewer hits, then the fastest clear | cleared levels not resumed from a bell |
| Guerra do Pijama | per arena | more energy left, then the fastest win | wins |
| Férias Fora do Ar | whole game | score (discoveries), then shorter playtime | finished adventures |

The remaining tie goes to whoever got there first. The Laboratório first-try bonus stays in the local score but not in the ranking, because the server can't know how many times the machine was switched on.

### Validation levels

- **Checked** (every game except the Laboratório): the stats are complete integers inside the game's limits; the score, stars and win flag match; and the numbers are possible together. Examples: Rua Sem Saída target points must be a sum of real targets from the rounds reached, and ammo must add up; Guerra de Lanche can't end before the bell or score more than its throws allow; Operação: Recreio kill points must be reachable with the level's monitors and the clear can't be faster than Bruno can run; Guerra do Pijama can't throw faster than the chosen kid's cooldown; a Laboratório machine must be buildable in that level (grid, inventory, build area, overlaps, using the game's own `geometry.ts`).
- **Ticket timing** (every game except Férias Fora do Ar): the time since the ticket was issued must cover the time the match claims to have lasted (the simulated time for the Laboratório), with a small margin. Férias is played across sessions, so it only needs a valid ticket.
- **Stage 3.4** tightened the checks of three games with relations that hold in every real run (checked against bot runs of the games):
  - Rua Sem Saída: combos only in finished rounds and never above the launches; a win needs one launch per round and the time of the round and reload timers.
  - Operação: Recreio: hearts against bumps and the level's snacks, 0 hearts on a loss, waves only in levels with a whistle, a ball or the boss. A monitor may count twice only in a run resumed from a bell, where the game brings some monitors back.
  - Guerra do Pijama: energy against pillows taken, knockouts against the final place, the throw rhythm with the windup, and the time the safety after each pillow takes.
  - None of this changes a score or a ranking key, so the rule versions and the boards stay the same.
- **Replayed** (Laboratório, since Stage 2.2): the server runs the submitted machine in the shared simulation ([0005](0005-shared-lab-simulation.md)) and only accepts it if the ball reaches the goal. The ranking and the minimum time use the steps the server counted; a different count from the browser is flagged, not trusted.

### What this does not prevent

"Checked" means the result is consistent and physically possible, not that it was played by a person. A modified client that sends invented but consistent stats after waiting long enough will pass the checks for Rua Sem Saída, Guerra de Lanche, Operação: Recreio, Guerra do Pijama and Férias Fora do Ar. Closing that gap needs replays (fixed-step timers, seeded randomness and an input log per game), which is planned for Rua Sem Saída and evaluated game by game. Until then the record arcade marks only replayed results as "máquina testada pelo canal", explains under each board how it is checked, moderation can hide players, and repeated rejections pause a player.

## Consequences

- Adding a stat or changing a scoring constant in a game must be mirrored in its rule, and the rule tests (`rules.test.ts`) cover every game with valid, tampered and impossible results.
- Bounds are deliberately loose where the game allows wide variation; they catch impossible numbers, not good players.
