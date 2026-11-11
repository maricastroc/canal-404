# Roadmap

Canal 404 grows in small, verifiable deliveries. Player experience drives the order: a feature lands when it makes the games more fun to play, explore or share, and it is done only when it is tested in the real game. Decisions that shape the code are recorded in [`docs/decisions`](docs/decisions); shipped changes are listed in [`CHANGELOG.md`](CHANGELOG.md).

## Stage 1: Polish and essential infrastructure

- [x] Share previews: Open Graph images made from the real art (`npm run og`), per-page metadata, sitemap and robots.
- [x] Game fixes found in the audit:
  - Operação: Recreio: shield monitors no longer freeze, bell restarts keep the hits taken, wave and ball points are listed and capped, leftover monitors leave the boss arena.
  - Guerra do Pijama: a finished match can no longer hit the winner.
  - Guerra de Lanche: practice points no longer leak into the round, and the tutorial is remembered.
  - Rua Sem Saída: no shots during a round change, and a result summary with a next-star hint.
  - Laboratório: the first-try bonus can't be farmed, and failed runs are reported sooner and can be skipped.
- [x] Room TV no longer turns white with reduced motion.
- [x] Versioned saves with migrations and backups ([0001](docs/decisions/0001-save-versioning.md)).
- [x] Privacy-first gameplay events and a "Sinal perdido" error screen ([0002](docs/decisions/0002-privacy-first-telemetry.md)).
- [x] Férias Fora do Ar responds to the player: brushing props, residents who notice Déco, critters, water and sand feedback, collision and depth fixes.
- [x] A living channel: weekly show, one TV channel per game, "INÉDITO / REPRISE / AVENTURA SALVA" stickers, a next-show suggestion after each match, a room that reacts to progress.
- [x] Visual regression tests for the portal pages (Linux snapshots in the Playwright container) and a JavaScript budget per page in CI.
- [x] Guerra do Pijama: an audible warning before an opponent throws at you, energy announcements and a live score.
- [x] Guerra de Lanche: a tray block breaks the streak.
- [x] Rua Sem Saída: spent projectiles are cleared before new targets appear.
- [x] Guerra do Pijama: hiding no longer pays; the other two call a truce against a player who stays out of the fight.
- [x] Guerra de Lanche: food that misses a kid can hit the lunch lady behind them, for every input; Space avoids kids standing in front of her.
- [x] Laboratório on phones: the parts tray and level card shrink just enough to keep the whole build area visible.
- [ ] Férias Fora do Ar: residents fade when hidden behind tall props; critters respect furniture.
- [ ] Trim the portal's JavaScript (about 1.1 MB per page today), starting with the broadcast room re-rendering on every pointer move.

## Stage 2: Competition and coming back

Plan, dependencies and per-game feasibility: [`docs/stage-2-plan.md`](docs/stage-2-plan.md).

### 2.1 Foundation

- [x] Structured results: every game reports integer stats (time, hits, throws, launches, parts, energy…) next to the human-readable breakdown; the Laboratório also sends the machine it built.
- [x] Backend in Next.js Route Handlers with Prisma 7 and PostgreSQL (Neon in production, Docker locally), versioned migrations and `CHECK` constraints ([0003](docs/decisions/0003-competition-backend.md)).
- [x] Anonymous identity: a nickname plus a server key in an `httpOnly` cookie, nickname filter, "Sair do placar" deletes everything.
- [x] Signed run tickets, idempotent submissions, concurrent-safe personal records, rate limits, retention job, clear 503s when the database is missing or down.
- [x] Ranking and tie-break rules for every game, recomputed on the server from the stats, with plausibility checks ([0004](docs/decisions/0004-result-validation.md)).
- [x] Shell integration: tickets on start, results sent on finish, an offline outbox, a "Placar do canal" line in the result panel and a membership card in Extras.
- [x] Tests: rules and tie-breaks, nicknames, tickets, database persistence and concurrency, API routes, browser flows with and without the backend, axe checks; CI runs them against Postgres.
- [x] Production database and secrets on Vercel ([setup](docs/backend-setup.md)).

### 2.2 Competition

