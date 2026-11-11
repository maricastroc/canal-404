# 0006: Daily missions from a validated catalog, judged by the server

## Context

Stage 3 adds the "Missão 404 do Dia": one challenge per day, the same for every visitor, that brings people back to the channel. It has to feel like a special TV program, not a task list, and it must not be completable by a browser that simply says "done". The competition backend (decisions [0003](0003-competition-backend.md) and [0004](0004-result-validation.md)) already identifies players, signs run tickets, recomputes results from structured stats and replays Laboratório machines.

## Decision

### Catalog in code, snapshot in the database

- Missions are written in code, in `src/lib/missions/catalog.ts`: a key, a version, the game, the level, a title, the objective and a goal. A goal is a list of conditions (`{ stat, op: "min" | "max", value }`) over numbers the server already trusts. Code review and tests are the moderation step, and adding a mission is one entry plus its proof.
- The first request of a day stores that day's mission in `daily_challenges` (id = the day, `key`, game, level, a seed, `rules_version` = the entry's version, and a snapshot of title, objective, goal and ranking in `variant`). Inserts use `ON CONFLICT DO NOTHING`, so simultaneous first requests create one row. From then on the server reads the snapshot, never the catalog: editing or removing an entry never rewrites a past day, and changing a rule means bumping the entry's version for the days that come after.
- Nothing needs a cron job. If nobody asks for a day, it simply has no row.

### Selection

`pickMission(day)` is a pure function of the date. Inside each game, the missions are shuffled in cycles with a seed derived from the game and the cycle number, so each game goes through its whole list before repeating, and the order does not depend on where entries sit in the source. When the stored mission of yesterday happens to match today's pick (possible after a catalog change), the next candidate is used.

Which game a day belongs to comes from a dated list of rotations in `catalog.ts` (`ROTATIONS`). Each rotation starts on a fixed day and never changes after that day has been published:

| From | Games | How they take turns |
| --- | --- | --- |
| the start | Laboratório, Guerra de Lanche | alternate day by day (the Stage 3.1 rule, kept exactly) |
| 2026-11-16 (Stage 3.4) | Laboratório, Rua Sem Saída, Guerra de Lanche, Operação: Recreio, Guerra do Pijama | blocks of 5 days; each game appears once per block, in an order shuffled from the block number, and a block never starts with the game that ended the previous one |

So every game gets the same number of days, no game appears two days in a row, and a test pins every day already scheduled before the switch (2026-11-01 to 2026-11-15) to the mission it had. Stored days always win over the code: the day that is live when a deploy happens keeps its row. To add or remove a game, append a new rotation with a future start date; a rotation with fewer than three games that have missions falls back to the alternating rule, so a missing catalog never takes the API down. Férias Fora do Ar is not in the rotation: its result is the end of a long adventure, not something to repeat every day, and it keeps its permanent board.

### The day

The mission day is the calendar date in `America/Fortaleza`, computed on the server with `Intl`. Browsers never decide the day: the API returns the server time, the end of the day and the end of the grace hour, and the countdown runs from the difference between server and browser clocks.

### Playing a mission

- The mission page links to `/play/<game>?mission=<day>`. The game shell shows the brief and starts the mission level directly.
- A run is a mission run when the mission is active and the level matches. The shell then starts the game with the mission's own options, through the typed `StartOptions` every game already receives, instead of checks inside each game:
  - `setup` comes from the stored snapshot. Today it can only hold `character`, which Guerra do Pijama uses to skip the kid selection and play with that kid. The forced kid does not become the player's favorite, and "Trocar personagem" is hidden on the result.
  - `checkpoints: false` asks for a run from the start to the end. Operação: Recreio still rings its bells but does not save at them, so "Recomeçar", "Tentar a missão de novo" and a knockout all start the level again. Normal play keeps its bells.
