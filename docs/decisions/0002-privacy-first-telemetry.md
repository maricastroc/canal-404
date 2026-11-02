# 0002: Privacy-first gameplay telemetry

## Context

The portal had no analytics and no error reporting. Game errors were swallowed by the shell, and there was no way to know which games are started, finished or abandoned, or where players give up. The project is a hobby portal for all ages, so collecting personal data is not acceptable, and the setup has to stay cheap to maintain.

## Decision

- All events go through one module, `src/lib/telemetry.ts`, with a closed list of typed events: `game_start`, `game_finish`, `game_abandon`, `game_load_error` and `client_error`.
- Events carry only the game, the level id, the attempt number in the session, the outcome, the score, the stars and a rounded duration. No identifiers, no free text from players, no query strings. Error messages are truncated to 120 characters and each page reports at most 8 distinct errors.
- The shell (`GameShell.tsx`) is the only place that emits gameplay events, so games stay independent of analytics.
- The destination is Umami, which is cookieless, honors Do Not Track and is open source. Its script only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set; without it, nothing leaves the browser.
- Route errors render a "Sinal perdido" screen (`app/error.tsx`, `app/global-error.tsx`), and a failed game download after a deploy reloads the page instead of retrying a stale chunk.

## Consequences

- Questions like "how many people finish Laboratório level 3" or "which game is abandoned the most" can be answered from aggregated events, which is enough to guide balancing.
- This is not a full error tracker: there are no stack traces or session context. If error volume grows, Sentry (or similar) can be added behind the same `reportError` function.
- New events must be added to the `TelemetryEvent` type, which keeps the list short and reviewable.
