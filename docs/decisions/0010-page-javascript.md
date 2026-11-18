# 0010: Each page downloads its own JavaScript

## Context

In November 2026 every portal page downloaded about 1.2 MB of JavaScript (about 380 KB compressed), even the about page, which has almost no interactive parts. Measured in a production build with Chrome, the page's own code was only part of it:

- **Prefetching.** Next.js prefetches the code of every route linked from a visible `Link` as soon as the page loads. The top navigation, the side menu and the footer link to every section, so every page also downloaded the broadcast room (about 300 KB), the catalog and the character select, and with them the `motion` animation library (about 130 KB).
- **The room carried things nobody had asked for yet.** The five VHS tapes (about 80 KB) and the art of every game cover (about 100 KB of character drawings) were in the room's first download, although only one TV channel shows at a time and tapes play only after the shelf is opened. The game logos pulled in the full art files of Férias Fora do Ar and Guerra do Pijama just to draw two titles.
- **Animations for rare moments.** The mobile menu drawer and the achievement toasts are on every page and were animated with `motion`, which put the library in every page's first download even though neither shows until someone opens the menu or unlocks something.
- **The room re-rendered on every pointer move.** The mascot's eyes follow the cursor, and that position lived in the room's state, so every animation frame of mouse movement re-rendered the whole room.

## Decision

- **Navigation prefetches on intent.** Links in the top bar, the side menu, the phone menu, the footer and the room's objects use `IntentLink`: they prefetch when the pointer enters, the link gets focus or a finger touches it, not when they appear. This extends what [0006](0006-daily-missions.md) already did for `/mission` and `/play` links. A click still finds the page warm, since the hover or touch comes first.
- **The room loads extras on demand.** Tape programs load when the shelf opens or a tape is in the VCR (`room/tapes/programs.ts`), and the TV shows color bars for the instant before a tape arrives. The heavy cover art (Férias Fora do Ar, Operação: Recreio, Guerra do Pijama) and the pajama channel are `next/dynamic` components, so a page downloads only the covers it shows. Logos and how-to panels live in separate modules from the full art (`GameTitleLogos.tsx`, `GameHowTo.tsx`, `PajamaWarProps.tsx`).
- **Rare animations load when they happen.** The phone menu drawer (`MenuDrawer.tsx`) and the toast list (`ToastList.tsx`) load the first time the menu opens or a toast appears. Their animations are unchanged.
- **The mascot's gaze has its own store.** `room/lookStore.ts` keeps the gaze outside React state; only the two mascot drawings subscribe to it, so moving the pointer re-renders the mascot, not the room.

## Evidence

Production build, Chrome, 1440×900, every script the page downloads in its first seconds (raw / compressed):

| Page | Before | After |
| --- | --- | --- |
| Sobre | 1,228 / 378 KB | 563 / 175 KB |
| Extras | 1,228 / 378 KB | 642 / 202 KB |
| Recordes | 1,228 / 378 KB | 698 / 223 KB |
| Personagens | 1,251 / 385 KB | 790 / 252 KB |
| Missão | 1,276 / 394 KB | 857 / 274 KB |
| Página de um jogo | 1,251 / 385 KB | 836 / 266 KB |
| Catálogo | 1,251 / 385 KB | 984 / 303 KB |
| Sala | 1,228 / 378 KB | 958 / 302 KB |

React and Next.js are about 380 KB of every page and stay. The play pages still load Phaser, about 1.2 MB, after the click.

Moving the pointer 240 times over the room took about 440 ms of JavaScript before and about 260 ms after; what remains is mostly the hints of the objects under the pointer.

## Consequences

- The first visit to a section after hovering its link loads it in the background, as before; on a phone the touch starts the prefetch a moment before the tap. Following a link with the keyboard prefetches on focus.
- A tape inserted right after the page loads can show color bars for a fraction of a second while its program downloads.
- New links in the shared layout should use `IntentLink` (or `NavLink` for menu items), and art that only some screens show should stay out of modules that every page imports.
- The `motion` library is still part of the room, the catalog, the character select, the mission page and the game shell, where the animations are part of the page.
