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

Depends on Stage 1's structured results and telemetry.

- [ ] Structured results: every game reports numbers (time, hits, throws, kills, attempts) next to the human-readable breakdown.
- [ ] Fixed-step clocks and seeded gameplay randomness in Rua Sem Saída, Guerra de Lanche, Operação: Recreio and Guerra do Pijama.
- [ ] Headless Laboratório simulation shared by the browser and the server: fresh engine per run, canonical part order, no trigonometry in the step loop, golden step counts in tests.
- [ ] Backend: database, anonymous player identity (a nickname plus a device key, no account), rate limits.
- [ ] Global rankings per game with per-game validation:
  - Laboratório is validated by server replay.
  - Rua Sem Saída is validated by replaying the launch log.
  - Lanche, Recreio and Pijama are validated with plausibility bounds and event logs.
  - Every game has clear tie-break rules.
- [ ] Daily program: a seeded challenge per day in a different game, with its own ranking.
- [ ] Cross-game discoveries: achievements for unexpected actions, secrets that reference other shows, a room that changes as the player progresses.

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
