# Changelog

Notable changes to Canal 404, newest first. Dates are in the release's own time zone (São Paulo).

## Unreleased

### Guerra do Pijama: bots com ritmo de criança
- **No more metronome.** Late in a match, and above all when only one bot was left, the bots threw the moment their pillow came back, at the same interval every time. Their wait now starts when they can throw again, and each throw is followed by a quick follow-up, a normal beat that varies a lot or a breather in which the bot often runs to another spot first. The same beat never repeats more than twice in a row. Nico favors quick follow-ups, Lia moves more between throws and Bia sits in between, and the follow-ups get more frequent after ESQUENTOU!.
- **Same pressure.** The average wait between throws is the same as before, within 5%, and in bot runs the win rate, energy left and match length stay the same in all four arenas. The boards don't change.

### Guerra do Pijama: Sótão, a quarta arena
- **A fourth arena.** "Sótão" / "Attic" comes after the backyard and closes the game. Players who already beat the backyard find it open.
- **Blanket forts.** Four forts the kids built from attic junk: a broom tipi and a cardboard castle at the back (6 hits each), a sheet over two chairs and a tablecloth over a table at the front (7 hits each). They block pillows like the backyard tent, sag at half strength while still blocking, and cave in at zero. After that, pillows fly over them, but the debris, chairs and table still take up the same floor. They never rebuild, so the room opens up during the match. Each fort blocks pillows only where it is drawn at pillow height, so the broom tipi is narrower cover than its base. In bot runs the first fort falls around 21 s, three are down around 56 s, after ESQUENTOU!, and the last one falls around 64 s, just before SEM DESCANSO!.
- **Damage you can see.** There are no health bars. Each hit shakes the fort, throws a few bits of its material and bends it a little more. It sags with a puff of dust while still covering pillow height, shivers at its last point and caves in with its own animation and sound: cloth slumping, cardboard crushing, brooms clattering to the floor. The debris stays recognizable: crossed brooms on the yellow sheet, a heaped sheet between the chairs, flattened cardboard with flaps sticking up. With reduced motion the states swap without animation.
- **Tripping.** Anyone touching a fort when it caves in trips for 300 ms (OPA!). They can't move or throw, and they lose no energy. A kid who just tripped can't trip again for 1.5 s, and a trip never extends a stun that is already running.
- **Bots with their own style.** Nico knocks down cover to expose whoever hides behind it, Bia alternates between direct throws and forts, and Lia looks for another angle. All three throw directly when they have a clear shot and step away from a fort that is about to fall.
- **The room.** Sloped roof with rafters and cobwebs, a round window with a moonbeam and floating dust, a swinging bulb, an old trunk, stacked boxes, a dress form, a coat rack, suitcases, a rocking horse and a muted rag rug with a woven texture. Kids standing beside the trunk, the boxes, the rocking horse or a fort are drawn in front of them, the dress form and coat rack have a base nobody walks through, and the trunk and suitcases sit flush in their corners so nobody gets wedged behind them.
- **Boards.** The attic gets its own board. The judge, the scores and the other three arenas don't change.

### Operação: Recreio: trilha, biblioteca, corda e colchonete
- **Music.** The Silence Inspector fight has its own march, which speeds up when he gets angry, and every level ends with a short tune: a fanfare on "Passou!", the march in a major key on "Recreio liberado!" and the march slowed down on "Pego no flagra!". It stops on pause and follows the sound switch.
- **A fourth level.** "Biblioteca vigiada" sits between the schoolyard and the office and mixes the other levels' gadgets: a wobbly shelf over a gap in sight of the lookout, the Inspector's spotlight over a stop-sign monitor, a book cart crossing a gap while a whistle monitor fires high and low waves, and a mat up to a mezzanine. Players who already beat the Inspector keep every level open.
- **The rope counts.** Tripping on the schoolyard jump rope now costs a heart and counts as a hit, instead of only pushing Bruno back.
- **The mat works.** The mat now throws Bruno as high as it was meant to, about twice a normal jump (a speed limit used to cut the bounce short). The schoolyard sticker that sat on the high bars moved up above the mat, where only the bounce reaches it.
- **Boards.** Rules version 2. The schoolyard board starts empty, because runs that tripped now count more hits. The corridor, library and office play as before, so each player's best there carries over.
- **Harder to fake on the board.** A run now sends its timeline with the result: which monitor fell and when, each sticker and snack, each bump, each bell and the moment Bruno entered the Inspector's room. The board checks that it matches the numbers, that nothing happened before Bruno could run there and that the Inspector wasn't beaten in under 5 seconds. It's still "checked", not replayed, but inventing a clean run takes much more than editing two numbers. Rankings and existing records don't change.
- **Sticker album.** Each of the 15 stickers is now one of the games the monitors banned (marbles, yo-yo, kite, hopscotch, pick-up sticks and more), with its own art. Every sticker Bruno picks up is saved right away, even if he gets caught later. In the level, stickers already in the album show faded with a green check, a new one pops a NOVA! / NEW!, and the result says how full the album is. The album itself sits on the game's page, one page per level, with the missing stickers as blank slots. It is saved in the browser under `canal404:operation-recess:v1`, travels with the scoreboard card's cloud copy and goes away with "Apagar meu progresso".

