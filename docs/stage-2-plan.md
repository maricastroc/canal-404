# Stage 2 plan: competition, records and daily challenges

This is the technical plan for Stage 2, written after auditing the repository at `e5f14a5`. It lists what already exists, what each delivery depends on, how each game is ranked and validated, and what is still open. Decisions that change the code are recorded in [`docs/decisions`](decisions).

## What already exists

| Piece | Where | Reused for |
| --- | --- | --- |
| `GameModule` contract and one `finished` event per match | `src/games/types.ts` | Structured results ride on the same event: `GameResult.stats` and `GameResult.replay`. |
| Run lifecycle in the shell (`beginRun`, `finished`, abandon) | `src/components/game-shell/GameShell.tsx` | The only place that requests run tickets and submits results, like telemetry today. Games never talk to the network. |
| Local records per game and per level | `src/lib/progress/store.ts` | Stays the offline source of truth. The global board is an extra layer, never a replacement. |
| 25 achievements and 8 room secrets, unlocked locally | `src/lib/progress/definitions.ts` | Stage 2.4 adds cross-game achievements and server-confirmed ones on top. |
| Versioned saves | `src/lib/progress/migrate.ts`, decision 0001 | No save shape changes in 2.1. Anything new in `localStorage` gets its own versioned key. |
| Privacy-first telemetry | `src/lib/telemetry.ts`, decision 0002 | Same rules for the backend: no personal data, no free text except the nickname the player types. |
| Fixed 1/60 s physics step in the Laboratório and Rua Sem Saída | `LabScene.update`, `PlayScene.update` | The Laboratório result depends only on the step count, so it can be replayed. |
| Pure placement rules for the Laboratório | `src/games/bad-ideas-lab/geometry.ts` | Imported by the server to check a submitted machine before it is simulated. |
| One known solution per Laboratório level | `geometry.test.ts` (`SOLUTIONS`) | Golden fixtures for the headless simulation. |
| Weekly show rotation | `src/lib/schedule.ts` | Kept as is. The daily program uses a server clock in `America/Sao_Paulo` instead of the browser date. |
| TV channels, arcade cabinet, mascot lines, toasts | `src/components/room/*`, `ToastStack.tsx` | Entry points for the record arcade, the daily program and achievement announcements. |

## Findings that shape the plan

- None of the real-time games can be replayed today. Rua Sem Saída steps Matter at a fixed rate, but shots end, targets spawn and hit-stops run on `time.now`. Guerra de Lanche, Operação: Recreio and Guerra do Pijama use unseeded `Math.random` for spawns, AI and boss patterns, and tweens or variable `dt` for movement.
- The Laboratório is deterministic but lives inside Phaser's Matter plugin, reads part state from the sprites (`PartView`), and runs `Math.sin`/`Math.cos` inside the step. Results computed in Node can drift from Safari or Firefox by a few ulps.
- The Laboratório first-try bonus (+300) depends on how many times the player pressed LIGAR, which no server can check. It stays in the local score and is left out of the global ranking.
- Férias Fora do Ar is a multi-session story. Its result is a local save, so it can only be checked for plausibility.

## Dependencies

```
2.1 Foundation ──┬── structured results (stats, replay)
                 ├── anonymous identity (nickname + device key)
                 ├── Postgres + Prisma schema + migrations
                 └── API: players, run tickets, runs, boards, status
                         │
2.2 Competition ─┼── boards UI and personal records   (needs 2.1)
                 ├── headless Laboratório simulation  (needs nothing; blocks Lab replay and Stage 3)
                 └── per-game validation              (Lab needs the headless sim)
                         │
2.3 Daily program ── tickets carry the date and seed  (needs 2.1)
                 ├── daily boards                     (needs 2.2)
                 └── seeded randomness per game       (only for the formats that need it)
                         │
2.4 Shared achievements ── server-confirmed unlocks   (needs 2.1 runs and 2.2 verification levels)
                        └── cross-game secrets        (needs room and Férias hooks, no backend)
```

## Ranking rules

Every board orders players by up to three numbers, highest first, then by who got there first. The server computes these numbers from the submitted stats; the browser's score is only checked, never trusted.

| Game | Board | Order | Who enters |
| --- | --- | --- | --- |
| Rua Sem Saída | whole game | score, then fewer launches | any finished match with points |
| Laboratório | one per level | fewer parts, then the machine that reaches the goal in fewer simulation steps | solved levels |
| Guerra de Lanche | whole game | score, then fewer puddings taken, then the longest streak | any finished round with points |
| Operação: Recreio | one per level | fewer hits taken, then the fastest clear | cleared levels, not resumed from a bell |
| Guerra do Pijama | one per arena | more energy left, then the fastest win | wins |
| Férias Fora do Ar | whole game | most discoveries (score), then the shortest playtime | finished adventures |

