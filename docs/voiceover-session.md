# VoiceOver session: Laboratório de Péssimas Ideias

A manual run of the Laboratório with VoiceOver on, against production (canal-404.marianacastro.dev), on 2026-11-14.

- macOS 26.6.2, VoiceOver built in, Google Chrome 157.0.8103.78
- Played by a sighted tester with VoiceOver speaking the whole time
- What VoiceOver said was captured as it spoke, through VoiceOver's own AppleScript interface (`content of last phrase`, polled every 200 ms). Lines from other apps were removed; the game's lines are verbatim.

## Path

1. Catálogo → Laboratório de Péssimas Ideias → Jogar → intro panel → Fase 1 (the tutorial), won on the first try.
2. Home → Catálogo → Laboratório → Jogar → Fase 2 (Bom dia, Pixel), solved with two ramps on the first try → back to the home page.

## Transcript

### Run 1: catalog to the tutorial

```
22:09:00 visited link VOLTAR AO CATÁLOGO main
22:09:00 Catálogo de jogos · CANAL 404 web content
22:09:03 Laboratório de Péssimas Ideias · CANAL 404 web content
22:09:45 visited link JOGAR main
22:09:46 Jogando Laboratório de Péssimas Ideias · CANAL 404 web content
22:09:47 Laboratório de Péssimas Ideias: tela de apresentação dialog with 7 items JOGAR FASE 1 button
22:10:23 1 PRIMEIRO TESTE Coloque a rampa e ligue a máquina. button list 6 items
22:10:23 main Laboratório de Péssimas Ideias. Números pegam peças, setas movem um passo, R gira, Enter coloca, C cancela, X guarda, espaço liga a máquina. D descreve a fase, O passa pelos objetos, I diz onde está a peça, L repete o último resultado, H pede dica, Esc pausa. jogo
22:10:48 You are currently on a jogo.
22:11:01 Rampa no lugar certo. Agora aperte espaço para ligar a máquina.
22:11:06 Máquina ligada! Espaço desliga.
22:11:11 Funcionou! Tentativa 1. A bolinha tocou na prateleira de cima, na rampa e na prateleira de baixo. Acertou o alvo!
22:11:13 Vitória: Funcionou! dialog with 12 items PRÓXIMA FASE button
22:11:16 Fase de treino não entra no placar.
```

### Run 2: home to Fase 2 and back

```
22:15:41 link Pular para o conteúdo
22:15:44 visited link image CANAL 404 — Desenhos. Jogos. Bagunça. Página inicial
22:15:44 Catálogo de jogos · CANAL 404 web content
22:15:47 Laboratório de Péssimas Ideias · CANAL 404 web content
22:15:51 Jogando Laboratório de Péssimas Ideias · CANAL 404 web content
22:15:51 Laboratório de Péssimas Ideias: tela de apresentação dialog with 7 items JOGAR FASE 3 button
22:16:03 main Laboratório de Péssimas Ideias. Números pegam peças, […] Esc pausa. jogo
22:16:08 VoiceOver off
22:16:27 VoiceOver on Chrome Jogando Laboratório de Péssimas Ideias · CANAL 404 - Google Chrome window CONTINUAR button has keyboard focus
22:16:39 main Laboratório de Péssimas Ideias. Números pegam peças, […] Esc pausa. jogo
22:16:43 Rampa colocada: descendo para a direita, 15 graus, 5 passos à esquerda da ponta da prateleira de baixo, na mesma altura. 1 peça usada.
22:16:45 Rampa colocada: descendo para a direita, 15 graus, 1 passo à direita da ponta da prateleira de cima, 2 passos abaixo. 1 peça usada.
22:16:47 Girou: descendo para a direita, 30 graus. 1 passo à direita da ponta da prateleira de cima, 1 passo abaixo.
22:16:53 Rampa 2 colocada: descendo para a direita, 15 graus, 2 passos abaixo da rampa 1. 2 peças usadas.
22:17:23 Máquina ligada! Espaço desliga.
22:17:27 Funcionou! Tentativa 1. A bolinha tocou na prateleira de cima, na rampa 1, na rampa 2 e na prateleira de baixo. Acertou o sino!
22:17:30 Vitória: Funcionou! dialog with 13 items PRÓXIMA FASE button
22:17:37 PRÓXIMA FASE button
22:17:41 CANAL 404 — Desenhos. Jogos. Bagunça. web content
```

## What worked

- Every page change was announced by title, and the intro opened as a named dialog with focus on the level button.
- Focusing the stage read the role ("jogo") and the full list of keys.
- Placing and rotating a ramp said where it landed, relative to the shelves and to the other ramp.
- Each attempt was explained (which parts the ball touched and whether it hit the goal), and the victory dialog took focus on "Próxima fase".
- Turning VoiceOver off mid-level paused the game; it came back with focus on "Continuar".

## Problems found

- **The level opening was never spoken.** The scene announces the level description and how to play (`LabScene.begin`), and 30–40 ms later the shell moves focus to the stage. VoiceOver then read the stage's label and dropped the live announcement: in both runs the key list was read and nothing else until the first action. A player who can't see the screen didn't hear the level layout or the tutorial's "aperte 1" instruction unless they pressed D. The result announcement ("vitória! 1300 pontos, 3 estrelas") had the same problem, since focus moves to the result dialog right after it.

## Fix and re-run

`useAnnouncer` now repeats a message sent up to 600 ms before a focus move, 500 ms after focus lands (`afterFocus`, wired to focus events in the game shell). Messages from the shell that arrive in that half second join the repeat; an answer to a key press cuts it short and is read at once. In Playwright the order became: opening at 753 ms, focus on the stage at 828 ms, opening again at 1333 ms; and the result at 10469 ms, focus on "Próxima fase" at 10530 ms, result again at 11044 ms.

The tutorial was played again with VoiceOver on, against the local build with the fix:

```
22:33:54 1 PRIMEIRO TESTE Coloque a rampa e ligue a máquina. 3 de 3 estrelas button list 6 items
22:33:54 main Laboratório de Péssimas Ideias. Números pegam peças, […] Esc pausa. jogo
22:33:55 Fase 1 de 6: Primeiro teste. Coloque a rampa e ligue a máquina. Cenário, a partir do cano: O cano fica no alto, no canto esquerdo. […]
22:34:27 Rampa no lugar certo. Agora aperte espaço para ligar a máquina.
22:34:29 Máquina ligada! Espaço desliga.
22:34:33 Funcionou! Tentativa 1. A bolinha tocou na prateleira de cima, na rampa e na prateleira de baixo. Acertou o alvo!
22:34:36 Vitória: Funcionou! dialog with 10 items PRÓXIMA FASE button
```

The level opening is now spoken. VoiceOver cuts the stage's key list about a second in to read it; the opening repeats the keys needed to start. VoiceOver was turned off a second after the victory dialog opened, so the repeated result announcement wasn't heard in this run.

## Not covered

- The query keys (D, O, I, L, H, C) weren't used in this session; they are covered by the automated test in `e2e/lab-access.spec.ts`.
- The level wasn't solved without looking at the screen.
- Safari, and the other five games, which announce events but aren't designed to be played without sight.
