# Changelog

Notable changes to Canal 404, newest first. Dates are in the release's own time zone (São Paulo).

## Unreleased

### Madrugada entra no catálogo
- **An eighth game: Madrugada** (EN "Past Bedtime", `/play/past-bedtime`). A turn-based stealth puzzle: Bruno sneaks downstairs at three in the morning to tape the Sessão Chiado and then gets back to bed without waking Dad, Grandma, Pipoca or Pixel. Ten parts in four acts, played with the keyboard or by swiping and tapping on phones, upright or sideways.
- **Parts and stars.** The portal's intro lists the parts and a win unlocks the next one. Stars are 3 at the part's target, 2 within three moves of it and 1 after that; a hint from Bruno's notebook caps the part at 2. The result is the portal's own panel with the moves against the target and the score: 1,000 for the part plus 100 for each move under target + 10.
- **A board per part, replayed by the channel.** Each result carries the moves; the server replays them with the game's own rules and ranks fewest moves, then fewer wake-ups, then fewer creaks outside the cuckoo. Runs with a hint don't go on the board ([decision 0013](docs/decisions/0013-bedtime-replay.md)). No daily missions yet.
- Catalog art: cover, logo, how-to panels, result cast, a cartridge line in the broadcast room and share images. The record arcade fits eight games.
- The hidden prototype route, its draft-art switch and its session list are gone. Progress now lives in the portal's save, and the notebook's part tabs only show the stars. The portal can word levels as "parte" ("Escolha a parte", "Próxima parte").

### Ladeira Abaixo: capa nova e textos revisados
- **New cover.** The four friends race down one hill in two rows: Bruno worried at the back, Mila in her bathtub, Lina with her fan, and Déco in the lead jumping a speed bump, with a plain green hill holding the 404 antenna behind the houses. Everyone stays whole inside the frame, with a safe margin for the room TV, and the share images were regenerated.
- **Friendlier copy.** The game page, track picker, how-to section, controls, garage, results and race tips were rewritten to read more naturally and match the game: one term per idea ("pontos de show", "multiplicador", "pódio", "desbloquear"). The how-to section now has its own introduction (`howToIntro` in the registry).
- The empty hall of champions now says "Ainda não tem ninguém no quadro dos campeões. Que tal ser o primeiro?" in every game.

### Ladeira Abaixo entra no catálogo
- **A seventh game: Ladeira Abaixo** (EN "Downhill Derby", `/play/downhill-derby`). Déco, Lina, Bruno and Mila race soapbox carts down three neighborhood hills, each a little harder: Ladeira do Seu Arlindo, Dia de Feira and Morro da Antena. Crouch to build speed, jump at the edge of the ramps, spin in the air to land straight, and put on a show with flips, poses and wheelies. Phones get on-screen buttons.
- **Tracks and stars.** The intro lists the tracks; 1st, 2nd and 3rd place give 3, 2 and 1 stars, and a podium unlocks the next track. The result shows the place, the time against the track record, how far the next rival was, and the score: a place bonus plus the show points. "Trocar carrinho" goes back to the garage.
- **The garage.** Before each track you pick a cart. Relâmpago de Madeira and Plano B are open from the start; Turbina da Vovó opens by finishing ahead of Lina on Dia de Feira, and the Banheira by finishing ahead of Mila on Morro da Antena. Racing in a friend's cart leaves their spot to Déco. The garage also turns on the ghost of your best run in the visit.
- **A board per track, replayed by the channel.** Each result carries the race's inputs; the server replays them with the game's own physics and ranks the fastest time, then fewer wipeouts, then more show points ([decision 0012](docs/decisions/0012-downhill-replay.md)). Every finished race counts, whatever the place.
- **Saved on the device** in `canal404:downhill-derby:v1`: track records with section splits, unlocked carts, the last cart and the ghost setting. "Apagar meu progresso" clears it with the rest.
- The hidden prototype route and its calibration panel are gone, and so is the test track. The portal now words levels as "pista" where a game asks for it ("Escolha a pista", "Próxima pista").

### Aviso de jogo atualizado no placar
- **A page left open during a deploy now says to reload.** A Rua Sem Saída page opened before the nine-level campaign went live still sent the old three-round result, and the board answered "Resultado em formato inválido". Now the board answers that the game was updated and the page needs a reload, both when the old page asks for a ticket without a level and when it sends a launch log in an older format.
- The result screen and the mission line show "O jogo foi atualizado" with the same advice. Old pages show it under "O placar não aceitou", since their code predates the new message. Scores, rankings and boards are unchanged.

