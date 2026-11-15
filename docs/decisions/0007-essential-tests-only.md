# 0007: Test only what breaks silently and costs a lot

## Context

By November 2026 the project had 70 test files (about 7,900 lines): 530 Vitest cases, 15 Playwright specs and a visual regression job with Linux snapshots refreshed in Docker. Most of them had been written alongside each feature, one per detail: tape timings, karaoke syllables, mascot lines, result copy, bot behavior, level layouts, component markup, axe checks and per-page JavaScript budgets. The end-to-end job took 16 to 26 minutes in CI, and every polish round had to rewrite tests and snapshots that only pinned how something looked or was worded. Those tests slowed every change without protecting anything a player or the scoreboard depends on.

## Decision

Keep a test only when it guards something that breaks **silently** and **costs a lot** when it does. Three kinds qualify:

1. **Player data.** Saving, loading, migrating, backing up and erasing what lives in `localStorage` (`src/lib/progress/store.test.ts`, `migrate.test.ts`, the Férias and Guerra do Pijama save tests). Losing a save is the worst thing the portal can do to a visitor.
2. **Scoreboard and mission integrity.** The server judge (`rules.test.ts`), signed tickets, the API's security (cross-site writes, cookies, rate limits, the cron secret, forged and tampered results), idempotent and concurrent submissions, erasure when a player leaves, hidden players, the mission day in America/Fortaleza and its grace hour, every mission having a run the server accepts (`catalog.test.ts`), the Laboratório simulation giving the golden step counts the server replays (`sim.test.ts`, `trig.test.ts`), and client scoring that must match the judge (`pajama-war/score.test.ts`). A mistake here rejects honest runs or accepts cheats in production, and nobody sees it until players complain.
3. **One end-to-end smoke per flow.** Every game opens from its page, starts, pauses and resumes; the room and every section open from the navigation; progress survives a reload; a Férias adventure continues after a reload; the scoreboard accepts a replayed Laboratório run; the day's mission can be missed and then completed; a game stays playable with the board down; the phone menu and a phone match work.

Everything else is not tested automatically: copy and wording, animation and tape timings, layout and visuals, component markup, accessibility announcements, game balance and bot behavior, level and story content, data tables that TypeScript or a quick play already checks, and performance budgets. These are verified by playing, by the scratchpad bots when a round needs them, and by review.

Removed with this decision: the visual regression job and its snapshots (`scripts/visual-docker.sh`, `test:visual*`), the JavaScript budget spec, the axe checks, every component test, and the Testing Library, axe and Vitest React plugin dependencies. Unit tests went from 530 cases to 146 (about 3.7 s instead of 12 s, DB tests included when Postgres is up), and end-to-end from 101 tests (plus 9 visual snapshots) to 14 (46 s against a local production build).

## Rules for new work

- A new feature does not get tests by default. Add one only when it falls into one of the three kinds above, and prefer extending an existing test over a new file.
- New scoring rules, stats or mission goals extend `rules.test.ts` or `catalog.test.ts` with a real accepted run and the tampered or impossible variants.
- A new saved format extends the save tests (load, older version, corrupted save, backup).
- A new game gets no unit tests; it shows up in the `games.spec.ts` smoke through the registry.
- Never add a test that pins copy, timings, coordinates, colors or markup.
- Fixing a bug does not require a regression test unless the bug is one of the three kinds above.

## Consequences

- Polish rounds no longer pay for rewriting tests and snapshots; visual regressions are caught by looking at the pages, not by CI.
- A broken animation, wrong copy or unbalanced arena can reach `main`. That is accepted: these are visible the first time someone plays, and cheap to fix.
- The test names that remain describe behavior a player or the scoreboard relies on, so a red test always means something worth stopping for.
