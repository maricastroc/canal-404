# Changelog

Notable changes to Canal 404, newest first. Dates are in the release's own time zone (São Paulo).

## Unreleased

### Um destaque só: a missão
- **No more "Jogo da semana".** The menu item, the catalog ribbon, the TV badge and the "Jogar …" buttons on the About and coming-soon pages are gone, so the Missão 404 do Dia is the portal's only featured game.
- **The TV opens on the mission.** When there is a mission you haven't completed, the room TV starts on Canal 09. Otherwise it starts on the first game you haven't played, marked "Inédito", or on the one you played least. The "A seguir" suggestions follow the catalog order instead of the week.
- When you come back with a game still unplayed, the 404 says it is on the TV right now.

### Missões em todos os jogos (Stage 3.4)
- **Five games take turns.** From November 16 the Missão 404 rotates through Laboratório, Rua Sem Saída, Guerra de Lanche, Operação: Recreio and Guerra do Pijama, each once every five days and never two days in a row. The days before that keep the mission they already had.
- **Twelve new missions.** Rua Sem Saída: "Mira econômica", "Dois de uma vez", "Três estrelas na rua" and "Quintal de pernas pro ar". Operação: Recreio: "Corredor sem arranhão", "Álbum completo", "Pátio liberado" and "Inspetor sem chance". Guerra do Pijama: "Quase sem marcas", "Nocaute duplo", "Energia de sobra" and "A veloz no Quintal", played as Lia.
- **Mission rules inside the games.** In a Recreio mission the bells ring but don't save, so every try starts the level from the beginning. A Pijama mission that picks a kid goes straight to the arena with them, without changing your favorite.
- **Misses in each game's words**, such as "A munição acabou antes da última rodada." or "Sua energia acabou antes do fim da guerra."
- **Grade Completa**, a new seal for completing missions in all five games.
- **Stricter checks** for Rua Sem Saída, Operação: Recreio and Guerra do Pijama results. They now refuse impossible numbers that used to pass, such as an instant 3,600-point Rua match.
- A board showing "0 batidas" no longer risks showing "-0".

### A missão na sala (Stage 3.3)
- **NO AR.** The sign above the TV lights up and gets a "MISSÃO!" sticker while there is a mission on air, and a "CUMPRIDA" one after you complete it. Click it and the TV tunes to the mission.
- **Canal 09: Missão 404 do Dia.** A "Plantão" bulletin on the TV with the game, the level, the mission, the time left (with a blinking "Última hora") or your place once it is done. The whole screen is a "Jogar missão" button, or "Ver placar" after you complete it. The knob reaches it too, and the zoomed TV shows the same bulletin.
- **The 404 talks about the mission**: when you come back (new mission, already tried, completed with your place, last hour), once the last hour starts, and when a new mission starts while the room is open.
- The TV's "A seguir" button now has a name that matches what it shows, for screen readers and voice control.

### Conquistas e placar do dia (Stage 3.2)
- **Five mission achievements**, checked by the channel: Primeira Transmissão, Frequentador do Canal (3 different days), Maratonista do 404 (7 different days), De Volta ao Ar (a mission after 7 days or more without one) and Campeão do Dia (1st place when the day closes, with someone else on the board). They show up in the result of the run that earned them, as a toast, in the report on `/mission` and in Extras → Conquistas with the date. Players who completed missions before this update got theirs too.
- **The day's board** now lists everyone, 10 per page, with your own place even outside the page. Arrows go to earlier days, which show the final result and the champion, and each recorded tape has a "Ver placar" link.
- **Your grade.** The report shows the last 14 days (completed, tried or no mission) and how many times you were the champion.
- **Lighter pages.** Play buttons load the game only when you point at them or touch them, so pages with a play link download about 90 KB less.
- The "Missão cumprida!" stamp moved onto the cover so it no longer covers the mission title.

### Missão 404 do Dia (Stage 3.1)
- **A mission every day.** A new `/mission` page, in the menu as "Missão", shows the day's challenge as a cartridge: the game and level, the objective, the player's state (não iniciada, em andamento, concluída) and a VCR clock counting down to the next mission. The mission is the same for everyone and changes at midnight in Fortaleza.
- **Twelve missions to start.** Seven for the Laboratório, such as "A máquina completa" (use all five parts in the last level and make the ball pass through every one) or "Suco expresso" (orange in the juicer in 1,80 s), and five for Guerra de Lanche, such as "Oito seguidos" and "Sem uma mancha".
- **Checked by the channel.** A mission counts only for runs that start from the mission and whose result the server accepts. Laboratório machines are rebuilt on the server, which measures the time and the parts the ball touched; Guerra de Lanche results go through the usual checks, now also comparing the best streak with its combo points.
- **Inside the game.** "Jogar missão" opens the right level with a mission brief and a "Começar missão" button (or "Jogar sem missão"). A tag in the header shows the mission during the run, and the result shows "Missão cumprida!", or what was missing ("A bolinha levou 4,27 s."), with a retry button.
- **Report and recorded tapes.** The page shows the player's attempts, best result and place, the number of missions completed and the days in a row, the day's leader, and older missions as VHS tapes.
- The catalog shows the day's mission above the games. Without the backend, the page says the mission is coming soon.