### Rua Sem Saída vira campanha de nove fases
- **Nine levels in three acts.** Aquecimento, Mira fina and Lá no alto teach aiming, trajectories and heights. Efeito dominó, Banho de surpresa and Caminho bloqueado are about chain reactions: a row of bricks pushes a watermelon down into the garage, a duck cuts the rope of a bucket and opens the faucet in the same flight, and a bowling ball only reaches the golden gnome after a crate fills the hole and the drawbridge comes down, in that order. Arlindo contra-ataca, Confusão geral and Bagunça completa bring Seu Arlindo's gadgets: a leaf blower that sends light things back, a gate that turns after every launch and the Giant Gnome under a hanging sandbag.
- **You pick the ammo.** Each level has its own stock. Tap the ammo, press 1 to 4 or Q. The sneaker stays where it lands, the balloon soaks and shoves, the tire is heavy and rolls, the duck is light and bounces.
- **Stars for efficiency.** One star for clearing a level, two and three for clearing it with fewer launches; the level box shows the limit and the launches so far. Levels unlock one by one and can be replayed for more stars. The result shows the campaign stars, and clearing the last level ends with Seu Arlindo soaked, waving a white flag.
- **Seu Arlindo grows angrier.** Calm at the window in the first act, red-faced in the second, steaming in the third, with a line for each level and reactions to every gadget. The yard keeps the marks of earlier levels: a sneaker in the tree, a crooked fence, puddles, signs and a security camera.
- **One board per level, rules version 3.** The server replays each run with the projectile of every launch and ranks cleared levels by score, then fewer launches. The old whole-game board (version 2) no longer shows; its results came from the three-round game and are not compared with the levels. The four old street missions are retired and four new ones point at levels.
- Achievements: "Bagunça Concluída" now asks for the last level, "Engenheiro de Quintal" for 3 stars in any level and "Recordista do Bairro" for all 27 stars.

### Texto centralizado nos botões em iPhone e sofá da sala alinhado
- **Button labels are centered on iPhones too.** The display font (Luckiest Guy) was centered with `ascent-override`/`descent-override` in its `@font-face`. iPhones fell back to the font file's own metrics, which sit capitals about 0.14 em above the middle, so labels on buttons, tags and pills rode a couple of pixels high. The font file now carries the same 85%/15% metrics itself, so every browser places the text the same way. Chrome and desktop look the same as before.
- **Guerra do Pijama: the mattress stack in the living room sits centered behind the sofa.** It was 40 px to the right. Its bounce line moved with it.

### Guerra do Pijama no celular, em pé ou deitado
- **Portrait layout on phones.** With the phone upright, the arena fills the screen instead of a thin strip between two empty bands. Kids are drawn about twice as big (around 95–110 px tall on a phone). The camera follows you sideways and leans toward the opponent you are aiming at, or the one about to throw at you, so threats come into view before the pillow does. Rules, AI, timings and scoring are unchanged.
- **Roomier HUD on upright phones.** Your face sits on the left with your five hearts drawn bigger (about 19 px). Each opponent shows only their face with a life ring around it that empties as they get hit, plus a small heart under it, and it turns orange at the last heart. The timer sits in the middle. The "VOCÊ" tag under your face is gone there, since your face has the gold ring. Sideways phones keep hearts for everyone, just bigger, and desktop is unchanged.
- **Edge markers.** An opponent out of view shows as a small face with an arrow on the screen edge. It turns orange with a ! when they are winding up a throw at you.
- **Touch controls.** In portrait, a stick on the left and the THROW button on the right sit on a deck under the room, so thumbs never cover the arena. The stick floats to wherever the thumb lands on the left half. It reaches full speed with a short drag (about 23 px), and its base follows the thumb past the rim, so turning around for a dodge takes a short flick. The button shows the pillow reloading and turns gold with the giant pillow. Moving and throwing work at the same time with two thumbs.
- **Aim by dragging.** Tapping the right side throws with the same automatic aim as before (the throw fires on release, or after 0.15 s when held), and holding keeps throwing. Dragging from where the thumb landed aims in that direction instead, with the aim guide and reticle, and letting go throws. The aim snaps to a kid within the same 0.2 rad the mouse aim uses. You can now run from someone and throw back at them, as with the mouse.
- **Sideways phones** get a full-width arena with the same controls in the bottom corners. The game switches layouts live when the phone turns, with no pause or rotate prompt, and the "turn your phone" tip is gone for this game.
- **Character select** becomes a carousel on upright phones (swipe or tap the side cards, big START button), and the START button grows on sideways phones.
- **Device-aware instructions.** "How to play" lists only touch controls on phones and only keyboard and mouse on computers, and the loading tips follow the same rule. In the first matches, phones label the stick and the button ("DRAG TO MOVE", "TAP TO THROW") until you have used both. Then "DRAG TO AIM" appears until your first aimed throw, or for 9 s. Computers show a one-line keyboard reminder.
- Desktop keeps the same layout, camera and HUD.
### Resultados esperam o apelido
- **A win played before picking a nickname is no longer lost.** Moving on from the result screen without clicking "Entrar no placar" (next level, replay, choosing another level or leaving the game) used to throw that result away, even with a nickname typed or drawn with "Sortear". The result now waits on the device, and it goes up with the next one as soon as the visitor joins the board, in any game.
- The join form says how many earlier results are waiting, and it opens with the nickname typed or drawn earlier in the visit already filled in. Nothing is sent until the visitor clicks "Entrar no placar".
- Results wait up to 11 hours and at most ten at a time, the same limits as results that failed to send when the board was off the air. Scores, rankings and boards are unchanged.

