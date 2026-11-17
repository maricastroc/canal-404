# 0008: English under /en, with copy in typed bilingual objects

## Context

Until November 2026 everything on screen was in Brazilian Portuguese, written inline in about 125 files: React Server and Client Components, plain modules in `src/lib`, Phaser scenes, SVG art, and one piece of server data (the mission title and objective snapshotted in `daily_challenges`). The site is statically rendered, pt-BR links are already shared around, and the roadmap asked for an English version. The games hold most of the text (Férias Fora do Ar alone has about 4,000 words), so the work is split: the portal first, then each game.

## Decision

- **Routes.** Every page lives under `src/app/[lang]`, with `pt-BR` and `en` as the only values. `next.config.ts` rewrites unprefixed paths to `/pt-BR/...` (as `afterFiles` rewrites, so API routes, metadata routes and public files are served first) and permanently redirects `/pt-BR/...` back to the unprefixed URL. pt-BR URLs never change; English lives at `/en/...`. Pages stay static: the root layout generates both locales. There is no redirect by `Accept-Language` or cookie: the URL is the only language state, and the language switch reloads the same page in the other language. URLs that match no page are answered by `src/app/global-not-found.tsx` (`experimental.globalNotFound`): with the root layout under `[lang]`, Next 16 does not server-render a `notFound()` thrown inside a page, so the global page renders the 404 in both languages and a tiny inline script shows the one that matches the URL (without JavaScript it shows pt-BR).
- **Copy.** Text goes in `localized({ "pt-BR": {...}, en: {...} })` (`src/i18n/copy.ts`). TypeScript infers the shape from the pt-BR side and requires the same shape in English, so a missing or extra key fails `npm run typecheck`. Client Components read the language with `useCopy`/`useLocale`, Server Components with `getLocale()` (`next/root-params`), and functions in `src/lib` that return text take `locale` as their last parameter. Numbers, dates and ordinals go through `src/i18n/format.ts`, never a hard-coded `"pt-BR"`.
- **Links.** `@/i18n/Link` replaces `next/link` and adds `/en` when needed; `useLocaleRouter`, `useLocalePath` and `useLocalPathname` cover navigation in code. Internal hrefs are always written unprefixed.
- **Game metadata.** `src/games/registry.ts` keeps structure (slug, category, levels, guests) apart from text, and the text table for both languages is checked the same way. `getGame(slug, locale)`, `gamesIn(locale)` and `playableIn(locale)` return the localized entries; `GAMES` is the pt-BR list, fine for ids and structure.
- **The server stays in Portuguese.** API error messages, the board rule (`explain`) and the mission snapshot keep their pt-BR text, so nothing about the API or the stored data changed. The client shows localized text chosen by error code, rejection reason or mission key. `missionText` uses English only when the mission key and rules version match the catalog, and falls back to the snapshot otherwise, so English never contradicts a stored goal.
- **Art.** Text that is interface (the logo slogan, game logos, share cards) is translated. Signs and posters inside the games' worlds stay in Portuguese: the channel is set in Brazil. Proper names stay as they are (Seu Arlindo becomes Mr. Arlindo, Capitão Marola becomes Captain Marola).
- **Games.** The Phaser games are still in Portuguese in this first step, and English game pages say so. Each game will move to the same pattern on its own, with its text out of the scenes and into typed bilingual modules loaded with the game.

## Consequences

- Every new piece of interface text needs both languages from its first commit. Typecheck enforces it; there is no test for it ([decision 0007](0007-essential-tests-only.md)).
- Client Components ship both languages in their chunk. The portal's copy is small enough for that; the games, which are lazy loaded, should load only the active language when they are translated.
- Text the games pass to the shell (result breakdown, summary, level titles inside the canvas) stays Portuguese on English pages until each game is translated.
- Search engines get `hreflang` alternates and a sitemap with both languages; each language has its own share images (`public/og/` and `public/og/en/`).
