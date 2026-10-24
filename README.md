# CANAL 404

A fictional game portal inspired by the feel of 2000s cartoon-channel websites. The channel went off the air, but the portal still works: an illustrated, interactive broadcast room, original characters, hidden secrets and three complete games: **Rua Sem Saída**, **Laboratório de Péssimas Ideias** and **Guerra de Lanche**.

The code, file names and ids are in English. Everything the visitor reads on screen is in Brazilian Portuguese.

## Running

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For a production build:

```bash
npm run build && npm start
```

There are no external services, sign-ins or API keys. Progress, high scores, secrets and preferences live in the browser's `localStorage` (key `canal404:progress:v1`).

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS 4 (color, font and texture tokens in `src/app/globals.css`)
- Phaser 3 for the games, loaded on demand only on the play page (Matter.js physics for Rua Sem Saída and the Laboratório)
- Motion for interface micro-interactions
- Lucide icons (`lucide-react` in the portal, Lucide icon nodes rendered to textures inside the games)
- Hand-made SVG for every illustration
- Web Audio API for sound effects and live-synthesized music

## Routes

| Route | Content |
| --- | --- |
| `/` | Broadcast room: TV with the game of the week and channels, arcade cabinet that opens the catalog, radio with music, the 404 mascot and objects hiding secrets |
| `/games` | Catalog with category filters |
| `/games/[slug]` | Game page (playable or "off the air") |
| `/play/[slug]` | Real loading screen, intro, match, pause and results |
| `/characters` | Character select with reactions |
| `/extras` | Downloadable posters (PNG), music, achievements and secrets |
| `/about` | The channel's fictional history |

Game slugs: `dead-end-street` (Rua Sem Saída), `bad-ideas-lab` (Laboratório de Péssimas Ideias), `food-fight` (Guerra de Lanche), `strange-house` and `operation-recess` (coming soon).

## Structure

```
src/
  app/                   routes (App Router); (sections) groups the pages with the site chrome
  components/
    room/                broadcast room, objects and mascot director
    mascot/              404 mascot (expressions, poses, gaze)
    characters/          characters and the select screen
    catalog/             game cards and catalog
    game-shell/          loading, intro/pause/result panels and the bridge to the game
    extras/              posters, jukebox, achievements and secrets
    art/                 logo, covers, game logos, icons and badges
    layout/              navigation, toasts, sound
    ui/                  visual primitives
  games/
    registry.ts          metadata for every game (catalog)
    loaders.ts           dynamic import for each playable game
    types.ts             contract between the portal and the games
    kit/                 shared Phaser helpers (cartoon text, panels, speech bubble, Lucide icons)
    dead-end-street/     slingshot game (Phaser scenes, waves, sounds)
    bad-ideas-lab/       machine puzzle (levels, geometry, scenes, sounds)
    food-fight/          cafeteria food fight (scenes, rivals, sounds)
  lib/
    audio/               Web Audio engine, effects and music
    progress/            persistence, secrets and achievements
public/assets/<slug>/    SVG art for each game
```

## Adding a game

Games are independent from the portal. Each one exports a `GameModule` with `mount(ctx)` and receives only what it needs from the portal (parent element, fonts, audio, current high score and progress/event callbacks).

1. Create `src/games/<slug>/` with an `index.ts` that exports `{ mount }` following `src/games/types.ts`.
2. Register the metadata in `src/games/registry.ts` (title, category, controls, how-to, `status: "available"`).
3. Add the loader in `src/games/loaders.ts`.
4. Draw the cover in `src/components/art/Covers.tsx` and the logo in `src/components/art/GameLogos.tsx`.

The portal handles loading with a real progress bar, the intro screen, pause, results, high scores, achievements and screen-reader announcements. Games with levels declare `levels` in the registry and return `level` in the result: the portal shows the level picker (each level unlocks the next), saves stars per level and offers "Próxima fase".

## Rua Sem Saída (`dead-end-street`)

A slingshot mounted on a wagon: pull back (mouse or touch) or use the arrow keys to aim and Space to launch. Three short rounds in Seu Arlindo's yard (close targets, then behind obstacles, then up high) with seven launches of four projectile types with different physics. The neighborhood reacts: the cat runs, the trash can lid flies, the bird escapes the birdhouse. Points per target, round, mess, combos and leftover ammo; the high score is saved locally.

## Laboratório de Péssimas Ideias (`bad-ideas-lab`)

A physics puzzle in Lina's garage. The first level is a quick test: one ramp, a dashed marker showing where it goes and an arrow on the LIGAR button. Then come five silly problems: wake the cat with the bell, press the toaster button, get an orange into the juicer, bring the ball back to the TV remote, and the worst idea of all.

Each level has a box of counted parts (ramps, springs, fans and conveyor belts) and a dashed build area. Parts can be dragged with mouse or finger, or placed with the keyboard: numbers pick, arrows move, R rotates, Enter places, Space runs the machine and H asks for a hint. When a run fails, the ball's path stays on screen, Lina reacts and, on the second failure, gives a hint. Stars depend on how many parts were used.

The levels were calibrated in simulation with the same physics rules as the game (`config.ts`, `levels.ts` and `geometry.ts`): each one has tested solutions, and single-part shortcuts don't work.

## Guerra de Lanche (`food-fight`)

A cafeteria food fight in 75-second rounds. Déco and Mila hide behind their table. Tap a kid from the rival class to throw a snack at them, and hold ABAIXAR when the exclamation mark appears so the pudding flies overhead. While ducked, Mila hands over more snacks. Three puddings use up the napkins; lasting until the bell rings is a win. Pimentinha throws fast, Grandão takes two hits, and the lunch lady, who walks by now and then, must not be hit.

The first match starts with a short practice: a rival waits for the first snack and the first pudding comes slowly, with Mila calling it out. On the keyboard, Space throws at the most dangerous rival, 1 to 5 pick a table and the down arrow ducks.

## Accessibility

- Every object in the room is a real button or link, keyboard-reachable, with a visible focus ring.
- Hover hints also appear on focus; important actions don't depend on hover.
- The games accept keyboard, mouse and touch, and announce events through an `aria-live` region.
- `prefers-reduced-motion` is respected and nothing depends only on audio; sound starts only after an interaction and can be turned off.