### Guerra de Lanche em pé no celular
- **Portrait layout on phones.** With the phone upright, the game fills the screen instead of a thin strip between two empty bands. Déco and Mila's table sits in the foreground and the rival rows stretch across the whole width behind it, so characters, tables and tap targets are drawn about twice as big as before. All five tables stay fully on screen, also while the classmates pop up, wind up and brawl. Déco turns around to throw at classmates on his left.
- The napkins, timer and score sit along the top. A smaller ABAIXA button sits in the bottom-right corner, next to the table and under the thumb. Mila's speech bubble appears beside her, over the tablecloth, without covering anyone.
- **Phones play upright.** On a phone held sideways, the game asks you to hold it upright and pauses the round. The "turn your phone" tip is gone. Desktop and tablets keep the wide layout.
- **Same round either way.** Snack flight times and the lunch lady's walk are timed as in the wide layout, so scores are unchanged.
- **Game header on phones.** Long game titles wrap onto two lines instead of being cut short, and the sound button matches the other header buttons.

### Operação: Recreio: colegas desenhados de corpo inteiro
- **Lina, Mila and Déco are now drawn as one figure each.** Their sprites used to be a portrait head, with its own wide round shoulders, placed over a separate skirt and arms, so the shirt looked like a cape and the arms came out from under it. Each kid now has a single torso from neck to hem: Lina's orange shirt under a pink pinafore with teal straps, Mila's striped navy dress and Déco's yellow shirt over trousers that run into the legs.
- Arms start at the shoulders and have the same length in both frames, and hands match each kid's skin. Mila's long hair ends behind her shoulders.
- **The jump rope stays in their hands.** The rope used to end a little away from the hands and float on its own while the holding arm was down. Now the holding arm stays up and the other one waves. The rope's reach and timing are unchanged.
- Same heads, faces, colors and accessories.

### Placares em letras maiúsculas
- Nicknames on every board now show in capital letters: each game's board, the mission boards and their champion line, the champion ticker and the rival line under each game. Nicknames are stored as typed, so nothing changes for sign-in, tags or ranking.

### O placar anota o tipo de navegador
- Every result sent to the scoreboard now records the type of browser it came from: only the engine family, its major version and whether it's a phone or a computer (for example `webkit-26-mobile`), never the browser's full identification. Accepted and rejected results both get it, so replay mismatches can be checked engine by engine. The about page says so in both languages.
- Needs the `20261120150000_run_client` migration. Older runs have no label. Scores, rankings and boards are unchanged.

### Guerra de Lanche conferida mais de perto
- The channel now checks Guerra de Lanche results against the round's own timers: how many snacks fit in the time, how many classmates could pop up, which classmates exist at each point of the round, how many puddings were taken and how much a streak can pay. A result with numbers the round couldn't produce is rejected.
- Checked against 100 rounds played by bots, wins and early losses alike: none was refused. Scores, rankings and boards are unchanged.

### Férias Fora do Ar: ninguém some atrás dos móveis
- **Residents stay visible.** The juice bar, kiosk, shed, trees and other tall props already turned see-through when Déco walked behind them. Now they do the same when a resident walks behind them. Residents who work behind their own counter, like Capi at the juice bar, keep it solid.
- **Critters respect furniture.** The lobby kitten no longer walks over the sofa or the suitcases while following Déco. Critters that walk or hop pick spots they can stand on and stop or turn back at anything solid. Frogs still hop into the stream.

