# 0006: Daily missions from a validated catalog, judged by the server

## Context

Stage 3 adds the "Missão 404 do Dia": one challenge per day, the same for every visitor, that brings people back to the channel. It has to feel like a special TV program, not a task list, and it must not be completable by a browser that simply says "done". The competition backend (decisions [0003](0003-competition-backend.md) and [0004](0004-result-validation.md)) already identifies players, signs run tickets, recomputes results from structured stats and replays Laboratório machines.

## Decision

### Catalog in code, snapshot in the database

- Missions are written in code, in `src/lib/missions/catalog.ts`: a key, a version, the game, the level, a title, the objective and a goal. A goal is a list of conditions (`{ stat, op: "min" | "max", value }`) over numbers the server already trusts. Code review and tests are the moderation step, and adding a mission is one entry plus its proof.
- The first request of a day stores that day's mission in `daily_challenges` (id = the day, `key`, game, level, a seed, `rules_version` = the entry's version, and a snapshot of title, objective, goal and ranking in `variant`). Inserts use `ON CONFLICT DO NOTHING`, so simultaneous first requests create one row. From then on the server reads the snapshot, never the catalog: editing or removing an entry never rewrites a past day, and changing a rule means bumping the entry's version for the days that come after.
- Nothing needs a cron job. If nobody asks for a day, it simply has no row.

### Selection

`pickMission(day)` is a pure function of the date. Games with missions take turns day by day, so the same mission (and the same game) never appears two days in a row. Inside each game, the missions are shuffled in cycles with a seed derived from the game and the cycle number, so each game goes through its whole list before repeating, and the order does not depend on where entries sit in the source. When the stored mission of yesterday happens to match today's pick (possible after a catalog change), the next candidate is used.

### The day

The mission day is the calendar date in `America/Fortaleza`, computed on the server with `Intl`. Browsers never decide the day: the API returns the server time, the end of the day and the end of the grace hour, and the countdown runs from the difference between server and browser clocks.

### Playing a mission

- The mission page links to `/play/<game>?mission=<day>`. The game shell shows the brief and starts the mission level directly.
- A mission run asks for a normal run ticket with `mission: <day>`. The server stamps the signed ticket with the day only if that day is today and the game and level match today's mission. A ticket without that stamp never counts for a mission, even on the mission level, so old or regular runs can't be reused.
- On submission, the run is judged exactly as before. The judge now also returns **evidence**: the checked stats plus, for the Laboratório, the step count the server simulated and how many placed parts the ball never touched (from the replay's own touch, belt and wind events). The mission goal is checked against that evidence, never against a flag from the browser.
- A run counts if its ticket was issued on the mission day and the result reaches the server before 01:00 of the next day (one grace hour). Later results still count for the normal boards, and the mission answer is "late".
- The run, its mission flag (`mission:<day>:completed|missed[:stat:value]|late`), the participation row and the day's ranking are written in the same transaction. Mission runs lock the player row first, so simultaneous results for the same player are processed one at a time; only the first passing run marks the completion. Retried submissions return the stored answer, rebuilt from the flag.

### Participation and ranking

- `challenge_entries` keeps one row per player and day: when they started (first mission ticket, or the first result), how many results arrived, when they completed it and with which run. The run reference is cleared if the run is deleted; the completion date stays.
- The day's ranking reuses `personal_bests` with the board `mission/<day>` and the game's own ranking keys (for the Laboratório, fewer parts and then the machine time). This needed `personal_bests.run_id` to stop being unique, because a mission run can also be the player's record on the regular board.
- The player's history is paginated by day with a cursor, and its final positions come from one window query.
- Progress counts the days with a completed mission, the current run of consecutive days (alive while the last completed day is today or yesterday) and the best run. The interface leads with the total, which never goes down.

### What the first missions check

| Game | How the channel checks | Missions |
| --- | --- | --- |
| Laboratório | **Replayed**: parts, machine time and touched parts come from the server simulation | 7 missions; each has a proof machine in `catalog.test.ts` that the server accepts and that meets the goal |
| Guerra de Lanche | **Checked**: the stats must be consistent (0004); a best streak now also needs the combo points it would have earned | 5 missions based on numbers the game already defines (its 2-star score, its clean-round bonus, its streak achievement) |

The other four games join later, one at a time, each with goals over stats they already report. The interface only shows missions from the catalog, so a game without missions is never announced.

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

## Consequences

- A Guerra de Lanche mission is only as strong as its board: a modified client that invents consistent stats can complete it. The mission page says how each game is checked, like the record arcade does.
- Adding a mission needs a proof in the catalog test. For the Laboratório the proof is a machine replayed by the same judge the server uses.
- Changing a goal's evidence (what a stat means) needs a new stat name, so old snapshots keep their meaning.
- Missions need the backend. Without it the page says the mission is coming soon, and games keep working.
- The menu link to `/mission` does not prefetch the page, so every other page stays within the JavaScript budget; the catalog teaser and the result panel link still prefetch it.
