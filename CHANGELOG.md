# Changelog

Notable changes to Canal 404, newest first. Dates are in the release's own time zone (São Paulo).

## Unreleased

### Placar do canal (Stage 2.1)
- Every game now reports structured stats with its result (launches, parts, hits, throws, energy, time and more), without any change to how it plays or scores.
- A scoreboard backend in the portal itself: PostgreSQL with Prisma, anonymous players with a nickname and no account, signed run tickets, results recomputed and checked on the server, personal records that stay correct under concurrent submissions, rate limits and a daily cleanup ([decision 0003](docs/decisions/0003-competition-backend.md), [decision 0004](docs/decisions/0004-result-validation.md)).
- Each game has its own ranking rule and tie-break: fewer parts and a faster machine in the Laboratório, fewer hits and a faster clear in Operação: Recreio, more energy and a faster win in Guerra do Pijama, and points with explicit tie-breaks in the others.
- After a match, a "Placar do canal" line offers to join with a nickname, then shows the new personal record or your best and your position. When the board is down, the result waits in the browser and is sent later; the game never waits for the network.
- Extras has a membership card ("Carteirinha do placar") to choose or change the nickname, see what is stored, and leave the board, which deletes everything on the server.
- Without a configured database the board shows "Em breve" and nothing else changes. Setup: [`docs/backend-setup.md`](docs/backend-setup.md).

### Games
- **Férias Fora do Ar** now reacts to Déco just walking around:
  - Plants, umbrellas, suitcases, lanterns and other props rustle, wobble or jingle as he brushes past.
  - Residents turn to look at him.
  - The juice bar, kiosk, shed and other tall props fade when he walks behind them.
  - Critters: a kitten follows him in the lobby, koi dart away in the pool, gulls take off from the pier, frogs hop into the stream.
  - The sand keeps his footprints until the tide washes them away, and the pool and stream ripple.
  - The station monitors show him live, and the sleeping mascot in room 404 mumbles.
  - Two new background residents (Seu Coaxo and Seu Siri).
  - Fixes: stream and sea collisions, spawn points, the beach exit, the beachball and the lifeguard's nagging.
- **Operação: Recreio:**
  - Shield monitors no longer freeze after the first hit.
  - Restarting from a bell keeps the hits taken, so it no longer gives free stars.
  - Wave and ball points have their own row and a cap.
  - Monitors left behind no longer follow you into the boss fight.
  - The losing screen says "Voltar ao sino".
- **Guerra do Pijama:**
  - Staying out of the fight no longer pays: after a few seconds without hitting anyone, the other two call a truce and come after you ("ESCONDIDO?"), still one throw at a time.
  - A finished match can no longer hit the winner.
  - Opponents about to throw at you are announced with a sound and to screen readers.
  - Your remaining hearts are announced, and the score updates live.
- **Guerra de Lanche:**
  - Practice points no longer leak into the round.
  - The tutorial is remembered between visits.
  - Hitting a tray breaks the streak.
  - Food that misses a kid and flies behind them can hit the lunch lady, whether you aim with the mouse, Space or the number keys. Space prefers kids who aren't standing in front of her.
- **Rua Sem Saída:**
  - You can't shoot during a round change.
  - Leftover projectiles are cleared before new targets appear.
  - The result shows launches, targets and the points needed for the next star.
- **Laboratório de Péssimas Ideias:**
  - On phones, the parts tray and level card no longer cover the build area.
  - Failed runs end sooner, and any key or click skips the wait.
  - The first-try bonus now requires solving on the first run.

### Portal
- The TV is a living channel: one channel per game, a weekly show that rotates, "INÉDITO" for shows you haven't watched and an "A SEGUIR" suggestion.
- Catalog cards show "Inédito!", "Reprise" or "Aventura salva" and the weekly show.
- After each match, a "Depois do intervalo…" card suggests another game.
- The room reacts to progress:
  - The trophy shines once you have a record.
  - Cartridges light up for games you've played.
  - The mascot's greeting mentions what you haven't played yet.
- The room TV no longer turns white with reduced motion, and the blackout message is announced.
- Sharing a link shows a proper preview with the room or the game's art.
- Every page has its own title and description, and the site has a sitemap and robots rules.
- A "Sinal perdido" screen replaces broken pages. A game that fails to download after a new deploy reloads the page instead of failing again.

### Saves
- Saves carry a version and are migrated instead of discarded. Anything that can't be read is backed up first ([decision 0001](docs/decisions/0001-save-versioning.md)).
- "Continuar aventura" only appears for a save that can actually be loaded.
- "Apagar meu progresso" also erases saved adventures and per-game records.

### Infrastructure
- Server and database tests (Postgres in CI), browser tests for the scoreboard with and without the backend, and axe accessibility checks for the new panels.
- Privacy-first gameplay events (start, finish, abandon, load errors) through one module, sent to Umami only when it's configured ([decision 0002](docs/decisions/0002-privacy-first-telemetry.md)).
- Visual regression tests for the portal pages, rendered in the Playwright Linux container so they match CI.
- A JavaScript budget per portal page.
- A roadmap (`ROADMAP.md`) and this changelog.

## 2026-10-26

- Tests: unit, component and end-to-end suites with CI on GitHub Actions.
- Laboratório de Péssimas Ideias playable from start to finish with a screen reader.
- README screenshots.
- Férias Fora do Ar: sign, dialog and journal polish; Seu Lento hands over the room 404 key after the ending; Chiadinho is easier to find.

## 2026-10-25 and earlier

- The six games and the broadcast room, built from the first commit on 2026-10-23.