### Páginas mais leves
- **Each page now downloads about half the JavaScript it used to.** The about page went from about 1.2 MB to 560 KB, extras and records to under 700 KB, and the broadcast room to under 1 MB. Menu, footer and room links now load the next page when you point at, focus or touch them, instead of loading every section in advance.
- The room loads the VHS tapes when the shelf opens and the art of each game's cover only when its channel is on the TV. The phone menu and the achievement notices load their animations the first time they appear.
- **Smoother room.** The mascot's eyes still follow the pointer, but moving the mouse no longer redraws the whole room, which cuts the work per pointer move by about 40%.
- Same pages, animations and art.

### Next.js 16.4.6
- Updated Next.js (and its ESLint config) from 16.4.3 to 16.4.6, which fixes two cache leak advisories (GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8). The channel doesn't use the affected `use cache` APIs, but on 16.4.3 `npm run build` ended with a security error.

### Rua Sem Saída refeita no servidor
- **The server now replays every Rua Sem Saída match** before it enters the board. The result carries the launches (when, at what angle and with what power), and the channel plays them again with the game's own physics. Only a match that ends with the same score is accepted, and the board marks it "Lançamentos refeitos pelo canal". Before, the server only checked that the numbers added up.
- The game's physics and rules moved out of Phaser into a simulation shared with the server. Shot endings, reloads, round breaks and target spawns now count simulation steps instead of clock time, so hit-stops pause them too. While you aim, the yard stops moving once everything has settled.
- **The Rua Sem Saída board starts over** (version 2). Older records can't be replayed, so they no longer show.
- Same rounds, targets, projectiles, scoring and missions. Corners of the props are built with a fixed number of segments, so bounces can differ very slightly from before.

### Férias Fora do Ar em inglês: o canal inteiro nos dois idiomas
- **Off-Air Vacation plays in English** at `/en/play/off-air-vacation`: every dialog and choice, quests, the journal and map, items, posters, discoveries, the arcade mini-game, the HUD and screen-reader announcements. Only the active language's text is downloaded.
- With all six games translated, the "This game is still in Portuguese" note is gone from English game pages.
- Quests, endings, saves (including adventures saved before this change), score and the scoreboard rules are unchanged.

### Laboratório em inglês e um seletor de idioma no menu
- **Bad Ideas Lab plays in English** at `/en/play/bad-ideas-lab`: the tutorial, hints, parts, buttons, results and the whole screen-reader narration (level description, objects, part position and test results). The machines, levels, star rules and the server replay are unchanged.
- **Language switch in the menu.** The switch is now a PT | EN selector with the current language highlighted, placed right under the navigation in the room's side menu and in the phone menu, and next to the sound button in the section header. Before, it was a lone "PT"/"EN" chip above the sound button.

### Jogos de ação em inglês
- **Rua Sem Saída, Guerra de Lanche, Guerra do Pijama and Operação: Recreio play in English** at `/en/play/...`: on-screen text, HUD, tutorials and hints, character select, results, star hints and screen-reader announcements. Their English pages no longer show the "still in Portuguese" note.
- Signs and posters drawn into the art stay in Portuguese, as in the portal.
- Gameplay, scoring, stats, stars, saves and the scoreboard and mission rules are unchanged.

### Portal em inglês
- **English at `/en`.** Every page of the portal has an English version under `/en` (`/en/games`, `/en/mission`, `/en/play/food-fight`...). Portuguese URLs did not change, and `/pt-BR/...` redirects to them. A language switch next to the sound button in the navigation reloads the same page in the other language.
- Translated: navigation and footer, the broadcast room (mascot lines, TV channels, tapes, the karaoke song), the catalog and game pages (titles, how-to, controls, tips), the game shell (intro, pause, loading and results), characters, Missão 404 do Dia (missions, boards, history, stamps), the record arcade, nickname and membership card, extras (posters, music, achievements, secrets), the about page, errors and 404, page titles and share images.
- The games themselves are still in Portuguese. English game pages say so, and text that comes from inside a game (result breakdown, level titles in the canvas) shows in Portuguese until that game is translated.
- Numbers, dates and positions follow the page's language (1st, 2nd; 1,234; Monday, November 17). The mission still turns at midnight in Fortaleza; English pages call it midnight in Brazil (UTC−3).
- Search engines get `hreflang` alternates and a sitemap with both languages. Scores, saves, the scoreboard API and the stored missions did not change.