Ties on all three numbers go to the earliest result. Each rule has a one-line explanation in pt-BR next to the board.

## Validation per game

| Game | 2.1 | Target | Status after Stage 2 |
| --- | --- | --- | --- |
| Laboratório | schema, placements checked with `geometry.ts`, inventory, score recomputed | server replay of the submitted machine with the shared simulation | **replayed**: a result is accepted only if the server's simulation reaches the goal |
| Rua Sem Saída | score recomputed from stats, reachable target sums, ammo bounds, ticket timing | launch log with step indices, replayed after timers move to step counters | **checked** until the replay exists; the replay is planned in 2.2 if the extraction stays small, otherwise moved to Stage 3 |
| Guerra de Lanche, Operação: Recreio, Guerra do Pijama | score recomputed from stats, bounds from level data, ticket timing | the same, plus seeded randomness for daily challenges | **checked** (plausibility only) |
| Férias Fora do Ar | score recomputed, minimum playtime | same | **checked** (plausibility only) |

"Checked" means the result is internally consistent and physically possible, not that it was played honestly. The board labels replayed results, and this limitation is written down in decision 0004 instead of being presented as anti-cheat.

Common protections for every game: run tickets signed by the server (single use, expire, carry the seed and the date), a minimum duration per run, idempotent submissions, rate limits per device and per hashed address, moderation flags, and a hidden status for suspicious players.

## Daily program feasibility

| Format | Feasible | Notes |
| --- | --- | --- |
| Laboratório: a level with a twist (fewer parts, a fixed part, a forbidden part) | high | Fully verifiable by replay. Best fit for a ranked daily. |
| Rua Sem Saída: special target layout | high for play, medium for validation | Layouts are data in `config.ts`; validation is plausibility until the replay lands. |
| Operação: Recreio: performance goal on an existing level (clear without hits, all stickers, under a time) | high | Uses the existing stats; no new mode. |
| Guerra do Pijama: special win condition (a given kid, a given arena, a time limit) | medium | Needs seeded AI so everyone faces the same fight. |
| Guerra de Lanche: precision goal (streak, hits per throw) | medium | Needs seeded spawns and the new `throws` stat. |
| Férias Fora do Ar | no | A one-time story; it gets cross-game secrets in 2.4 instead. |

The day is defined in `America/Sao_Paulo` and changes at 00:00 local time. The challenge is derived from the date with a fixed seed and stored the first time it is requested, so later code changes never rewrite a past day.

## Deliveries

### 2.1 Foundation
- `GameResult.stats` in all six games and `GameResult.replay` in the Laboratório.
- Prisma 7 + PostgreSQL (Neon in production, Docker locally), versioned migrations, schema for players, runs, personal bests, daily challenges, achievements and rate limits.
- Anonymous identity: nickname + server-generated device key in an `httpOnly` cookie, nickname moderation, deletion on request.
- Route Handlers with zod validation, signed run tickets, idempotent submissions, concurrent-safe personal bests, rate limits, a status endpoint, and graceful 503s when the database is missing or down.
- Shell integration: tickets on start, submission on finish, an offline outbox, and a small "Placar do canal" line in the result panel. Nickname card in Extras.
- Tests: unit (rules, nickname, tickets), database (persistence, idempotency, concurrency), API handlers, browser flow with and without the backend. CI gets a Postgres service.

### 2.2 Competition
- Record arcade UI: per-game boards, personal record, position, nickname, rules, loading, error and empty states.
- Personal vs global comparison in the result panel and a short record vignette.
- Headless Laboratório simulation (`matter-js` outside Phaser, canonical body order, deterministic trigonometry in the step), equivalence tests against the current scene, server replay before accepting results.
- Per-game bounds tuned with bot runs; Rua Sem Saída launch log if the timer refactor stays contained.

### 2.3 Daily program
- Daily challenge generator, daily tickets and boards, day change handling, a TV channel and mascot lines for the "Programa especial do dia".
- Seeded randomness only in the games whose daily format needs it.

### 2.4 Shared achievements
- Cross-game achievements and secrets with references between shows, room changes, announcements on the TV, sounds and toasts.
- Achievements granted by verified runs are confirmed by the server; achievements from local exploration stay local and are labelled as such.

## Risks

- **Floating point across browsers.** Mitigated by making the server the authority and by replacing trigonometry inside the simulation step; measured with the golden fixtures.
- **Free-tier limits.** Neon's free tier suspends idle databases; the first request after a pause is slower. The client times out after a few seconds and keeps the result in the outbox.
- **Moderation.** Nicknames are filtered, but a person can still find a way around a word list. There is a hidden status and a documented SQL procedure.
