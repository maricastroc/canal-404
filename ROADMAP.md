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
- [ ] Production database and secrets on Vercel ([setup](docs/backend-setup.md)).

### 2.2 Competition

- [ ] Record arcade: per-game boards with the rule explained, personal record, position, loading, error and empty states, reachable from the room's arcade cabinet.
- [ ] Personal vs global comparison and a short record vignette in the result panel; mascot reactions.
- [ ] Headless Laboratório simulation shared by the browser and the server: `matter-js` outside Phaser, fresh engine per run, canonical part order, no trigonometry differences in the step loop, golden step counts in tests, equivalence tests against the current scene.
- [ ] Server replay of Laboratório results before they enter the board.
- [ ] Rua Sem Saída launch log replay, if the timers can move to step counters without changing the game.

### 2.3 Daily program

- [ ] A daily challenge per day in São Paulo time, stored the first time it is requested, with its own board and day-change handling.
- [ ] Formats built on existing mechanics: Laboratório twists, Rua Sem Saída layouts, Operação: Recreio goals; Guerra do Pijama and Guerra de Lanche only after seeding their randomness.
- [ ] A TV channel and mascot lines for the "Programa especial do dia".

### 2.4 Shared achievements

- [ ] Cross-game achievements and secrets that reference other shows, confirmed by the server when they come from validated runs.
- [ ] Room changes, TV announcements, sounds and toasts for them.

## Stage 3: Player-made levels

Depends on the headless simulation and the backend.

- [ ] Laboratório level editor inside the game's own workshop.
- [ ] Publishing only levels with a solution proven by the server, with size and complexity limits and validated input.
- [ ] Sharing by link, and playing other players' levels safely.

## Stage 4: Expansion

- [ ] Themed events (Halloween, festa junina) built on the daily program.
- [ ] Gamepad support.
- [ ] English version of the interface.
- [ ] New shows.