### Guerra do Pijama: cenários mais vivos
- **Feet on the floor.** Every kid has a tighter shadow right under the feet, and the furniture and toys in all three arenas cast soft shadows on the floor, so nothing looks pasted on. Beds, the TV, the bookshelf and the mattress stack shade the wall behind them, and the sofa shades the mattresses, without darkening a kid who stands in between.
- **Bedroom.** The round rug is a little less saturated so it stops competing with the kids. Moonlight from the window falls on the floor in the shape of the panes, with a faint beam and a few specks of dust. The beds look slept in, with pillows knocked askew and a turned-down blanket corner, and the string lights glow and dim each at its own pace.
- **Living room.** The TV has scanlines, a rolling band and a light on the floor and wall that flickers in the color of the current show. The lamps flicker when a pillow lands nearby. The sleeping cat has a shadow wherever it naps.
- **Backyard.** The grass has patches and tufts instead of one flat green, with a few tufts and small flowers along the edges. The tent glows from inside and casts a wedge of warm light onto the grass in front of its door, the lanterns light small pools around them, the projector screen is redrawn (case, top bar, tripod) and plays a counting-sheep cartoon with a little projector flicker, the grill glows and puffs smoke, the tree's leaves sway over a still trunk, the tire swing's shadow follows it, and the fireflies wander and blink out of sync, some of them behind the furniture.
- **Smaller banners.** PRONTOS? and JÁ! sit higher and smaller and JÁ! leaves faster, so they no longer cover the sofa. ESQUENTOU! and SEM DESCANSO! show near the top. The arena tips are a title and one line: "TRAVESSEIRO ESPECIAL! Pegue antes dos outros!" and "RICOCHETE! Jogue nos móveis com mola." Win and knockout banners stay as they were.
- **Nothing else changes.** Rules, hitboxes, AI, scores and boards are the same. With reduced motion the scenery stays still.

### Ao Vivo no 404: chocalho do Bruno no tempo
- **On the beat.** In Rua Sem Saída and in Bruno's part of the Pot-pourri, the shaker you hear when you hit a note now plays with the music, at the note's exact time. Before, it only sounded once the tap arrived, and the device's audio delay (about 40 ms on a Mac, more with Bluetooth) put it almost half a sixteenth late at 148 bpm, against a bass and hi-hat that play every sixteenth.
- **Mistakes still sound like mistakes.** A miss or a tap between notes silences Bruno's shaker until your next hit, and a tap between notes still shakes right away so you hear it.
- **Same song, same rules.** The notes, the judge, the boards and the other kids' tap sounds don't change.

### Compartilhar resultado e canal de origem
- **Share your result.** Every game's end-of-run screen has a Compartilhar / Share link next to Voltar à sala. On phones and browsers with a share sheet it opens the sheet; elsewhere it copies the text and link and says "Link copiado!". The text names the game, the stars (or the points when there are none) and the level, track, arena, part or song, followed by the game's page in the player's language with `?utm_source=share`.
- **Know where visitors come from.** Links in social bios can carry `?utm_source=tiktok`, `reels`, `shorts` and so on, and Umami now records that tag. Before, the tracker dropped the whole query string, and in-app browsers often send no referrer, so those visits showed up as direct.
- **Still nothing personal.** Only `utm_source` is kept, and only when it's a short lowercase slug. Every other parameter is still dropped from the page address and the referrer before anything leaves the browser (decision 0002).

### Ao Vivo no 404: sem modo assistido
- **One button to start.** The song card no longer has the assist toggle, and A no longer turns it on. The card shows only Começar, and the how-to-play, the board explanation and the 3-star achievement no longer mention it.
- **Why.** On most songs assist mode only widened the timing by 15 to 45 ms, which no one could feel. On Vinheta de Intervalo, Balada do Chuvisco and Pot-pourri it showed the hidden notes, which are the point of those songs, and the notes played by ear already get the wider timing for everyone.
- **Boards stay.** Runs keep the same format, always sent with assist off, so the judge, the boards and the records don't change. A saved assist setting is cleared the next time the game opens.

### Rua Sem Saída: dicas da Lina e do Déco
- **New gadgets get explained.** The first time you play a level that introduces a gadget, Lina and Déco say what it does right after Mr. Arlindo's line. Level 5 covers the rope, the bucket and the faucet. Level 6 covers the bridge held by the rope. Level 7 covers the leaf blower and the gate that flips on every launch. The tips explain the gadget, never the solution, and they don't come back once you've seen them or already cleared the level.
- **A nudge when stuck.** After two losses in a row on the same level, Lina gives a hint about that level at the start of the next try, until you win. All nine levels have one.
- **Everywhere.** The tips use the kids' speech bubbles on desktop and the speech cards on phones, in pt-BR and English, and they are read to screen readers.
- **Nothing else changes.** Levels, replays and boards stay the same.