### TV de perto e fitas refeitas
- **TV de perto.** The TV in the broadcast room can be watched up close: the button on the TV's frame, or a click on a tape's picture, brings the whole TV (just the screen, with a frame, on phones) to the middle of the screen, with the same program at the same moment. Text and subtitles grow with the screen. Escape or "Voltar pra sala" goes back, and focus returns to where it was.
- **One clock per tape.** Every tape program follows one clock from the moment the tape went in, so zooming in or out never restarts it.
- **The shelf.**
  - The tape that is playing leaves a marked "No vídeo" gap on the shelf. Keyboard focus has its own look, so it can't be mistaken for the playing tape.
  - The chosen tape is pulled off the shelf.
  - The eject button looks like a VCR key and names the tape.
- **Moving tapes.** The shelf zooms in from its spot and back. Tapes fly from the shelf into the VCR with a little bump, pop out and fly back to their own slot when ejected, and cross over when swapped directly. With reduced motion, nothing flies.
- **Desenhos 03** gets a build-up to the sneeze, a close-up, a scarf, readable subtitles and recording glitches between shots.
- **Rua S/ Saída** is now a fast commercial:
  - Text slams in, with whip and zoom cuts.
  - Game art: the slingshot, the shoe, the duck and the angry neighbour.
  - It ends with "JOGUE JÁ!" pointing at the "Jogar agora" button.
- **Férias 2004** is a found home video:
  - Four camcorder shots, with a ticking date and time, small wobbles and dropouts.
  - A close-up of a hotel window, where a TV is on by itself and the calendar says December 2004.
  - One strange moment: the date jumps to 04 DEZ 2004 04:04:04 and every window shows 404.
- **Karaokê** is now a show:
  - A count-in on a closed curtain, then the four lines with a ball that lands on each syllable exactly when its note plays.
  - Spotlights, faces for the key words, a cat with a cable, and a finale where the voice cracks.
  - A score of 4,04, and a "Cantar de novo" button that rewinds the tape. "Balada do Chuvisco" plays once, in time with the picture. It pauses the room radio and gives it back afterwards, and it stays quiet when the sound is off.
- **Não assista** is now a short comic scene:
  - The 404 dances, notices the camera, stares, hides under a lampshade and covers the lens.
  - The tape ends on a blue screen and the VCR ejects it by itself.
  - The secret is still unlocked once, and the scene plays every time.
- **The room mascot** reacts at key moments of each tape. Each line shows once per session; after that only his face changes.

### Estante de fitas
- The VHS shelf in the broadcast room now opens a close-up of the shelf with five tapes, each a large button, so any of them can be put in the VCR.
- Each tape plays its own program on the TV, separate from the regular channels: "Desenhos 03" is a recorded episode where the 404 catches static, "Rua S/ Saída" is an over-the-top 2004 commercial with a jingle and a button to play, "Férias 2004" is a home video from the resort with a detail that changes for a moment, and "Karaokê" has the 404 singing an original song with the lyrics on screen.
- "Não assista" keeps the mysterious tape secret and now has a torn label.
- The VCR shows when a tape is playing and ejects it with a click. When it is empty, it opens the shelf.

### Fliperama de recordes (Stage 2.2)
- A new "Fliperama de recordes" page shows the best of the channel in every game: a cartridge per game, a picker for each level or arena, the top ten with nickname and tag, and your own place even when you are outside the top. Each board explains its rule, its tie-breaks and how the channel checks results.
- It opens from the new "Recordes" menu item, the trophy in the broadcast room, a "Quadro dos campeões" strip on each game page, the result panel and the membership card in Extras.
- The result panel compares your best with the channel record ("Recorde do canal: Lina Turbo #0427 · 1 peça · 98 passos"), stamps "Recorde!" when you beat your own, has the 404 mascot react, and links to the full board.
- Laboratório machines are now tested by the server before they enter the board: the channel builds the machine again with the same physics the game uses and only accepts it if the ball reaches the goal. Those records are marked "máquina testada pelo canal". The game plays exactly as before: every known solution takes the same number of steps ([decision 0005](docs/decisions/0005-shared-lab-simulation.md)).
- Fix: small cartridge labels and other new text keep a readable contrast (checked with axe).

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