### Operação: Recreio: guarda destravado e obstáculos que se explicam
- **No more shaking guard.** A monitor chasing Bruno turned toward him on every frame. With Bruno standing on the monkey bars or a desk right above it, it overshot by a couple of pixels and turned back forever, shaking in place. Monitors now hold still under Bruno until he comes down, need a small margin before turning, and pause briefly when a patrol hits a wall. The monitor with the STOP sign no longer paces back and forth under him either.
- **Hints on the obstacle.** The hint balloon now points at the obstacle itself instead of floating over Bruno, appears only once the obstacle is on screen, and goes away once you pass it or after 5 seconds. Before, the balloon never went away in the yard and the office.
- **Lockers**: the first locker bursts open by itself while Bruno is still far away, so you see what the shaking means before it matters. While a locker shakes, the whole locker wobbles and a red mark on the floor shows where the door will swing. They only start shaking when Bruno is on the ground, so you're never caught mid-jump, and they give a bit more room to stop. A sword hit on the door also slams it shut, and a slammed locker gets a padlock.
- **Jump rope**: a shadow on the floor darkens as the rope comes down, and every time it hits the floor it kicks up dust and makes a sound, so you can jump to the beat.
- **Inspetor's light**: it now catches you anywhere inside the drawn cone, including on top of a desk. When it finds you it stops, blinks orange and a red ring closes around you. You have 0.6 s to step out of the light before it turns red and costs a heart (before it was 0.34 s, too short to react). It no longer chases Bruno after catching him, and it ignores him while he blinks after taking a hit.
- **Monitor with the STOP sign**: the sign hitting the floor after the shove now raises dust and makes a thud, marking the moment you can strike from the front. The hint and "Como jogar" explain both ways to beat him: from behind, or while the sign is down.
- New text for the rope, the light, the lockers and the STOP sign in the hints, tips and "Como jogar". Puddles are described as slippery instead of something to jump.

### Operação: Recreio: Bruno de perfil, escola mais caprichada e um caminho com mais desafios
- **Bruno drawn in profile.** The in-game Bruno was a front-facing head on a sideways body. He is now drawn in a true side view: one eye behind one round lens with the temple running to the ear, the nose and chin sticking out of the silhouette, hair covering the back of the head, a narrow torso, and the far arm and leg darker and partly hidden behind the body. The head is now about 38% of his height instead of half, with longer torso, arms and legs. Running has four frames instead of two, the attack has a windup, a slash and a follow-through, and jump, fall, hurt and cheer use the same drawing, facing left or right.
- **Tidier scenery.** Corridor columns, posters, the window and the mop no longer overlap. The yard's protest banners hang on ropes between the lamp posts and sway when hit. Office columns, lamps, the bust and the door no longer overlap, and the desks stand on the floor or hang as wall shelves instead of floating.
- **Corridor**: lockers rattle and then burst open on whoever runs past. Wait for them or slam them shut with the sword. The vigia reads a newspaper and, when he lowers it, anyone who moves gets a giant whistle wave.
- **Yard**: Lina and Mila turn a jump rope you have to jump at the right moment (tripping costs no heart), and a gym mat bounces you up to a high ledge.
- **Office**: the Inspetor's searchlights sweep the floor, wobbly shelves fall shortly after you step on them, and a monitor alternates high whistles (stay on the ground) with low ones (jump).
- A short hint appears the first time each new mechanic shows up.
- **New text**: "Pego no flagra!", "Passou! Bora pra próxima!", "Recreio liberado!", along with new tips and a new "Como jogar" covering the lockers, the vigia, the rope, the searchlight and the shelves.
- **Scenes instead of floating heads.** The intro shows Bruno charging at a whistling monitor in front of the lockers. A win shows him cheering with Deco and Lina under confetti, and a loss shows him dizzy while a monitor laughs. All three use the game's own sprites, standing on a strip of corridor floor. The "Como jogar" panels on the game page use the new profile Bruno too.
- Monitor counts, stickers, scoring, stars and the scoreboard and mission rules are unchanged. The vigia's giant wave can't be cut with the sword, so it never counts as a whistle wave in the corridor.