### Ao Vivo no 404: chuvisco em doses menores
- **No more long blind stretches.** Balada do Chuvisco had runs of up to three "SEM SINAL" bars in a row, with weak signal around them, so near the end players tapped for about ten seconds without seeing a note reach the circle while the rhythm kept changing. A player who slipped a little had nowhere to find the beat again and was often cut by the crowd. Now the signal never drops for two bars in a row: 7 lost bars instead of 9, each between bars you can see, and placed where the rhythm is easiest to carry (steady beats, steady eighths or the song's main motif).
- **Same song, same rules.** The notes, the judge and the boards don't change; the notes still fade out before the circle in the lost bars.

### Lista de fases sem listras cortadas
- **Soft edges.** When a game's level list scrolls inside the intro card, the cards cut at the top or bottom edge no longer show as dark stripes under the objective. The list fades out at whichever edge has more to scroll to, and the fade goes away while the list has keyboard focus so its focus ring stays visible.

### Férias Fora do Ar: Sr. Bigodes de corpo inteiro na festa
- **No more floating bust.** The receptionist's sprites stop at the chest because a desk hides the rest in the lobby. At the closing party he stood in the open, so he looked like a torso on the floor. He now has a full-body party sprite: the same head and jacket, the rest of the bellhop uniform with gold buttons and stripes, trousers, shoes and a tail. He waves, blinks and bounces gently with the other guests.
- **On the deck.** He moved from the grass in front of the juice bar onto the pool deck, under the lifeguard chair. On phones the camera now shows him whole when he speaks.
- **The lobby stays the same.** Behind the reception desk he is still the bust.

### Férias Fora do Ar: bike da patrulha
- **A bike to get around faster.** The lifeguard's patrol bike is parked by Capitão Marola's chair. After you return his whistle, he lends it to you, and taking it rings its bell. Saves that already returned the whistle find it there with a sparkle, and Marola reminds you about it.
- **Outside you ride, inside you walk.** Déco rides at the pool, the beach and the forest, and walks in the lobby, the arcade, the broadcast room and room 404. There is no new button.
- **Speed.** Déco starts at walking pace and reaches about 1.8× after holding the direction for half a second, so short taps and arriving at a spot stay precise. On phones, a light push on the stick walks and a full push pedals. Crossing the pool now takes about 4 seconds instead of 7.
- **Art.** Déco on the bike from the side, front and back, with pedaling frames and a foot down when stopped. The bike has a wicker basket, a bell and a toy life ring. It leaves tire tracks on the sand.
- **Board.** Nothing changes: the Férias board is a list of who finished, with no time ranking.

### Guerra de Lanche: pausa no impacto e pudim devolvido
- **Hits land harder.** A "Na hora H!" and a big kid going down freeze the scene for a split second (70 to 80 ms). Reduced motion turns it off.
- **Catch the pudding.** In the last third of a pudding's flight its ring turns green. Tap it near Déco, or press the up arrow or W, to catch it and throw it straight back at whoever threw it.
  - The return counts as a throw and a hit, takes down a big kid in one go and keeps the streak.
  - A key press before the ring turns green blocks catching for 0.4 seconds, so mashing doesn't work.
  - You can't catch while ducking.
- **Learning it.**
  - **New players:** the tutorial gets a third step. One more kid throws a slow pudding, and when its ring turns green the scene slows down, a hand points at the pudding and a banner says "ANEL VERDE!".
  - **Players who already did the tutorial:** the first pudding that turns green while they are standing gets the same slow motion and banner, once per round, until they catch one or for three rounds.
  - **Elsewhere:** Mila cheers the first catch, and the tips, controls and screen-reader summary mention it in pt-BR and English.

### Ladeira Abaixo: fantasma junto do Correr!
- **A switch above the race button.** The best run ghost is no longer a status box in the garage corner. It is a switch centered right above "Correr!", with a ghost icon, "Fantasma da melhor corrida" and "Dispute contra seu recorde". On, the knob slides right with a check on a green track; off, it sits left. "Correr!" stays the biggest, brightest thing on screen.
- **Locked until a ghost exists.** The ghost only lives in the current session, per track and cart. Until you finish a race with the selected cart, the switch shows a padlock and "Disponível após sua primeira corrida", and tapping it or pressing G just shakes it. The saved on/off choice is kept for when a ghost exists. Recording and playing the ghost are unchanged.
- **Keyboard and screen readers.** ↓ and ↑ move a yellow focus ring from the carts to the switch and to "Correr!". Enter or Space toggles the switch when it has focus, G still works from anywhere, and screen readers hear the switch state on focus and on every change. The game's controls summary now mentions the garage keys.
- **Footer.** On desktop the title, cards and street moved up a little to make room, the button is as wide as the switch, and the keyboard tip is a plain caption. Phones keep the full-width button with the switch above it, and the whole row is the touch area.

### Ladeira Abaixo: vitórias na Garagem
- **Wins per cart.** The garage shows a trophy with how many times each cart finished 1st on the current track, like the kid cards in Guerra do Pijama. It only appears once that cart has won there.
- **Where it shows.** On desktop it sits in the top corner of each cart card. On phones it sits on the corner of each cart tile, so all four counts show at once.
- **Counting starts now.** Earlier races were not recorded, so every cart starts at zero. A win counts the moment you cross the line in 1st, before the result screen.

### Guerra de Lanche: lanches com efeito
- **Banana leaves a peel.** A banana that misses lands on that table as a peel. The next kid who pops up there slips and stays dizzy for a moment: he can't throw and is easy to hit.
- **Grapes splash.** Grapes that hit splash the kids at the tables numbered right before and after. They get dizzy and, if they were about to throw, the pudding falls on their own heads. A tray keeps the splash out.
- **Apple hits hard.** An apple takes down a big kid in one hit and goes through a tray.
- **Sandwich** stays a plain snack and is the most common one.
- **Next snack.** The snack that flies next sits bigger and a little higher on the table.
- **Learning the effects.** Mila explains each effect the first time it happens, screen readers hear every one, and the tips mention them in pt-BR and English.
- **Same scoring.** No effect scores a hit without a throw, so the judge counts hits the same way.

### Rua Sem Saída: mira precisa e Caminho bloqueado mais justo
- **Sunbathing gnome.** It now sits facing the player in a striped beach chair with its pointed hat up, so it reads as a gnome at a glance. The physics and scoring are unchanged.
- **Desktop aim in whole numbers.** Dragging rounds to 1° and 1%, like the phone, so the number on screen is the number launched. The arrows and WASD step by 1, or by 5 with Shift.
- **Restart keeps the aim.** Restarting a level brings each launch back with the aim it had in the last attempt. Moving to another level starts from 35° and 50%.
- **Caminho bloqueado is fairer.** The crate starts at the edge of its beam, so knocking it into the pit no longer needs a pixel-perfect lob. The level still takes 3 launches for 3 stars, and a rare launch that drops the crate and cuts the rope at once makes it 2.
- **Boards.** The change bumps Rua Sem Saída's rules to version 4. Only Caminho bloqueado starts a fresh board. The other eight levels play exactly as before, so each player's best from version 3 carries over to the new board, and a better run from today keeps its place ([decision 0011](docs/decisions/0011-street-campaign.md)).

### Pausa e Como jogar em telas separadas
- **The pause stays small.** "Como jogar" no longer stretches the pause card. It swaps it for its own view with the game's name, the three tips, the controls and a "Voltar à pausa" button. The game stays paused the whole time.
- **Every game gets it**, since they all share the same pause card.
- **Keyboard.** Esc in "Como jogar" goes back to the pause instead of resuming, and focus returns to "Como jogar". Pausing again always opens the short pause.
- **Pause card.** "Sair do jogo" sits a little apart and smaller on desktop. 404's line is now "O 404 tirou uma soneca."
- **Rua Sem Saída** has shorter tips. The arrow keys now "ajustam" the angle and power.

### Férias Fora do Ar: lista de quem terminou
- **No contest at the end of the vacation.** The Férias board ranked by points and playtime. A made-up result could take first place for good, because ties go to whoever got there first. It is now a list of who finished the adventure, with the latest on top and the date each person finished. Nobody holds a first place anymore.
- **Finishing again** keeps your name on the list with the date you first finished.
- **Where it shows up.**
  - The result card says "Seu nome está na lista!".
  - The record arcade shows names and dates instead of positions and points.
  - The game page shows how many people have finished.
- The game's own result screen, points and stars are unchanged. Decision 0016 explains the choice.

### Faxina depois da auditoria
- **Nothing changes for visitors.** This round removes code nobody could reach and brings the docs up to date.
- **Removed:**
  - the "turn your phone sideways" tip, which no game showed anymore because every game says how it is held;
  - Ladeira Abaixo's dust and crate mode, which was always off;
  - a second full judging of every Ao Vivo no 404 song, whose result nobody read;
  - unused components and helpers.
- **Férias Fora do Ar** drops unknown discoveries when it loads a save, as it already did with items and posters.
- **Error reports.** A game that fails to download now counts toward the same limit of 8 error reports per page as other errors. Decision 0002 also lists the scoreboard event.
- **Project housekeeping.**
  - Tests on `main` are no longer cancelled when another merge lands.
  - The scoreboard test checks the board's answer instead of the result's wording.
  - `jiti` is declared as a dev dependency.
  - The README describes the room's TV as it is now.

### Peças comuns dos jogos num lugar só
- **Operação: Recreio on touchscreen laptops.** The touch buttons used to appear only on devices that report a touch screen as their main pointer, so a laptop with a touch screen had no way to play by touch. Now they appear at the first touch, as in Guerra do Pijama and Ladeira Abaixo.
- **One key press counts once in every game.** Guerra de Lanche, Férias Fora do Ar and Operação: Recreio now have the guard that Rua Sem Saída, the Laboratório and Guerra do Pijama already had against the same key press being handled twice.
- **Leaving a game frees its graphics right away.** Each game opened in a visit used to keep its share of the graphics card until the browser cleaned up, and browsers allow only a handful at once. Now it is released as soon as the game closes, including when Ao Vivo no 404 or Madrugada rebuild after the phone rotates.
- **Behind the scenes.** The six games that adapt their layout to the screen now share one resize routine, and the key guard, touch check and game shutdown live in the shared game kit. Layouts, controls and scores are unchanged.

### Placar mais difícil de abusar e mais fácil de acompanhar
- **One home network, one limit.** Limits per address now treat every address of one home IPv6 network (a /64) as one, as they already did for families and schools behind one IPv4 address. Before, a single connection could get a fresh limit for each of its addresses.
- **The pause after rejected results holds under bursts.** Eight rejected results in an hour pause a player's submissions. Results sent all at once could all slip in before the pause; now the ninth is refused as soon as it arrives.
- **Reading the copy of the progress has a limit too**, like saving it (120 per hour per player). Visitors read it only when Extras checks for a copy, so nobody should notice.
- **Database outages show up in the logs** as one line with the error code, without addresses or details.
- Scores, boards and saved data are unchanged.

### Teclado, rolagem e celular mais previsíveis no portal
- **The game stays out of the way of its cards.** With the title, pause, result or error card open, Tab and Shift+Tab move between the card and the header (Voltar, Som), never into the game hidden behind the card, and the game returns to focus when play continues. Screen readers can still reach Voltar from the title card.
- **Mission visitors start in the right place.** Coming from a mission link while the mission was still loading, "Começar missão" appeared without focus. It now gets focus as soon as it shows.
- **No smooth scroll when changing pages.** Leaving a page scrolled down used to glide back to the top. Now it jumps straight there. With reduced motion on, moving around the room on phones, jumping to the day's board and opening the new-adventure confirmation no longer animate.
- **Phones held sideways.** The top bar, the pages, the footer and the game header keep clear of the notch and the rounded corners.
- **Smaller fixes.**
  - Toasts with a link wait while the pointer or keyboard is on them, so their link can be reached.
  - A poster that fails to draw says so and offers "Tentar de novo", instead of tuning in forever.
  - A tape that fails to download can be tried again without reloading the page.
  - The link to the Missão 404 page inside a game no longer reloads the whole site.
  - Times on the membership card and the cloud copy use the visitor's own time zone, and the copy offer names it.

### Botões e pausa que fazem o que dizem
- **Operação: Recreio: "Recomeçar partida" starts the level over.** After a bell, the header and pause-menu restart used to send Bruno back to the bell with his hearts refilled and the hits taken after it forgotten. That run also no longer counted for the board. The restart now begins the level from the start. After a knockout, "Voltar ao sino" on the result screen still continues from the last bell.
- **Ao Vivo no 404: pausing is silent and keeps long notes.** The count-in clicks, Mila's notes and the static hiss used to keep playing for a few seconds after a pause. A long note held when the game paused always counted as dropped. Now everything stops at once. A note still held after the pause keeps counting, and one released during the pause ends where the song stopped.
- **Rua Sem Saída.** On phones, an aim arrow held when the game paused no longer keeps turning the aim after Continuar. On the keyboard, a quick burst of keys can no longer switch the projectile or move the aim twice for one press.
- **Madrugada** keeps the moves and hints of the current part when the phone rotates and the screen settles in more than one step.
- Scores, stars and boards are unchanged.

### Progresso seguro com o canal aberto em várias abas
- **One tab no longer erases what another saved.** Every tab kept its own copy of the progress in memory and wrote the whole thing back on each change. A level won in one tab could vanish when a game started in another, or when a tab came back from the browser's back button. The portal now reads the latest save before each change, and progress that was cleared while a tab was open no longer comes back from it.
- **Férias Fora do Ar in two tabs.** A tab left behind no longer overwrites the adventure that moved on in another tab, or a new adventure started there. Instead it shows "Aventura aberta em outra aba" and stops saving until it is reloaded.
- **"Apagar meu progresso" with the board out of reach.** The board's copy of the progress is now replaced as soon as the board can be reached again. Before, Extras later offered the erased progress back.
- **Bringing a copy from the board on a full browser.** If there is no room to back up the saves the copy would replace, nothing is replaced and Extras says the copy couldn't be brought. A browser that only has tips and settings now takes the copy right away, without asking.
- Scores, stars and boards are unchanged.

### Jogo com defeito mostra "Sinal perdido" em vez de travar
- **A game that breaks no longer freezes on screen.** An unexpected error inside any game used to stop its animation for good. The canvas froze, Pausar and Continuar did nothing, and only a page reload helped. Now the game is closed and the "Sinal perdido" card appears with "Tentar de novo", which loads it again from the title screen.
- **Missing art or text is reported too.** If a game's drawings still fail to download after the two automatic retries, the same card appears instead of a game with blank boxes. If Férias Fora do Ar can't download its story text, the same card replaces a loading screen that used to spin forever.
- **Férias Fora do Ar saves when you leave or pause.** Leaving the game page used to drop up to eight seconds of walking and play time, because the save that should run on exit never did. Pausing and leaving now save on the spot.
- **Ao Vivo no 404** releases its sound player before the stage is rebuilt after a rotation, so no sound node is left behind.
- Scores, stars, saves and boards are unchanged.

### Ao Vivo no 404: o cartão volta depois de girar o celular
- **Turning the phone with a song card open no longer leaves an empty stage.** Rotating the phone, or resizing the window across a layout change, while the how-to or song card was showing rebuilt the stage without the card. Taps and Esc then did nothing until Pausar → Recomeçar. Now the rebuilt stage shows the same card again, ready to start. Songs, timing, scoring and boards are unchanged.

### Resultados guardados não somem com a rede instável
- **A result saved for later is no longer dropped while older ones are being sent.** When the board couldn't be reached, results waited in the browser and went up as soon as it came back. If a new result was saved while that sending was still going on, for example a match finished on a flaky phone connection, or one waiting for a nickname, it was erased when the sending ended and never reached the board or the day's mission. Now only the results that were actually answered leave the list. Local progress was never affected, and scores and boards are unchanged.

### Férias Fora do Ar: o final não se perde
- **Leaving during the ending no longer loses the adventure.** The save marked the adventure as over right after the final choice, but the result only went out at the end of the party by the pool. Closing the tab, reloading or losing the phone's battery in between left a finished adventure with no record, no "Mistério resolvido" achievement and nothing on the board, and the console only repeated that the channel was off the air. Now "Continuar aventura" takes a finished adventure that never sent its result straight back to the party, which then sends it.
- **The choice is kept.** The ending picked at the console (off the air or still on) is saved together with the end of the adventure instead of a moment later.
- Adventures that ended before this change get the party back only if this browser has no Férias record yet. Scores, stars and boards are unchanged.

### Ao Vivo no 404: cada toque mostra o que você tocou
- **The note you hit lights up where you hit it.** Each hit now pops the note itself at the exact spot it was when you tapped (on the circle for a "Na mosca!", a little above or below for early or late taps), with a ring in the grade's color: gold for Na mosca, mint for Boa, cream for Quase. Even with notes close together, you see which one counted. Missed notes still turn gray and fall with an ✕.
- **Feedback beside the circle.** "Na mosca!", "Boa!", "Quase!", "Escapou!" and the rest now appear in a fixed spot right next to the circle instead of floating over the audience, and each new message replaces the last with a short pop, so fast passages never pile up. On phones it sits just above the circle's height, clear of the thumb.
- **What you played.** Lina's keyboard and Mila's tape recorder play real pitches, so their notes show the note name on top of the grade (DÓ, RÉ, MI… and SOL♯; C, D, E… in English). Déco's bucket and Bruno's shaker have no pitch, so their hits show the instrument instead. While Mila plays her phrase, her notes appear as outlined lilac tags; on your turn they appear filled, with your grade, so her LÁ DÓ MI DÓ lines up with yours.
- **Long notes.** The start shows the note and its grade, the circle fills up while you hold, and the end says "Segurou!" or "Soltou cedo!".
- **A cleaner circle.** The dashed target and the chasing bulbs are gone. The circle keeps its gold ring and bulbs, which light up in the grade's color on a hit and in red on a miss, and it glows a little as a note gets close. Every tap gives the ring a short pulse.
- **A livelier crowd.** The audience has new hairdos (pigtails, curly puffs) and small differences in size and posture, and only some of them move at a time: bouncing, swaying or nodding to the beat. Fans raise their arms or wave on great hits, held notes and every 10 in a combo, and the crowd goes quiet when the show is going badly. Crowd lines no longer hide behind the front rows.
- **The sound follows the note that counted.** When two notes are close, the keyboard and the recorder now play the pitch of the note your tap was scored on, not just the nearest one. A tap right at the edge of the window now shows its grade even if the note had just been marked "Escapou!" a frame earlier.
- Timing windows, charts, scoring and stars are unchanged.

### Ao Vivo no 404 no celular
- **A lane that runs down the screen.** With the phone upright, the notes now come down a vertical lane from the stage to the circle, in the lower part of the screen, instead of crossing a thin strip. The canvas fills the whole screen height, so the notes are bigger and you see the next 3 to 4 beats coming, on small and tall phones alike. Notes still reach the circle exactly on the music: timing windows, charts, scoring and stars are unchanged.
- **A compact stage on top.** The jury bench, the band, 404 and the curtains keep their places in a shorter stage that shrinks on short screens, and the audience now sits on both sides of the lane. Crowd lines stay beside the lane, the "Na mosca!" feedback appears next to the circle, and the score sits under "AO VIVO".
- **Clear about tapping.** On touch screens, "Toque em qualquer lugar" shows under the circle until the first note, and the count-in also appears big inside the lane. A finger that slides off the game while holding a long note still lets go at the right moment, and long presses no longer open the browser's menu.
- **Cards made for the phone.** Each song card shows its demo as an upright lane, with the instructions beside it, bigger text and the Começar button within reach. The how-to card says the notes come down the lane.
- **Sideways and on the go.** Held sideways, the lane spans the full width with bigger notes. On phones, the header keeps only Voltar, pause and sound (Recomeçar and Como jogar are in the pause menu). The header score now counts up during the song on wider screens too.
- **Pages around it.** On phones, the game page shows Jogar right after the title and the song list starts closer to the top. These shared changes reach every game: on phones held sideways the start card scrolls as a whole with the play button always in view, and three result stats share the full width instead of leaving a gap.

### Ao Vivo no 404: no chuvisco, veja antes e toque de memória
- **Read ahead, play from memory.** In Balada do Chuvisco, the "SEM SINAL" bars used to hide their notes completely: 9 of the song's 24 bars, a third of its notes, including three bars in a row near the end. Their rhythm follows neither the melody nor the drums, so players had to guess, and a player who lost the beat there was usually cut by the crowd. Now those notes show up faint and flickering as they come in, then fade out and vanish in the last beat before the circle, so you can see the rhythm coming but hit it from memory and by ear. A first version that kept them visible all the way made the song too easy.
- **Weak signal.** Under "SINAL FRACO" the notes stay visible all the way, dimmer and steady (they used to be almost invisible there too).
- **The beat stays in the music.** A lost signal still muffles the band, but less: the snare now comes through, so beats 2 and 4 can still be heard.
- The pot-pourri's static stretch works the same way, and assist mode keeps every note in sight. The song card's demo, the how-to art on the game page and the tips describe the new behavior. Charts, timing windows, scoring and boards are unchanged.

### Ao Vivo no 404: textos revisados
- **Shorter, clearer cards.** Each song card now gives one quick instruction ("Nota comprida! Segure até o rastro terminar. Depois, solte!", "Primeiro, escute a Mila. Depois, repita a sequência no mesmo ritmo!") and breaks its lines between sentences instead of leaving a word alone on the last line. Mila's part of the lane reads "Vez da Mila" next to "Sua vez".
- **One word per thing.** Nota, círculo, nota comprida, rastro, sequência (Mila's phrases), precisão and estrelas everywhere; the hit streak is now "Combo", a missed note says "Escapou!", and the song subtitles drop "Contratempo", "Chiado" and "andamento".
- **Title screen.** A shorter pitch, the star thresholds as a compact row (50% ★, 80% ★★, 92% ★★★), one-line song descriptions and "Conclua a música anterior para desbloquear." on locked songs.
- **Results that match the run.** The title and line follow the stars ("Que show!", "Bela apresentação!", "Passou!", "Quase lá!", "Intervalo!"), and the 50% rule is said once. How-to cards, controls and loading tips were rewritten too; one tip still claimed the game corrected the device's sound delay, which stopped being true with the calibration. English follows the same changes. Songs, timing windows, scoring and boards are unchanged.

### Ao Vivo no 404: os jurados seguram as plaquinhas
- **Paddles in hand.** The jury's score paddles used to float above their heads with the stick ending in the air. Now Mr. Arlindo's stick goes into the fist he already raises, and the Inspector and the lunch lady raise an arm in their own sleeve and skin colors to hold theirs. The paddle pops out of the hand instead of sliding up, so it never comes loose, and the lunch lady's board stays in front of her bun and her angry steam.

### Ao Vivo no 404 sem calibração
- **Straight to the show.** The first time you play, the "Acerte a nota!" card shows how notes reach the yellow circle, and its button, now "Entendi! Começar o show", starts the song. The calibration step is gone: tapping along with clicks turned out to be hard to pass even on a laptop's own speakers, because waiting to hear each click lands the taps about a third of a second late, and the game already accounts for the delay the device reports.
- **No stored adjustments.** A timing adjustment saved by an earlier calibration is dropped, since a wrong one shifted the whole lane. Players who had calibrated skip the how-to card.
- The song card loses its "Calibrar de novo" button and the C key; assist mode stays. Songs, timing windows, scoring and boards are unchanged ([decision 0014](docs/decisions/0014-talent-show-judge.md)).

### Ao Vivo no 404: a calibração diz se você tocou cedo ou atrasado
- **Each tap says how it landed.** During calibration, every counted tap flashes "Junto!", "Atrasado!" or "Cedo!" over the circle, and its mark shows it: a check for on the beat, orange » for late, blue « for early. The check used to appear for any counted tap, so a run of late taps looked perfect and then failed. The counter now counts only taps on the beat.
- **Don't wait for the click.** The instructions now say to tap along with the beat without waiting to hear it, like clapping in time; waiting to react to each click lands taps about a third of a second late, which is what kept failing.
- **Clearer retries.** A failed calibration says whether the taps came after or before the beats, or, if you found the rhythm halfway, to play like that from the first beat. The calibration math is unchanged.

### Ao Vivo no 404: primeiro como jogar, depois a calibração
- **Show first, then calibrate.** The first time you play, a "Como jogar" card ("Acerte a nota!") loops the real lane: one note at a time comes in from the right, the hand taps it right in the yellow circle and "Na mosca!" pops up. "Entendi! Continuar" leads to a separate "Ajuste o ritmo!" card that says why the game needs to sync with the device and what to do, with a silent preview of the calibration. The beats only start when you press "Começar calibração" (or Enter).
- **A calibration you can follow.** While it runs, the card keeps one instruction ("Toque a cada batida!") and says where to tap. The circle turns lilac and shows the count 1–4, then turns gold with a hand for the eight beats. The eight marks are a progress row with a counter ("3 de 8"): a check for each counted tap, a larger ringed mark for the next beat, ✕ for a missed one, so it never depends on color alone. Each counted tap flashes the circle.
- **A clear ending.** "Tudo pronto!" leads straight into the show with "Começar o show!", or offers "Calibrar de novo". If it didn't work, "Vamos de novo?" says what happened in plain words (missing taps, taps far from the beats, taps all over the place), marks the taps that didn't count and offers "Tentar de novo". No milliseconds anywhere in the flow.
- **Calibrate again from any song.** The song card's button and the C key now open the "Ajuste o ritmo!" card instead of starting the beats at once; pausing mid-calibration goes back to it. The calibration math, the songs, the timing windows and the scoring are unchanged.

### Ao Vivo no 404: a plateia fala e a vez da Mila fica clara
- **Listen, then repeat.** While Mila plays her phrase, the hit circle turns lilac with an ear in it and its lights go dark, so her notes no longer look like yours; each of her notes flashes the circle as it lands. When her phrase ends, "Sua vez!" pops up over the circle and it turns gold again.
- **Count the notes.** The "Mila" and "Sua vez" labels on the lane carry one mark per note: Mila's diamonds fill as she plays them, your circles fill as you hit them (red on a miss). Your turn is a stronger gold with a dashed edge. The host says "Escute a Mila!" the first time, the song's hint says what the ear means, and the pre-show demo shows the same ear and marks. Echo notes stay hidden outside assist mode, and the chart, timing and scoring are unchanged.
- **The crowd talks.** During every song, someone in the audience says or thinks something every few seconds in a speech or thought bubble: lines about the song and its performer, cheers on a long streak, and grumbles when the crowd is emptying. The bubbles sit in the audience, never over the lane.

### Ao Vivo no 404: o Tema volta ao bumbo
- **Notes on the beat in Tema do Canal 404.** Around 1:03, four bars started on the bass drum and then fell between the kicks, where nothing in the music played. They now follow the bass drum all the way, like the same groove at 0:32. Same number of notes, same difficulty.
- **An agogô marks the groove.** The bass drum is too low for laptop and phone speakers, so the notes that follow it at 0:32 and 1:03 seemed to follow nothing. An agogô (low bell on the downbeats, high bell on the rest) now plays exactly those notes in both stretches, loud enough to hear on a phone.
- **New boards.** The change bumps the game's rules to version 3, so all six songs start fresh boards ([decision 0014](docs/decisions/0014-talent-show-judge.md)).

### Ao Vivo no 404: mais folga no eco
- **Echoes by ear get more room.** In Vinheta de Intervalo and the medley's echo stretch, the notes you repeat after Mila now count a bit earlier or later: bullseye up to 60 ms, nice up to 120, almost up to 180, the same as assist mode. Notes you can see keep their timing. The echo song was by far the hardest, harder than both songs of the final; it is now close to them.
- **New boards.** The change bumps the game's rules to version 2, so all six songs start fresh boards ([decision 0014](docs/decisions/0014-talent-show-judge.md)).

### Ícones do Lucide em todo o canal
- **One icon set.** Every icon that was still a text symbol or a hand-drawn shape now comes from Lucide, the set the portal already used: star ratings, check marks, arrows, close buttons, play and rewind labels, music notes and hearts on the site, and HUD and button icons in all nine games, including Madrugada's "Ver a casa" eye. Arrow keys inside control lists and in-game hints show as arrow icons too.
- **Some stay hand-drawn.** Icons that are richer than Lucide's (the watcher's eye in Operação: Recreio, the garage padlocks in Ladeira Abaixo) or have no real match (comic reactions, painted signs and road chalk, particles, the finish flag, Madrugada's board markers) keep their original art.

### Ao Vivo no 404: palco, júri e pista redesenhados
- **A lane that explains itself.** The bottom strip is now a marquee on the stage front: a music-staff ribbon carries notes drawn as ♪ in the performer's color, with speed lines and chasing bulbs showing they travel right to left into a gold, bulb-ringed hit circle with a dashed slot the note fits into. Hits flash the circle in the grade's color with sparks and a bigger pop-up; misses drop out of the lane with a red ✕; taps with no note shake the circle. Song progress, with the jury's voting points, runs along the bottom of the track, and the crowd meter and streak sit on the lane's edge.
- **A performer at center stage.** Whoever the song features steps onto a lit podium in front of the band under two spotlights, with a name tag ("Déco no balde"). The rest of the band backs them up from a riser, the 404 takes the podium for the static ballad, and the medley swaps soloists at every change. The soloist bobs on the beat, strikes on every tap and sends music notes up on good hits. Déco is slimmer to suit the podium: narrower shoulders and waist, and he waits with the drumsticks crossed over the bucket instead of arms spread wide; the share images and README screenshot show the new stage.
- **One jury desk.** The Inspector, Mr. Arlindo and the lunch lady share one long desk with name plates, buzzers and mics, seated on the band's riser; upright on phones, the desk sits on a raised bench behind the band. Their reactions and score paddles are unchanged.
- **A shorter pre-show card.** The card before each song is sized to its content: the round, the song and its performer, a live demo of that song's mechanic using the real lane, one line on when to tap, and a clear Continue or Start button. First-timers see "Hora do show!" and are told the timing check comes next; the sound tip is a small footnote. Songs, timing windows, scoring, calibration and the jury's rules are unchanged.

### Ao Vivo no 404 entra no catálogo
- **A ninth game: Ao Vivo no 404** (EN "Live on 404", `/play/talent-show`). A one-button rhythm game: the kids' improvised band plays Canal 404's live talent show for a jury made of the Silence Inspector, Mr. Arlindo and the lunch lady. Six songs from the channel's own soundtrack in three rounds, each teaching a new way to play: tap with Déco's bucket, hold with Lina's toy keyboard, repeat Mila's phrases by ear, play between the beats with Bruno's shaker, keep the beat when the signal drops into static, and a medley that changes tempo. Played with any key or by tapping anywhere, upright or sideways.
- **Timing, stars and the crowd.** A timing check on first play measures the device's delay, and every judgment uses it. Stars need a finished song at 50%, 80% and 92% accuracy. Misses and taps with no note empty the crowd, and if it leaves, the channel cuts to commercials. Assist mode widens the timing, shows hidden notes, never cuts and stays off the board. Pausing resumes from the same point after a count-in.
- **A board per song, replayed by the channel.** Each result carries the taps; the server judges them with the game's own chart and ranks most points, then more bullseye notes, then less noise. Assisted runs and logs too precise for a person don't go on the board ([decision 0014](docs/decisions/0014-talent-show-judge.md)). No daily missions yet.
- **Bis!** Finishing the medley with a star unlocks an achievement and the band's live recording on the broadcast room's radio. The portal can word levels as "música".
- Catalog art: cover, logo, how-to panels, result cast, a cartridge line in the broadcast room and share images. The game's own art is generated with `npm run art:talent` from the portal's character art.

### Madrugada: a Vó dá a volta na escada
- **Part 3 is harder.** Grandma no longer just paces the bottom row: she walks out along it and comes back along the top row, toward the stairs. Following her is not enough anymore; Bruno has to slip past her side, where the flashlight can't reach. The map and the target (16 moves) stay the same, and the part's notes explain the loop and the blind side.
- **Boards.** The change bumps Madrugada's rules to version 2. Six parts play exactly as in version 1 (A porta dos pais, O corredor, A cozinha, A área de serviço, A sala da TV and A volta), so each player's best from version 1 carries over to their new board, and a better run since then keeps its place. A escada, A despensa, A sala de jantar and O pai no sofá changed and keep only version 2 results ([decision 0013](docs/decisions/0013-bedtime-replay.md)).
- **Clearer sticky note.** While Bruno is in danger, the note keeps a warning that good news can't hide: no move is safe, the light is coming, or one more wait wakes someone up. It also explains the striped tiles the first time they show up in a part.

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
