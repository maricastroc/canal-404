# 0002: Privacy-first gameplay telemetry

## Context

The portal had no analytics and no error reporting. Game errors were swallowed by the shell, and there was no way to know which games are started, finished or abandoned, or where players give up. The project is a hobby portal for all ages, so collecting personal data is not acceptable, and the setup has to stay cheap to maintain.

## Decision

- All events go through one module, `src/lib/telemetry.ts`, with a closed list of typed events: `game_start`, `game_finish`, `game_abandon`, `game_load_error`, `board_submit` and `client_error`.
- Events carry only the game, the level id, the attempt number in the session, the outcome, the score, the stars, a rounded duration and, for `board_submit`, what the board did with the result (`record`, `accepted`, `queued` and so on). No identifiers, no free text from players, no query strings, with one exception below. Error messages are truncated to 120 characters and each page reports at most 8 distinct errors, counting `game_load_error` and `client_error` together.
- The shell (`GameShell.tsx`) is the only place that emits gameplay events, so games stay independent of analytics.
- The destination is Umami, which is cookieless, honors Do Not Track and is open source. Its script only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set; without it, nothing leaves the browser.
- The one exception to "no query strings" is the channel tag. Links in social bios carry `?utm_source=tiktok` (and so on), and the share button on the result screen adds `?utm_source=share`, so we can tell which channel brings visitors who play. A `data-before-send` hook in the root layout rewrites the page URL and the referrer of every Umami payload: it keeps `utm_source` only when the value is a short lowercase slug (`^[a-z0-9-]{1,24}$`) and drops every other parameter. A channel slug names a place, not a person, so it is not personal data. Everything else in the query string is still dropped before it leaves the browser.
- Route errors render a "Sinal perdido" screen (`app/error.tsx`, `app/global-error.tsx`), and a failed game download after a deploy reloads the page instead of retrying a stale chunk.

## Consequences

- Questions like "how many people finish Laboratório level 3" or "which game is abandoned the most" can be answered from aggregated events, which is enough to guide balancing.
- This is not a full error tracker: there are no stack traces or session context. If error volume grows, Sentry (or similar) can be added behind the same `reportError` function.
- New events must be added to the `TelemetryEvent` type, which keeps the list short and reviewable.