- [x] Record arcade (`/records`): a cartridge per game, a level or arena picker, the top ten with nickname and tag, your place even outside the top, the house rule and how the channel checks each board, and loading, empty, no-signal and not-open-yet states. Reached from the menu, the trophy in the room, each game page, the result panel and the membership card.
- [x] Personal vs global comparison in the result panel ("Recorde do canal: …"), a record stamp, a mascot reaction and a link to the full board.
- [x] Headless Laboratório simulation shared by the browser and the server: pinned `matter-js` outside Phaser, a fresh engine per run, a fixed body order, deterministic trigonometry, golden step counts recorded from the old scene and equivalence tests against it ([0005](docs/decisions/0005-shared-lab-simulation.md)).
- [x] Server replay of Laboratório results before they enter the board; replayed records are marked "máquina testada pelo canal".
- [ ] Per-game bounds tuned with bot runs.
- Moved to Stage 4: Rua Sem Saída launch log replay, because its timers have to move to step counters first.

Daily challenges and shared achievements (planned here as 2.3 and 2.4) became Stage 3.

## Stage 3: Daily mission and achievements

Decision: [0006](docs/decisions/0006-daily-missions.md).

### 3.1 Missão 404 do Dia

- [x] A catalog of missions in code, each with a proof that the server accepts it, and one mission per day picked from the date in `America/Fortaleza`, stored the first time it is asked for. No cron.
- [x] Missions for the Laboratório (replayed: parts, machine time, parts the ball touched) and Guerra de Lanche (checked stats).
- [x] Mission tickets: the server stamps the day only for today's game and level, and judges completion from the verified result. One grace hour after midnight.
- [x] Participation per player and day, the day's ranking on `personal_bests`, a paginated history and progress in days.
- [x] The `/mission` page (a cartridge with the mission, a VCR countdown, the player's report, the day's board and recorded tapes), a menu item, a teaser in the catalog, and the mission brief, header tag and result line inside the game.

### 3.2 Achievements and competition

- [x] Five server-granted, idempotent mission achievements (Primeira Transmissão, Frequentador do Canal, Maratonista do 404, De Volta ao Ar, Campeão do Dia), shown in Extras with their dates and in the player's report. Closed days are settled without a cron.
- [x] The full daily ranking with pages, for today and every past day, with the champion of closed days.
- [x] A completion moment with the new achievements in the result and as toasts, and a 14-day grade in the report.
- [x] Links into the games prefetch the game shell only on intent, keeping about 90 KB off pages with a play link.

### 3.3 In the broadcast room

- [x] The NO AR sign lights with a "MISSÃO!" sticker while a mission is on air and tunes the TV to it; Canal 09 shows the mission bulletin with a play button; the mascot has lines for a new, tried, completed and ending mission and for a new day.
- [x] Polish, accessibility and end-to-end tests for the whole loop, including a fix for the TV's "A seguir" button name.

### 3.4 Missions for every game in the rotation

- [x] Four missions each for Rua Sem Saída, Operação: Recreio and Guerra do Pijama, with goals and proofs taken from bot runs of the games.
- [x] Tighter checks for the three games, found by an audit and checked against 300 bot runs, and a reliability table per mission in decision 0006.
- [x] A dated five-game rotation from 2026-11-16, balanced and never repeating a game on consecutive days, that keeps every earlier day as it was.
- [x] Typed mission start options: a forced Guerra do Pijama kid, and runs from the start in Operação: Recreio.
- [x] Misses explained in each game's words, the Grade Completa achievement, and end-to-end tests for each new game.
- Férias Fora do Ar stays out of the rotation, with its permanent board.

## Stage 4: Player-made levels


Depends on the headless simulation and the backend.

- [ ] Rua Sem Saída replay: timers on step counters, a launch log in the result and a server replay.
- [ ] Laboratório level editor inside the game's own workshop.
- [ ] Publishing only levels with a solution proven by the server, with size and complexity limits and validated input.
- [ ] Sharing by link, and playing other players' levels safely.

## Stage 5: Expansion

- [ ] Themed events (Halloween, festa junina) built on the daily mission.
- [ ] Gamepad support.
- [ ] English version of the interface.
- [ ] New shows.