- A mission run asks for a normal run ticket with `mission: <day>`. The server stamps the signed ticket with the day only if that day is today and the game and level match today's mission. A ticket without that stamp never counts for a mission, even on the mission level, so old or regular runs can't be reused.
- On submission, the run is judged exactly as before. The judge now also returns **evidence**: the checked stats plus, for the Laboratório, the step count the server simulated and how many placed parts the ball never touched (from the replay's own touch, belt and wind events). The mission goal is checked against that evidence, never against a flag from the browser.
- A run counts if its ticket was issued on the mission day and the result reaches the server before 01:00 of the next day (one grace hour). Later results still count for the normal boards, and the mission answer is "late".
- The run, its mission flag (`mission:<day>:completed|missed[:stat:value]|late`), the participation row and the day's ranking are written in the same transaction. Mission runs lock the player row first, so simultaneous results for the same player are processed one at a time; only the first passing run marks the completion. Retried submissions return the stored answer, rebuilt from the flag.

### Participation and ranking

- `challenge_entries` keeps one row per player and day: when they started (first mission ticket, or the first result), how many results arrived, when they completed it and with which run. The run reference is cleared if the run is deleted; the completion date stays.
- The day's ranking reuses `personal_bests` with the board `mission/<day>` and the game's own ranking keys (for the Laboratório, fewer parts and then the machine time). This needed `personal_bests.run_id` to stop being unique, because a mission run can also be the player's record on the regular board.
- The player's history is paginated by day with a cursor, and its final positions come from one window query.
- Progress counts the days with a completed mission, the current run of consecutive days (alive while the last completed day is today or yesterday) and the best run. The interface leads with the total, which never goes down.

### Achievements (Stage 3.2)

Mission achievements live in the existing `player_achievements` table (`source = verified`), one row per player and achievement, so a second grant is a no-op (`INSERT … ON CONFLICT DO NOTHING`). The definitions are in `src/lib/missions/achievements.ts`.

| Achievement | Exact rule | Granted |
| --- | --- | --- |
| Primeira Transmissão | the first completed mission | in the completion's transaction |
| Frequentador do Canal | completed missions on 3 different days, consecutive or not | same |
| Maratonista do 404 | completed missions on 7 different days, consecutive or not | same |
| De Volta ao Ar | a completion whose previous completed day is 8 or more days earlier (7 whole days or more without one) | same |
| Grade Completa (Stage 3.4) | completed missions in each of the five games of the rotation | in the completion's transaction |
| Campeão do Dia | 1st place on a closed day's board, with at least 2 people on it | when the day is settled |

- Completion achievements are computed from the player's completed days while the player row is locked, so simultaneous results cannot grant one twice or skip one. `player_achievements.run_id` points to the run that earned it, which lets a resent result answer with the same achievements.
- A day is **settled** by the first request (today's mission, the board or the history) that arrives after it closes at 01:00. Settlement claims the day with `UPDATE daily_challenges SET settled_at … WHERE settled_at IS NULL`, so only one request does it; it stores every visible player's final place in `challenge_entries` and grants Campeão do Dia. Hidden players are left out of the final ranking. No cron is needed, and a champion who never comes back still gets the achievement.
- The migration backfills the completion achievements for players who completed missions before they existed, dated by the completion that earned them.
- Coins, levels and experience points are deliberately absent.

### Daily ranking and progress (Stage 3.2)

- `GET /api/missions/board?day=&page=` serves any stored day, ten rows per page, with the player's own place and the previous and next days that had a mission. Closed days are marked as final and name the champion.
- The player's report shows a 14-day grade (completed, tried or no mission), the total of completed days, the days in a row only when there are 2 or more, the seals and how many days they finished first. Missed days are shown as empty, never as lost.

### In the broadcast room (Stage 3.3)

The room already had a TV with channels, a mascot with lines and many objects, so the mission uses those instead of a new panel:

- **The NO AR sign** above the TV is the mission's object. While a mission is on air it lights, its glow pulses and a "MISSÃO!" sticker sits on its corner; after the player completes it, the sticker reads "CUMPRIDA". Clicking it tunes the TV to the mission. Without the backend it stays a decoration that lights with the radio, as before.
- **Canal 09, Missão 404 do Dia**, is a TV channel that only joins the knob rotation while a mission exists. It shows a "Plantão" bulletin (game, level, title, a countdown that turns into "Última hora" in the last hour, or "Cumprida · Nº no placar"), and the whole screen is a link: "Jogar missão" opens the mission level, and after completion "Ver placar" opens `/mission`. The weekly game stays the default channel. The room TV and the zoomed TV read the same data through a context.
- **The mascot** opens with a mission line for returning visitors (new mission, already tried, completed with the day's place, the last hour) and after the welcome for new visitors. It warns once when the last hour starts, and announces the new mission if the day changes while the room is open. The greeting waits up to 2.5 seconds for the mission, so it never switches mid-sentence.

### What each mission checks

| Game | How the channel checks | Missions |
| --- | --- | --- |
| Laboratório | **Replayed**: parts, machine time and touched parts come from the server simulation | 7 missions; each has a proof machine in `catalog.test.ts` that the server accepts and that meets the goal |
| Guerra de Lanche | **Checked**: the stats must be consistent (0004); a best streak now also needs the combo points it would have earned | 5 missions based on numbers the game already defines (its 2-star score, its clean-round bonus, its streak achievement) |
| Rua Sem Saída (3.4) | **Checked** | 4 missions: win with at most 5 launches, a combo, 3 stars (2,050 points), 7 of the 10 yard things out of place |
| Operação: Recreio (3.4) | **Checked**; every goal also asks for a run that did not come back from a bell | 4 missions: the corridor with no bumps, the 4 yard stickers, the 9 yard monitors, the principal with at most 3 bumps |
| Guerra do Pijama (3.4) | **Checked**; the forced kid is checked from the run's stats | 4 missions: win in the bedroom taking at most 4 pillows, knock out both rivals in the living room, finish the living room with 7 energy or more, win in the yard as Lia |

Every goal is over numbers the server recomputes or bounds. The proofs in `catalog.test.ts` for the three new games are real results from bot runs of the games themselves, not invented ones, and each mission has a "plain" real run that does not meet it.

#### How reliable each new mission is (Stage 3.4)

None of these games is replayed, so a modified client that invents consistent stats and waits long enough can still complete their missions. Stage 3.4 closed the gaps the audit found and checked the new rules against 220 Rua Sem Saída, 26 Operação: Recreio and 54 Guerra do Pijama bot runs, all accepted.

| Mission | What the browser sends | What the server recomputes or bounds | What stays declared | Example of a manipulation the server rejects |
| --- | --- | --- | --- | --- |
| Mira econômica (Rua, ≤ 5 launches) | targets, target points, rounds, mess, combos, launches, ammo left, time | the score and stars; a win needs every target, launches + ammo left = 7 and at least one launch per round (3); time of at least 5.1 s plus 380 ms per extra launch, from the game's own round and reload timers | how many launches were really made | a win with 0 or 2 launches, or a 4-launch win in 3 s |
| Dois de uma vez (combo) | same | combos only in rounds that were finished, at most one per round with two targets (2 in total) and never more than the launches | that the two targets fell in the same flight | 4 combos, or a combo in a round that never ended |
| Três estrelas na rua (2,050 points) | same | the score from the parts above; the best possible match is 2,650, and anything above is impossible | the parts that add up to the score | the old forged 3,600-point instant win |
| Quintal de pernas pro ar (7 things) | same | mess between 0 and 10, worth 25 points each in the score | which things moved | 11 things out of place |
| Corredor sem arranhão (Recreio, 0 bumps) | kills, kill points, stickers, waves, bumps, hearts, bell, boss, time | hearts + bumps is at least 5 and, in a run from the start, at most 5 + the level's snacks; a lost run has 0 hearts; a clear can't be faster than Bruno runs | bumps, as long as hearts agree | 0 bumps with 3 hearts left, or a win resumed from a bell |
| Álbum completo (4 yard stickers) | same | stickers between 0 and the level's 4 | which stickers were picked | 5 stickers |
| Pátio liberado (9 yard monitors) | same | kill points must be a sum of the level's monitors; at most 9 in a run from the start; waves only where a whistle or a ball exists | which monitors fell | 9 kills worth 900 in the yard |
| Inspetor sem chance (≤ 3 bumps) | same | the boss flag only in the office, only on a win; hearts against bumps and snacks | bumps | a win without the boss, or 1 bump with 1 heart left |
| Quase sem marcas (Pijama, ≤ 4 pillows) | hits, knockouts, throws, energy, pillows taken, place, time, kid | energy + pillows taken is at least 10 (energy only comes back by resting); no pillows means full energy; each pillow taken costs at least 850 ms | the exact count of pillows taken | 0 pillows with 8 energy, or 30 pillows in 10 s |
| Nocaute duplo (2 knockouts) | same | knockouts never above the hits, and at most 0 for 3rd place and 1 for 2nd | who threw the last pillow | 2 knockouts in 2nd place |
| Energia de sobra (≥ 7 energy) | same | a win needs at least 1 energy and lasts at least 9 × 560 ms; energy against pillows taken | the energy, as long as the pillows agree | 9 energy after a 4 s war |
| A veloz no Quintal (as Lia) | same | the kid sets the throw rhythm: each throw needs the 130 ms windup plus that kid's cooldown | the kid, within that rhythm | a run as Bia that says it was Lia but throws faster than Lia can |

A rule that only rejects impossible results keeps its version, so the permanent boards stay the same; no run already stored is judged again.

### Rules for each situation

| Situation | Rule |
| --- | --- |
| The browser changes the score or stats | The server recomputes the result (0004); the Laboratório machine is replayed. The goal is checked against the server's evidence. A run the judge rejects never counts. |
| The same result is sent again | `runs.ticket_id` is unique: the retry gets the stored answer, attempts are not counted twice and no completion is granted twice. |
| Several results arrive at once | Mission runs lock the player row inside the transaction; the first passing run is the completion, the rest update attempts and the day's best. |
| The device clock is wrong | The day, the countdown and the grace hour come from the server. The browser only shows the difference. |
| The day changes during a run | The ticket carries the day it was issued. The run counts for that day if the result arrives before 01:00; after that it counts only for the normal board ("late"). |
| A mission link from another day | The server stamps tickets only for today's mission, so the game shows "Essa missão já saiu do ar" and plays normally. |
| A rule changes | Days already stored keep their snapshot; the new version applies from the next new day. |
| No nickname yet | The game can be played; the result panel asks for a nickname and then sends the result with the same ticket, which still counts for the mission. |
| The page reloads during a run | The `?mission=` link keeps mission mode; the interrupted run is lost, like any run, and the mission stays "em andamento". |
| The database is down | The game still works. A run that starts without a ticket does not count; a finished run waits in the outbox and counts if it reaches the server within the grace hour. The mission page shows "Sem sinal" with a retry. |
| Operação: Recreio after a knockout | In a mission the bells do not save, so every retry starts the level again. A run that still says it came back from a bell is answered "Quase!" with the reason. |
| Guerra do Pijama with a forced kid | The mission starts in the arena with that kid. A run with another kid misses the mission ("Você jogou com a Bia."), and the player's favorite kid stays the same. |
| A miss | The reason uses the game's own words: "A munição acabou antes da última rodada.", "Os corações do Bruno acabaram antes do fim da fase.", "Sua energia acabou antes do fim da guerra." |

## Consequences

- A Guerra de Lanche mission is only as strong as its board: a modified client that invents consistent stats can complete it. The mission page says how each game is checked, like the record arcade does.
- Adding a mission needs a proof in the catalog test. For the Laboratório the proof is a machine replayed by the same judge the server uses.
- Changing a goal's evidence (what a stat means) needs a new stat name, so old snapshots keep their meaning. That is why Operação: Recreio reports `bumps` instead of reusing Guerra de Lanche's `hitsTaken`.
- The day's board keeps each game's own ranking: Rua Sem Saída by points and then fewer launches (each unused object is already worth 250 points, so in the bot runs fewer launches almost always meant more points), Operação: Recreio by fewer bumps and then time, Guerra do Pijama by more energy and then time. A mission-specific order would make the day's board disagree with the permanent one and with the numbers the result shows.
- Missions need the backend. Without it the page says the mission is coming soon, and games keep working.
- The menu link to `/mission` does not prefetch the page, so every other page stays within the JavaScript budget; the catalog teaser and the result panel link still prefetch it.
- Links into `/play` (the room TV, game pages, the record arcade, the weekly link and the mission button) prefetch the game shell on hover, focus or touch instead of on page load. The game engine always loads after the click anyway, and this keeps about 90 KB off every page that shows a play link.