### Testes enxutos
- The test suite now covers only what breaks silently and costs a lot: player saves, the scoreboard and mission judges, the API's security, the Laboratório replay, and one end-to-end smoke per flow ([decision 0007](docs/decisions/0007-essential-tests-only.md)). Unit tests went from 530 to 146 cases (about 4 s) and end-to-end from 101 tests to 14.
- Removed the visual regression job and its snapshots, the JavaScript budget spec, the axe checks, the component tests, and the Testing Library, axe and Vitest React plugin dependencies.

### Guerra do Pijama: bots mais espertos e arenas com personalidade
- **Bots that find their way.** Lia, Nico and Bia now plan routes around beds, sofas, the tent and the fence instead of walking into them, notice when something blocks the way and take another route, look for cover when they are low on energy, and keep a clear line to whoever they are attacking. In bot test runs the time a kid spent pushing against a wall or fence dropped from 6–18 s per match to under 0.2 s.
- **No more hidden corners.** The narrow gaps behind the tent, beside the beds, the TV and the beanbag and behind the stumps are closed, so nobody gets stuck where the art shows no floor.
- **Sala de estar: ricochets.** The sofa, the armchairs and a new stack of sleepover mattresses behind the sofa bounce a pillow once. Springs mark them, the aim guide shows the bounced path, and the bots bank shots too. The TV and the plants still stop pillows.
- **Quintal: o travesseirão.** A giant golden pillow drops at fixed times (first at 0:14) on fixed open spots. Whoever grabs it throws one huge pillow that flies over furniture and shoves anyone near the impact without hurting them. It still takes one point of energy, like any pillow, so scores and scoreboard checks are unchanged.
- **Livelier rooms**: a ceiling fan and a ticking alarm clock in the Quarto, original Canal 404 programs on the living room TV, a cat that stretches, peeks and changes spots, cushions that hop when the sofa bounces a pillow, and in the Quintal a swaying tree, a swinging tire, a tent in the wind and blinking fireflies. Everything pauses with the game and stays still with reduced motion.
- **Personality**: on the select screen Lia dashes across the card, Nico hits a target and Bia shrugs off a pillow, and hover and selection now look different. In the fight, portraits smile after a hit, worn-out kids sweat, and a bot that dodges you may tease.
- **Better endings.** The banner says whose room it is ("O quarto é seu!"), stars burst, knocked-out kids get a pillow on the face, and Space, Enter or a click skips straight to the result. The result text follows the arena and whether you had already beaten it, such as "O quarto ficou pequeno pra você! A guerra continua na sala.", and "Você foi a primeira a cair" now matches the kid.
- **Scenes instead of floating heads.** The intro shows the three mid-fight around a bed (Lia hitting Nico, who stands on it, while Bia winds up), a win shows your kid cheering on the bed with the other two flat on the rug, and a loss shows your kid flat on the rug under a few pillows, all full-body and built from the game's own sprites.
- **One-time hints** introduce the ricochets and the travesseirão the first time you enter each arena.
- **The intro dialog fits the screen** in every game: the title and the play button stay visible, only the middle scrolls, and in games with levels "Como jogar" takes the place of the level list. The page behind the games no longer scrolls, which a leaking canvas margin used to cause.
- Fast key presses on the character select no longer count twice.
- Balance was measured with bot players before and after. Win rates per arena stayed the same, and matches in the Sala and the Quintal got about 10–15 s shorter. Energy, damage, stars and scoring are unchanged.

### Fase, missão e placar falando a mesma língua
- **A missão diz o que pedia.** A missed mission now reads "Missão não cumprida" and names both the number and the target, such as "A máquina usou 1 peça, e a missão pede pelo menos 2 peças.", in every game.
- **Missions that cost stars say so.** Laboratório missions that need more parts than three stars allow explain this before the run, and the result no longer suggests using fewer parts during them. Operação: Recreio and Guerra do Pijama missions show their own rules on the intro as well as on `/mission`.
- **Each board says which board it is**: "Placar da fase", "Placar da arena" or "Placar do jogo". A first entry reads "Você entrou no placar", being alone reads "Placar inaugurado", and the "Recorde!" stamp is kept for beating someone.
- **Seconds instead of steps.** Laboratório boards and the record arcade show the ball's time ("4,18 s") instead of machine steps.
- **Clearer result notes**: "Primeira vitória nesta fase. Fase 3 liberada!", "Ligou e funcionou de primeira", a hint for the next star in Laboratório, Guerra de Lanche, Operação: Recreio and Guerra do Pijama, and no "Novo recorde!" sticker on a first match.

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
