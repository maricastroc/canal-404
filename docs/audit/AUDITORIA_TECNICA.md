# Auditoria técnica do Canal 404

**Data:** 2026-11-23
**Código auditado:** `origin/main` em `c9a3ec7` (merge do PR #131)
**Plano de execução:** [PLANO_INTERVENCAO.md](PLANO_INTERVENCAO.md)
**Atualização 2026-11-24:** F01, F02 e F04 já foram corrigidos (PRs #132, #133 e #134). As linhas citadas continuam sendo as de `c9a3ec7`.

A auditoria só leu e mediu. Nenhum arquivo de produção foi alterado e nenhum dado persistido foi tocado. Os experimentos usaram cópias descartáveis e um banco local próprio (`canal404_audit_test`).

Caminhos são relativos à raiz do repositório. `arquivo:linha` aponta a linha em `c9a3ec7`.

---

## A. Resumo executivo

O Canal 404 está em boa saúde técnica para um portal de hobby com nove jogos e cerca de 106 mil linhas de TypeScript:

- typecheck, lint, 135 testes unitários e 51 testes de banco passam;
- o CI de `main` está verde no commit auditado;
- não há `any` no código;
- os jogos não dependem uns dos outros;
- o servidor recalcula ou refaz toda partida que entra num placar.

As decisões em `docs/decisions` estão bem fundamentadas e foram seguidas. Não há motivo para reescrever nada.

Os problemas reais ficam em três lugares.

**1. Fronteiras entre jogo e portal.**
- O contrato `GameModule` não tem como um jogo avisar que falhou:
  - uma exceção dentro de um frame congela o jogo para sempre (reproduzido no navegador);
  - falhas de carregamento de arte nunca chegam ao shell, em nenhum dos nove jogos.
- Pontuações e ids de fase são escritos à mão em dois lugares, no jogo e no juiz do servidor. Se divergirem, o servidor recusa toda partida honesta daquele jogo e nada avisa.

**2. Momentos de transição dentro de jogos específicos.**
- O final do Férias marca a aventura como terminada antes de enviar o resultado. Quem sai nesse intervalo perde o resultado para sempre.
- Ao Vivo no 404 fica parado sem cartão se o celular gira com o cartão da música aberto.
- Em Operação: Recreio, "Recomeçar partida" volta ao último sino em vez de recomeçar.

**3. Sincronização local.**
- O envio da fila de resultados (outbox) apaga resultados enfileirados enquanto ele roda.
- Duas abas abertas podem sobrescrever o progresso uma da outra.

**Pontos fortes que merecem ser preservados:**
- simulações determinísticas compartilhadas entre navegador e servidor (Laboratório, Rua Sem Saída, Ladeira, Madrugada, Ao Vivo);
- saves versionados com backup;
- tickets assinados e idempotentes;
- concorrência correta no banco;
- convenções de i18n seguidas sem exceção;
- carregamento de JavaScript por página, que cresceu só 1% a 10% desde a [decisão 0010](../decisions/0010-page-javascript.md), apesar de três jogos novos.

**Prioridades:**
- **P1:** os dois bugs que fazem o jogador perder resultado ou ficar preso (F01 e F02).
- **P2:**
  - o contrato de erro entre jogo e shell (F03, F07);
  - a fila de resultados e as abas múltiplas (F04, F05);
  - as fontes duplicadas de pontuação (F08);
  - o reinício do Recreio (F06);
  - o foco dos painéis (F09).
- **P3:** o resto, sem urgência.

Não há P0: não foi encontrada falha de segurança grave, corrupção de dados em massa nem indisponibilidade.

---

## B. Mapa da arquitetura atual

### Stack

| Camada | Tecnologia (versão instalada) |
| --- | --- |
| App | Next.js 16.4.6 (App Router, Turbopack), React 19.3.0, TypeScript 5.9 strict |
| UI | Tailwind CSS 4, motion 12.43, lucide-react, SVG feito à mão |
| Jogos | Phaser 3.90.0 e matter-js 0.20.0 (fixado na versão embutida no Phaser, ver [0005](../decisions/0005-shared-lab-simulation.md)) |
| Áudio | Web Audio próprio (`src/lib/audio/engine.ts`, um `AudioContext` único) |
| Backend | Route Handlers em `src/app/api`, Prisma 7 com `@prisma/adapter-pg`, Postgres (Neon em produção), zod 4 |
| Testes | Vitest 5 (projetos `unit` em jsdom e `server` com Postgres), Playwright 1.64 (desktop e mobile) |
| CI/CD | GitHub Actions (`tests.yml`: tipos, lint, unitários e banco; e2e contra build de produção; `migrate.yml`: migrações em `main`), Vercel (deploy e cron diário) |

### Módulos e tamanhos (linhas, sem testes)

```
src/app (2,5k)           rotas [lang] para pt-BR e en, API, metadata, og-card
src/i18n (0,2k)          localized(), useCopy/getLocale, Link, format
src/components (25k)     room 8,3k · art 7,2k · game-shell 2,5k · characters 1,8k · missions 1,2k
                         extras · competition · records · layout · catalog · mascot · ui
src/games (86k)          9 jogos + kit (0,3k) + registry (1,1k) + types + loaders
  downhill-derby 13,8k · off-air-vacation 10,7k · past-bedtime 10,0k · bad-ideas-lab 7,0k
  pajama-war 7,0k · operation-recess 6,8k · dead-end-street 6,6k · talent-show 4,7k · food-fight 2,9k
src/lib (5,8k)           progress (saves) · competition (regras, cliente) · missions · audio · physics
src/server (1,4k)        db, identidade, tickets, runs, boards, missions, rate-limit, cleanup
```

### Dependências e fronteiras

```
 páginas (src/app/[lang]) ──► components ──► lib/progress, lib/competition/client, lib/missions/client
          │                       │
          │                       └─► game-shell/GameShell ──► games/loaders ──(import dinâmico)──► games/<slug>
          │                                    │                                        │
          │                                    └─ contrato: games/types.ts ◄────────────┘
          │                                       (mount → start/pause/resume/restart/destroy, onEvent)
          ▼
 app/api/* ──► server/* ──► lib/competition/rules.ts ──► games/<slug>/{sim,config,levels,judge}  (lógica pura)
                       └──► lib/missions/*             └─► lib/physics (trig determinística)
```

- **Intencionalmente independentes:** os jogos não importam uns dos outros (verificado: zero imports entre jogos). Cada jogo tem `layout.ts`, HUD, arte e sons próprios, e a direção de arte é de cada um.
- **Compartilhados de propósito:**
  - o contrato `src/games/types.ts`, o shell (`GameShell.tsx` e `Panels.tsx`, com introdução, pausa, resultado e erro), o registry, o kit (`src/games/kit`: texto, painel, balão, ícones, insets), o motor de áudio e os saves (`readVersioned`);
  - as regras do servidor, que importam a lógica pura de cada jogo. Isso é uma escolha deliberada (0005, 0009, 0012–0014), não acoplamento indevido.
- **Única dependência do portal num detalhe interno de jogo:** `src/games/resume.ts` importa `off-air-vacation/save.ts` para o painel de introdução. O módulo é pequeno e sem Phaser, então é aceitável.
- **Estado:**
  - lojas em módulo com `useSyncExternalStore`: progresso, competição, missão, áudio e `room/lookStore`;
  - um único contexto React, o de idioma;
  - nenhuma biblioteca de estado, e não falta uma.
- **Persistência:**
  - `localStorage` com prefixo `canal404:` e versão no payload ([0001](../decisions/0001-save-versioning.md));
  - cópia opcional no servidor para quem tem carteirinha ([0015](../decisions/0015-recovery-code-and-cloud-copy.md));
  - fila de resultados não enviados (`canal404:outbox:v1`).
- **Integridade:**
  - Laboratório, Rua, Ladeira, Madrugada e Ao Vivo são refeitos no servidor;
  - Lanche, Recreio, Pijama e Férias são "checked", forjáveis de forma consistente, como a [0004](../decisions/0004-result-validation.md) documenta.

### Pontos quentes de mudança (commits desde 2026-11-01)

| Arquivo | Commits | Commits de correção |
| --- | --- | --- |
| `src/games/registry.ts` | 46 | n/d |
| `src/components/game-shell/Panels.tsx` | 29 | 18 |
| `src/components/game-shell/GameShell.tsx` | 25 | 17 |
| `src/lib/competition/rules.ts` | 16 | 8 |

O shell é o ponto em que uma mudança alcança os nove jogos de uma vez. É o lugar onde mais vale cuidado com regressões (seção F).

---

## C. Inventário de achados

**Categorias:** Bug = bug confirmado; Risco = risco técnico; Dívida = dívida técnica; Incons. = inconsistência; Refat. = oportunidade de refatoração; Opc. = melhoria opcional.

**Esforço:** XS ≤ 1 h · S 1–4 h · M ≈ 1 dia · L > 1 dia.

**Evidência:**
- R: reproduzido (navegador, script de rascunho ou banco);
- M: medido;
- E: análise estática confirmada no código, incluindo o código-fonte do Phaser quando relevante.

| ID | Categoria | Problema | Evidência | Módulo | Prioridade | Confiança | Esforço |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | Bug | Sair durante o final do Férias perde o resultado da aventura para sempre | R (script com o `SCRIPTS.console` real) | `off-air-vacation` | P1 | Alta | S–M |
| F02 | Bug | Ao Vivo no 404 fica parado sem cartão depois de girar ou redimensionar com o cartão aberto | E (código e Phaser) | `talent-show` | P1 | Alta | XS |
| F03 | Risco | Uma exceção num frame congela qualquer jogo, sem aviso nem saída | R (injeção de falha no navegador) | shell e todos os jogos | P2 | Alta | S |
| F04 | Bug | O envio da fila de resultados apaga resultados enfileirados durante o envio | R (teste de rascunho) | `lib/competition/client.ts` | P2 | Alta | XS |
| F05 | Risco | Duas abas sobrescrevem o progresso uma da outra (loja do portal e autosave do Férias) | R (mecanismo) | `lib/progress/store.ts`, `off-air-vacation` | P2 | Alta (mecanismo), Média (frequência) | S–M |
| F06 | Bug | Recreio: "Recomeçar partida" depois de um sino volta ao sino, esquece batidas e tira a partida do placar | E | `operation-recess` | P2 | Alta | S |
| F07 | Risco | Falhas de carregamento dentro do jogo não chegam ao shell (arte nos 9 jogos; texto do Férias trava o carregamento) | E | contrato e BootScenes | P2 | Alta | S–M |
| F08 | Incons. | Fórmulas de pontuação copiadas à mão entre jogo e juiz (Laboratório, Lanche, Férias) | E | `rules.ts` e jogos | P2 | Alta | S |
| F09 | Risco | Painéis do shell declaram `aria-modal` sem conter o foco; o palco fica alcançável por Tab | E | `game-shell/Panels.tsx` | P2 | Média–Alta | S |
| F10 | Risco | Handlers de `SHUTDOWN` não rodam quando o jogo é destruído (o Férias perde até 8 s de save) | E (Phaser `Systems.js:798`) | vários jogos | P3 | Alta | XS–S |
| F11 | Risco | Ids de fase e pista mantidos à mão no registry e nas regras, sem verificação (hoje batem) | M (comparação executada) | `registry.ts`, `rules.ts` | P3 | Alta | XS |
| F12 | Bug | Ao Vivo: a pausa deixa a contagem e o chiado tocando, e derruba a nota longa em curso | R (juiz em script) | `talent-show` | P3 | Alta | S |
| F13 | Incons. | O Phaser reprocessa teclas quando três eventos caem no mesmo frame; só Laboratório e Pijama se protegem | R (KeyboardPlugin real em script) | Rua, Lanche, outros | P3 | Alta | S |
| F14 | Bug | Rua Sem Saída (toque): a mira segurada continua repetindo depois de pausar e retomar | E | `dead-end-street` | P3 | Média | XS |
| F15 | Risco | Madrugada: um segundo resize durante a reconstrução perde as jogadas e a contagem de dicas | E | `past-bedtime` | P3 | Média | S |
| F16 | Dívida | Listeners que se acumulam a cada reinício de cena | E | Rua, Lanche, Ladeira | P3 | Alta | XS |
| F17 | Incons. | Cópia na nuvem: apagar com o placar fora do ar não apaga a cópia; falhas de envio invisíveis; restauração sem espaço não faz backup; navegador só com flags não é tratado como vazio | R (testes de rascunho) | `lib/progress/snapshot.ts`, `cloud-copy.ts` | P3 | Alta | S |
| F18 | Risco | Falhas e timeouts de banco nunca vão para o log | E | `server/route.ts`, `db.ts` | P3 | Alta | XS |
| F19 | Risco | Limites por endereço usam o IPv6 inteiro; a pausa de 8 rejeições é contornável em paralelo; banidos voltam | R (banco local) | `server/http.ts`, `runs.ts` | P3 | Média–Alta | S |
| F20 | Risco | Replays de outro tipo aceitos e guardados em qualquer jogo; cópia na nuvem vira 48 KB de armazenamento livre e o GET não tem limite | R (banco local) | `server/schemas.ts`, `runs.ts`, rota `copy` | P3 | Alta | S |
| F21 | Incons. | Férias: o máximo forjado entra em 1º na hora e fica lá para sempre; o 3º segredo nunca chega ao placar | R (banco local) | `rules.ts`, `story.ts` | P3 | Alta | XS (decisão) |
| F22 | Refat. | Infraestrutura repetida entre jogos: `scenes/frame.ts` em 6 cópias divergentes, `index.ts` e `BootScene` repetidos, `TOUCH_UI` fixado no carregamento | E (diff) | 9 jogos | P3 | Alta | M |
| F23 | Opc. | Cada montagem e destruição do Phaser retém ~0,35–0,5 MB e um listener em `document`; o contexto WebGL não é liberado | M | shell e Phaser | P3 | Alta | S |
| F24 | Incons. | CI cancela execuções em `main`; um e2e fixa texto, contra a 0007, e causou a única falha recente em `main` | M (histórico do CI) | `.github/workflows/tests.yml`, `e2e/scoreboard.spec.ts` | P3 | Alta | XS |
| F25 | Incons. | Detalhes de UI: `data-scroll-behavior` ausente, safe areas laterais, rolagens suaves com movimento reduzido, foco inicial com missão, toasts com link, `<a>` cru | E | portal | P3 | Média–Alta | S |
| F26 | Dívida | Código morto (incluindo um modo da Ladeira que quebraria o replay se ligado) e documentação desatualizada | E | vários | P3 | Alta | S |
| F27 | Refat. | `WorldScene.ts` do Férias: cenas divididas entre um switch de 17 casos e `areas.ts`, estado em `vars: Record<string, unknown>` | E | `off-air-vacation` | P3 | Alta | M |

Itens menores, observados e sem ação recomendada agora, estão no fim da seção D.

---

## D. Análise aprofundada

### F01. Férias: sair durante o final perde o resultado (P1)

**Arquivos:**
- `src/games/off-air-vacation/story.ts:899-905`, script `console`;
- `src/games/off-air-vacation/scenes/WorldScene.ts:1111-1124`, `:1290-1340` e `finish()` em `:1394`.

**Comportamento atual:**
1. Logo depois da escolha final, `d.set("ended")` grava `flags.ended = true` no save (`story.ts:901`).
2. Só depois vêm várias falas, a troca para a cena da festa, mais falas, e por fim `finish()`, que monta e envia o `finished`.
3. Se a página for fechada, recarregada ou travar nesse intervalo, o save fica marcado como terminado sem que nenhum resultado tenha saído.
4. Ao recarregar, o script `console` só responde a fala de "terminado" (`story.ts:874-877`) e nada leva de volta à festa.
5. `d.s.ending` é atribuído depois de `ended`, então pode ficar `null` no save.

**Por que é um problema:** é o fim de uma aventura de várias sessões. O jogador perde:
- o registro local;
- a entrada no placar;
- a conquista `offair-mystery`.

A única saída é começar uma aventura nova.

**Como foi verificado:** um script de rascunho rodou o `SCRIPTS.console` real com storage em memória e interrompeu a festa. Depois de recarregar ficou `ended=true`, `ending=null`, e o console nunca mais alcança a festa.

**Solução proporcional:**
1. Atribuir `ending` antes de `ended`.
2. Marcar `flags.reported` em `finish()`.
3. No `create()` em modo jogo, se `ended && !reported`, reabrir direto na festa, ou pelo menos emitir o resultado.
4. Saves que já terminaram e mandaram resultado não podem rever a festa. Use o registro do portal (`games["off-air-vacation"].highScore > 0`) como sinal, ou trate a ausência de `reported` como reportado quando esse registro existir.

**Efeitos colaterais:**
- Muda o formato do save do Férias. Pela 0001, isso pede subir `v`, adicionar uma migração e estender `save.test.ts`.
- Não muda pontuação nem regra do placar.

### F02. Ao Vivo no 404: jogo parado depois de reconstrução (P1)

**Arquivos:**
- `src/games/talent-show/index.ts:66` (`scene()` usa `isActive`), `:86-94` (`onReady`), `:167-183` (`reshape`);
- `src/games/talent-show/scenes/StageScene.ts:251`.

**Comportamento atual:**
1. Quando o formato muda (girar o celular, cruzar um breakpoint no desktop ou uma mudança pendente aplicada no próximo `start()`), `reshape()` destrói o `Phaser.Game` e cria outro.
2. A cena nova chama `bridge.onReady()` dentro do próprio `create()`.
3. Se `started` já é verdadeiro, `onReady` chama `scene()?.prepare(...)`. Só que `scene()` exige `isActive("stage")`, que só é verdadeiro com status `RUNNING`, e durante o `create()` o status é `CREATING` (`node_modules/phaser/src/scene/SceneManager.js:620`, `Systems.js:611-614`).
4. Resultado: `prepare` nunca roda. Fica um palco sem cartão em que toques e Esc não fazem nada. Só Pausar → Recomeçar resolve.

**Impacto:** girar o celular com o cartão da música aberto é comum num jogo que tem layouts diferentes em pé e deitado.

**Solução:** chamar `onReady` depois do `create()`, por exemplo com `this.events.once(Phaser.Scenes.Events.CREATE, …)` ou um `setTimeout(…, 0)`, como a Madrugada já faz. Outra opção é passar a cena para `onReady(scene)`. É uma linha, sem efeito colateral conhecido.

### F03. Uma exceção num frame congela qualquer jogo, sem aviso (P2)

**Arquivos:**
- `node_modules/phaser/src/dom/RequestAnimationFrame.js:89-97`: `step` chama o callback antes de pedir o próximo frame;
- `src/components/layout/AppProviders.tsx:21-28`: o erro só vai para a telemetria;
- `src/components/game-shell/GameShell.tsx:404-412`: o painel de erro só existe para falha de carregamento.

**Comportamento atual:** o Phaser não tem `try/catch` no passo do jogo (`Game.js`, `TimeStep.js`, `SceneManager.js`). Se qualquer `update` ou `render` lança uma exceção, o próximo `requestAnimationFrame` nunca é agendado e o jogo para de vez. Pausar e continuar não reinicia o laço.

**Reproduzido:** em Guerra de Lanche, num build de produção, um erro único foi injetado numa chamada WebGL de desenho. Resultados:
- antes do erro, o canvas mudava entre capturas;
- depois do erro, deixou de mudar, inclusive depois de pausar e continuar;
- nenhum diálogo apareceu, e o único sinal foi o `pageerror`.

**Impacto:** qualquer bug de execução em qualquer um dos nove jogos vira tela congelada sem explicação. A frequência depende dos bugs, mas o projeto tem muitas rodadas de polimento por semana.

**Solução proporcional:**
- No `GameShell`, enquanto a etapa for `playing`, `paused` ou `intro`, escutar `error` em `window`.
- Ao receber um erro, mudar para uma etapa `error` com "Recarregar o jogo", que remonta pelo `attempt` que já existe.
- Não tentar continuar o jogo quebrado.

**Efeitos colaterais:** erros de terceiros (extensões) também acionariam o painel. Para evitar isso, filtrar por `event.filename` do mesmo domínio ou só reagir se o canvas parar. Rodar de novo o smoke `e2e/games.spec.ts`.

### F04. A fila de resultados apaga o que entra durante o envio (P2)

**Arquivos:** `src/lib/competition/client.ts:187-208` (`flushOutbox`), `:171-173` (`queue`).

**Comportamento atual:** `flushOutbox` lê os itens, espera cada envio (até 6–10 s por item) e no fim grava só os que sobraram (`writeOutbox(keep)`). Tudo que `queue()` ou `holdUntilJoined()` adicionou no meio, nesta aba ou em outra, é apagado.

**Impacto:** resultados de placar e conclusões de missão se perdem. O progresso local fica intacto. Acontece justamente com rede instável, que é a única situação em que a fila existe.

**Solução:**
1. No fim do envio, reler a fila.
2. Remover só os tickets que este envio resolveu.

O servidor já é idempotente por ticket, então reenviar em duplicidade é inofensivo.

**Teste:** estender `src/lib/competition/client.test.ts`. Pela 0007 isso é permitido, porque protege resultados do jogador.

### F05. Abas múltiplas sobrescrevem o progresso (P2)

**Arquivos:**
- `src/lib/progress/store.ts:172-198`: `writeStorage` grava o estado em memória inteiro; `ensureLoaded` só relê num `storage` com a chave exata e ignora `key === null`;
- `src/games/off-air-vacation/save.ts:96-101` e `scenes/WorldScene.ts:527-537`: autosave a cada 8 s, a partir da memória.

**Comportamento atual:** cada alteração parte da cópia em memória. Uma aba que perdeu atualizações sobrescreve o que outra gravou. Isso acontece com uma aba restaurada do back/forward cache, uma aba congelada em segundo plano, gravações quase simultâneas ou um "limpar dados do site" com a aba aberta.

**Como foi verificado:**
- A aba B vence uma fase e a aba A registra um início de partida em seguida: a fase de B some.
- Depois de um `clear` (`key === null`), a próxima gravação local devolve o save antigo.

**Impacto:** estrelas, fases e conquistas perdidas, ou um save "apagado" que volta. A frequência é baixa a média, porque exige duas abas ou restauração do bfcache.

**Solução:**
- Um `mutate(fn)` que relê o storage antes de cada alteração. São poucos KB por parse, e as lojas da Ladeira e do Pijama já fazem isso.
- Tratar `key === null`.
- No Férias, um contador `rev` no save: antes de gravar, se o `rev` guardado for mais novo, recarregar em vez de sobrescrever.

**Efeito colateral:** nenhum relevante. Um save ilegível continua indo para backup como hoje.

### F06. Recreio: "Recomeçar partida" não recomeça (P2)

**Arquivos:**
- `src/games/operation-recess/index.ts:53-58` e `:84-86`: `restart()` sempre chama `restartScene(true)`;
- `scenes/StageScene.ts:221-231`: a retomada repõe `hits` do snapshot do sino;
- `:733-734`: `cp.hits` só é atualizado num nocaute.

**Comportamento atual:** depois de um sino, o botão do cabeçalho e o da pausa ("Recomeçar partida") voltam ao sino com `resumed=1`. Os corações reenchem e as batidas tomadas depois do sino somem.

**Impacto:**
- A ação não faz o que o rótulo diz.
- A partida deixa de contar para o placar sem aviso (`resumed`).
- Pode dar 3 estrelas locais e a conquista `recess-flawless` depois de batidas reais.

**Solução:**
- O `restart()` do shell limpa o checkpoint e recomeça do início.
- "Voltar ao sino" continua só como ação do resultado (`restartLabel`), por `alt` ou por uma flag.

Em missões (`checkpoints:false`) nada muda.

### F07. Falhas de carregamento dentro do jogo não chegam ao shell (P2)

**Arquivos:**
- nenhum `BootScene` dos 9 jogos escuta `loaderror` (verificado com grep: só `progress`);
- `src/games/off-air-vacation/index.ts:11-18` e `scenes/BootScene.ts:140-147`: `void load.then(...)` sem `catch`;
- contrato em `src/games/types.ts:58-71`.

**Comportamento atual:**
- O loader do Phaser conta a falha e termina mesmo assim. O jogo começa com placeholders, ou uma peça vira "tábua" em `dead-end-street/scenes/PlayScene.ts:441-446`.
- No Férias, se o chunk de texto falha, o carregamento fica girando para sempre.
- O shell só trata falha do `import()` do jogo.

**Impacto:** em rede móvel instável, o jogador vê arte quebrada ou uma tela de carregamento infinita, sem botão de tentar de novo.

**Solução:**
1. `onError?: (error: unknown) => void` opcional em `GameHostContext`, ligado ao `ErrorPanel` que já existe.
2. Um helper no kit que os `BootScene` chamam ao terminar o carregamento com falhas, depois de uma nova tentativa.
3. No Férias, um `catch` que chame `ctx.onError`.

**Efeitos colaterais:** um ícone que falhar passa a bloquear o jogo. Por isso a nova tentativa vem antes de falhar.

### F08. Pontuação copiada à mão entre jogo e juiz (P2)

**Onde:**

| Jogo | No jogo | No juiz | O que diverge |
| --- | --- | --- | --- |
| Laboratório | `bad-ideas-lab/scenes/LabScene.ts:1974-1982` (usa `starsFor` de `levels.ts:121`) | `src/lib/competition/rules.ts:207-208` | O juiz reescreve `1000 + (total − peças) × 150 + attemptBonus` e a regra de estrelas |
| Guerra de Lanche | `food-fight/scenes/LunchScene.ts:1040,1042` (`+50` literal) | `rules.ts:219,264,289` (`BIG_FIRST_HIT = 50`) | O valor do primeiro acerto no Grandão está duplicado |
| Férias | `off-air-vacation/scenes/WorldScene.ts:1404` e `:832` | `rules.ts:439-440` | O juiz reescreve o limiar de estrelas (3 cartazes, 2 segredos) |

**Por que é um problema:** se só o lado do jogo mudar numa rodada de polimento, o servidor responde `score_mismatch` ou `inconsistent` para toda partida honesta daquele jogo. O teste de regras tem sua própria cópia da fórmula do Laboratório (`rules.test.ts:66`) e não pegaria a divergência. Só o e2e de placar do Laboratório pegaria, e Lanche e Férias não têm nenhuma proteção.

**Contraste:** o resto das regras importa as constantes de `config.ts` de cada jogo. O Recreio compartilha `recessStars` e o Pijama tem `score.test.ts`.

**Solução:**
- `labScore(total, used, runs)` em `levels.ts`.
- `SCORE.bigHurt` em `food-fight/config.ts`.
- `resortResult(counts)` em `off-air-vacation/config.ts`.
- Usar cada helper no jogo, no juiz e no teste.

Nada muda de valor, então as versões das regras ficam iguais.

### F09. Painéis do shell e foco (P2, acessibilidade)

**Arquivos:**
- `src/components/game-shell/Panels.tsx:183-210` (`OverlayFrame` com `role="dialog"` e `aria-modal="true"`), `:174-181` (`useAutoFocus`, uma tentativa aos 60 ms);
- `GameShell.tsx:651-658`: o palco tem `tabIndex=0` e recebe as teclas do jogo.

**Comportamento atual:**
- Nada contém o foco e nada fica `inert`. Um Shift+Tab leva o foco para o palco, escondido sob o overlay.
- Leitores de tela que respeitam `aria-modal` podem esconder o cabeçalho (Voltar, Som), e o painel de introdução não tem saída própria.
- Com `?mission=`, se a missão chega depois do jogo, o botão "Começar missão" nasce sem foco e o foco fica no `body` (`Panels.tsx:565-571`, `:715`).

**Contraste:** `TvZoom.tsx`, `MenuDrawer.tsx` e `TapeShelf.tsx` já contêm o foco direito.

**Solução:**
- `inert` no palco quando a etapa não é `playing`.
- Ou tirar `aria-modal`, para o cabeçalho continuar utilizável, ou pôr um link de volta no painel de introdução.
- Focar de novo quando `missionPending` virar falso e o foco estiver no `body`.
- Rodar os e2e de teclado (`e2e/portal.spec.ts`, `games.spec.ts`) depois.

### F10. `SHUTDOWN` não roda no destroy do jogo (P3)

O Phaser 3.90 emite só `DESTROY` em `Systems.destroy` (`node_modules/phaser/src/scene/Systems.js:798-812`). Cenas que limpam ou salvam em `events.once(SHUTDOWN, …)` não fazem nada ao sair da página.

- **Férias:** o save de saída (`WorldScene.ts:262`) nunca roda, então se perdem até 8 s de posição e de tempo de jogo.
- **Ao Vivo:** o descarte do player (`StageScene.ts:252`) também nunca roda. `quit()` cobre a saída normal, mas uma reconstrução depois da tela de resultado deixa um `GainNode` pendurado no motor de áudio.
- **Ladeira:** já trata os dois eventos (`downhill-derby/scenes/frame.ts`).

**Solução:** salvar em `pause()` e `destroy()` do `GameInstance`, ou escutar também `DESTROY`.

### F11. Ids de fase duplicados sem verificação (P3)

**Onde:**
- `src/games/registry.ts:49-84` (`levelIds`) repete os ids que cada jogo define;
- `rules.ts:450` escreve as pistas da Ladeira à mão (`["arlindo", "feira", "antena"]`).

**Situação atual:** um script de rascunho comparou registry e regras para os 9 jogos, e todos batem.

**Por que mesmo assim é um risco:**
- O shell pede o ticket com o id do registry (`GameShell.tsx:520`), e o servidor recusa níveis que a regra não conhece.
- Uma fase renomeada só de um lado quebra o placar daquela fase sem erro visível.
- Importar os níveis no registry puxaria dados dos jogos para todas as páginas, então não é uma boa solução.

**Solução:** um teste pequeno que compara `GAMES[].levels` com `RULES[].levels`. Ele cabe na categoria 2 da 0007, porque evita que partidas honestas sejam recusadas em silêncio. A regra da Ladeira deve importar os ids da pista.

### F12. Ao Vivo: pausa e áudio, pausa e nota longa (P3)

- **Contagem e chiado após pausar:** `talent-show/audio/player.ts:96`, `:146-164`. A contagem, as notas da Mila e o chiado são agendados no `sfx`, e `dispose()` só abaixa `music`. Cliques de contagem (1,8–3,35 s) continuam depois da pausa, e um Esc-Esc rápido dá duas contagens sobrepostas.
- **Nota longa derrubada:** `StageScene.ts:1154-1163`. A pausa solta toda nota segurada no instante da pausa.
  - Reproduzido com o juiz: um log perfeito com uma nota de 789 ms solta pela metade cai de 4500 para 4470, a plateia perde 6 e a sequência da medley cai de 141 para 114.
  - Só Sign-off e Medley têm notas longas assim.
- **Solução:**
  - Em `dispose()`, levar o ganho do `sfx` a 0.
  - Manter a nota aberta através da pausa e fechar com o tempo da pausa só se o dedo ou a tecla subir durante ela.
  - Os tempos já estão em tempo de música, então o juiz não muda.

### F13. Teclas processadas duas vezes (P3)

**Mecanismo:** o `KeyboardPlugin` do Phaser relê a fila inteira a cada novo evento de tecla, e a checagem de duplicata só compara com o evento anterior. Com três eventos num frame lento, o primeiro roda de novo.

**Reproduzido:** um script com o `KeyboardPlugin.update` real e q-down, q-up, ArrowUp-down produziu `['q','q','ArrowUp']`.

**Quem se protege:** só o Laboratório (`LabScene.ts:167,1558-1559`) e o Pijama.

**Impacto:** na Rua Sem Saída, Q ou Tab podem trocar a munição duas vezes e uma seta pode mover a mira dois passos. No Lanche, o intervalo entre arremessos já bloqueia o efeito.

**Solução:** um helper `onKey(kb, handler)` no kit, com a proteção, usado pelos jogos de teclado.

### F14 a F16. Bugs pequenos de ciclo de vida

- **F14, Rua Sem Saída:** `scenes/dock.ts:1055-1071`, `:158-159`. A repetição da mira só para em `pointerup` ou `gameout`, e com a cena pausada o Phaser descarta a entrada (`InputPlugin.js:711`). Um dedo levantado durante a pausa deixa a mira correndo depois de retomar.
  - **Solução:** chamar `stopHold()` no handler de pausa que já existe (`PlayScene.ts:674-675`), como o Lanche faz em `LunchScene.ts:275`.
- **F15, Madrugada:** `past-bedtime/index.ts:149-166`, `:182`. Um segundo evento do ResizeObserver durante a reconstrução (comum no Safari depois de girar) encontra `scene()` nulo e reinicia com `carry = null`. Perde as jogadas da parte e zera `hints`. Pela 0013 o servidor já confia nessa contagem, então isso não abre um buraco novo, mas a contagem informada fica errada.
  - **Solução:** guardar o último `carry` na closure.
- **F16, listeners acumulados:** `PlayScene.ts:674-675` e `LunchScene.ts:275` (pausa e retomada); `downhill-derby/scenes/GarageScene.ts:102` (`events.on(SHUTDOWN)`). O emissor da cena sobrevive ao `scene.restart()`, então cada reinício soma uma cópia. Hoje é inofensivo, porque os handlers são idempotentes.
  - **Solução:** `once` ou remover no `SHUTDOWN`.

### F17. Cópia na nuvem e apagar progresso (P3)

Tudo foi reproduzido com testes de rascunho:

- **Apagar com o placar fora do ar** (`components/extras/ExtrasHub.tsx:330-331`, `lib/progress/store.ts:159-171`, `lib/competition/cloud-copy.ts:86-96`):
  - "Apagar meu progresso" remove a marca `canal404:sync:v1`;
  - o envio forçado sai cedo se o status for offline ou "checking", então a cópia no servidor não é apagada, embora o aviso diga que será;
  - depois disso os envios param e o Extras oferece de volta o progresso apagado.
  - **Solução:** não remover a marca, que é só do aparelho, ou repetir o envio no próximo `connect`.
- **Restauração sem espaço** (`snapshot.ts:43-52`, `migrate.ts:64-74`): `backupRaw` engole o erro de cota e a restauração remove o save mesmo assim.
  - **Solução:** `backupRaw` retorna sucesso, e a restauração para se falhar.
- **Falhas de envio invisíveis** (`cloud-copy.ts:58`): uma cópia grande demais, com mais de 32 chaves ou recusada com 400 só retorna `false`, e o cartão continua dizendo que há cópia.
  - **Tamanho medido:** cerca de 8,6 KB realistas e 19,4 KB no pior caso, contra o limite de 48 KB.
- **"Navegador vazio"** (`snapshot.ts:39-41`): qualquer chave além do progresso conta como progresso, inclusive as flags de tutorial, então quem só tem flags é perguntado em vez de receber a cópia direto, como diz a 0015.

### F18 a F21. Servidor

O servidor não tem problema grave. Os achados são de custo, observabilidade e anti-trapaça fraca, e o que foi reproduzido usou o banco `canal404_audit_test`.

- **F18, observabilidade:** `server/route.ts:15` só registra erros que não são "indisponível", e `server/db.ts:33-50` classifica como indisponível todo `PrismaClientUnknownRequestError`, panics e timeouts de transação (`P2028`). Quedas reais e timeouts não deixam rastro no log da Vercel.
  - **Solução:** uma linha de aviso com o código do erro.
- **F19, limites e abuso:**
  - **IPv6:** `server/http.ts:98-106` usa o endereço completo. Atrás da Vercel o `x-forwarded-for` não é forjável, mas no IPv6 uma casa controla um /64 inteiro, e cada endereço ganha seu contador.
    - Reproduzido: 40 joins com endereços diferentes, 40 criados.
    - **Solução:** chavear o IPv6 pelo prefixo /64.
  - **Pausa de 8 rejeições:** `runs.ts:113,122` lê o contador, julga e só depois incrementa.
    - Reproduzido: 25 resultados forjados em paralelo geraram 25 rejeições guardadas.
    - **Solução:** incrementar antes de julgar.
  - **Banidos:** `identity.ts:106` trata um cartão banido como "sem cartão", e o banido pode criar outro. É inerente ao anonimato; basta documentar.
- **F20, dados aceitos demais:**
  - `schemas.ts:111` aceita qualquer `replay` em qualquer jogo, e `runs.ts:97,149` o guarda.
    - Reproduzido: um log de 16 KB do Ao Vivo guardado numa partida do Férias, que, sendo recorde, nunca é limpa.
    - **Solução:** aceitar só o tipo de replay que a regra do jogo espera.
  - A rota `players/me/copy` valida só os nomes das chaves (`schemas.ts:139-146`), e o GET não tem limite (`route.ts:10-15`).
    - Reproduzido: 45 KB de lixo aceitos, 300 GETs seguidos com 200.
    - **Solução:** limite por jogador no GET e, opcionalmente, valores em JSON válido.
- **F21, Férias no placar:**
  - `rules.ts:422-441` tem `minElapsedMs: 0`, e o melhor ranking possível é alcançável na hora. Como o empate vai para quem chegou primeiro, quem forjar primeiro fica em 1º para sempre (reproduzido: 201, 1º lugar).
  - A [0004](../decisions/0004-result-validation.md) já aceita que jogos "checked" são forjáveis. A diferença aqui é a permanência.
  - Além disso, o segredo "lento" só existe depois do final, e o `finished` sai uma vez só no final (`story.ts:698-709`). O máximo real é 2150, não 2400.
  - **Decisão de produto:** mostrar o Férias como lista de quem terminou, usar a idade do ticket como tempo mínimo, ou aceitar e documentar.

**Custo de CPU por envio:** está limitado. Os juízes só rodam depois de um ticket assinado válido, de um jogador conhecido e dos limites de requisição, e os limites de tamanho dos logs seguram o pior caso. Piores casos medidos localmente:

| Juiz | Pior caso medido |
| --- | --- |
| Rua Sem Saída | ≤ 36 ms |
| Ladeira Abaixo | 3–33 ms (estimado ≤ ~200 ms no teto de 28.800 passos) |
| Laboratório | ≤ 1,4 ms |
| Ao Vivo no 404 | ≤ 1 ms |
| Operação: Recreio | ≤ 1,3 ms |

A soma de subconjuntos do Recreio (`rules.ts:106`) cresce exponencialmente com o número de monitores. Hoje são 6–9 por fase e leva ~1 ms (medido), mas ela explodiria perto de 30 monitores.

### F22. Infraestrutura repetida entre jogos (P3, refatoração)

- **`scenes/frame.ts` em 6 cópias** (Rua, Laboratório, Pijama, Recreio, Férias, Ladeira; um diff mostrou 3–10 linhas de diferença entre elas):
  - só a Ladeira trata `DESTROY` e ignora resize repetido;
  - só o Férias troca o layout inteiro (`swap`);
  - as outras quatro são quase idênticas.
- **Boilerplate repetido:** a configuração do `Phaser.Game` em `index.ts`, os `BootScene` e o temporizador "segura e depois `finished`".
- **`TOUCH_UI`:** `operation-recess/scenes/StageScene.ts:31`, `pajama-war`, `off-air-vacation` e outros calculam `(pointer: coarse)` uma vez, ao carregar o módulo. Num notebook com tela de toque, o Recreio não mostra controles, enquanto o Pijama liga os controles no primeiro toque (`pajama-war/scenes/hud.ts:668-672`).

**O que se ganha:** um lugar só para F03, F07, F10 e F13 e para regras de limpeza iguais.

**O que não unificar:** HUDs, câmeras, painéis dentro do canvas e layouts (`layout.ts`), que são decisões de cada jogo.

### F23. Memória entre partidas (P3, opcional)

O método da medição e os números estão na seção "Medições" abaixo.

- O número de canvases e de listeners em `window` volta à linha de base em todos os jogos, o que mostra que a limpeza dos jogos está boa.
- O listener a mais em `document` por ciclo vem do `VisibilityHandler` do Phaser 3.90, que nunca o remove (`node_modules/phaser/src/core/VisibilityHandler.js:65`).
- O Phaser também não chama `WEBGL_lose_context` no destroy, então cada jogo aberto deixa um contexto WebGL até o GC. O Chrome aceita 16 contextos ativos e menos no celular.
- **Impacto real baixo:** seriam precisos dezenas de jogos abertos na mesma aba.
- **Solução opcional:** no `destroy()` de cada jogo (ou num helper do kit), perder o contexto WebGL antes de `game.destroy(true)`.

### F24. CI e testes (P3)

- **Execuções canceladas em `main`:**
  - `.github/workflows/tests.yml:8-10` usa `cancel-in-progress: true` também para `main`;
  - das 58 execuções recentes em `main`, 20 foram canceladas, então merges seguidos deixam commits de `main` sem verificação completa;
  - **solução:** `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`.
- **E2e que fixa texto:**
  - `e2e/scoreboard.spec.ts:84` compara o texto exato do resultado ("1 peça · … Você está em …"), contra a regra da 0007;
  - foi a causa da única falha recente em `main` (execução 45226908640, commit `076cdbc`), corrigida depois;
  - **solução:** verificar o resultado pela resposta da API, que o teste já lê na linha 82, e por um papel ou região, não pelo texto.
- **Instabilidade já corrigida:** a outra falha daquela execução foi uma corrida de navegação no teste de recuperação, já corrigida em `b190188`.

### F25. Detalhes de UI (P3)

- **Rolagem suave na troca de página** (verificado em `next/dist/shared/lib/router/utils/disable-smooth-scroll.js:21-31`): `globals.css:65-67` usa `scroll-behavior: smooth`, mas o `<html>` em `src/app/[lang]/layout.tsx:52` não tem `data-scroll-behavior="smooth"`, o atributo de que o Next 16 precisa para desligar a rolagem suave na troca de rota.
- **Safe areas laterais:** só o inferior é tratado (`viewportFit: "cover"` em `layout.tsx:45`). O TopBar, o cabeçalho do jogo (`GameShell.tsx:593`) e o rodapé ficam sob o notch em paisagem. Não foi verificado em aparelho, e os jogos já tratam insets pelo `kit/insets.ts`.
- **Rolagens suaves com movimento reduzido:** `room/RoomPanner.tsx:79,106`, `Panels.tsx:550` e `missions/MissionHub.tsx:117` passam `behavior: "smooth"` sem checar movimento reduzido.
- **Toasts com link:** fecham em 5,2 s sem pausar com hover ou foco (`ToastList.tsx:42-49`), e o foco cai no `body`.
- **Links fora da convenção:** `Panels.tsx:615` usa `<a>` cru para `/mission`, o que recarrega a página inteira. `ToastList.tsx:91` e `SideNav.tsx:23` usam `Link` onde a 0010 pede `IntentLink`.
- **Cartazes:** `extras/PosterCard.tsx:122-131` engole o erro de `drawPoster` e fica em "sintonizando" para sempre.
- **Fitas:** `room/tapes/programs.ts:11-18` guarda em cache um `import()` que falhou.
- **Fuso horário:** `CloudCopyOffer.tsx:74`, `RecoveryCodePanel.tsx:79` e `PlayerCard.tsx:90` fixam `America/Sao_Paulo` sem rótulo, enquanto as missões usam Fortaleza.

### F26. Código morto e documentação (P3)

- **Inalcançáveis ou sem uso:**
  - a dica "gire o celular" (`GameShell.tsx:745-751` e `copy.rotate`): todos os 9 jogos definem `orientation`;
  - o modo de interferência dust/kick da Ladeira (`downhill-derby/sim/race.ts`, `RaceScene.ts:888-966`, `copy.ts:131-139`): o jogo sempre passa `"off"`, e se alguém ligar, o tempo do cliente deixa de bater com `replayDownhill`, que simula o jogador sozinho ([0012](../decisions/0012-downhill-replay.md));
  - a segunda execução completa do juiz ao fim de cada música (`talent-show/scenes/StageScene.ts:1235-1242`): ninguém lê o resultado.
- **Exports sem importador** (verificados):
  - `Primitives.tsx` `Sticker`, `Icons.tsx` `StarIcon`, `badgeShape.ts` `badgeSvg`;
  - `Covers.tsx` `StrangeHouseCover` e os textos alternativos dele;
  - `ResortFolks.tsx` `FOLK_VIEWBOX`;
  - `store.ts` `bumpCounter`, `setCounter` (manter o campo `counters` do save), `TOTAL_SECRETS`, `TOTAL_ACHIEVEMENTS`;
  - `definitions.ts` `SECRET_IDS`, `locales.ts` `otherLocale`, `physics/matter.ts` `physicsIsDeterministic`;
  - helpers de teste que sobraram da 0007: `telemetry.ts` `addTelemetrySink` e `resetTelemetryForTests`, e `missions/client.ts` `resetMissionForTests`.
- **Pequenos no Férias:**
  - `story.ts:980` `TOTALS` sem uso;
  - `ArenaScene.ts:1375` `bestTime` (Pijama) escrito e nunca lido;
  - `save.ts:83` aceita qualquer string em `found`, quando a 0001 pede descartar ids desconhecidos.
- **Documentação:**
  - `README.md:132` ainda descreve a "TV with the game of the week", retirada no PR #3;
  - a telemetria emite `board_submit` (`telemetry.ts:9`), que não está na lista fechada da [0002](../decisions/0002-privacy-first-telemetry.md), e `game_load_error` contorna o teto de 8 erros;
  - `package.json:15-17` usa `jiti`, que não está declarado e só existe como dependência transitiva do eslint, do tailwind e do prisma.

### F27. Férias: `WorldScene.ts` (P3, refatoração)

É o único arquivo grande em que o tamanho atrapalha de verdade:

- `off-air-vacation/scenes/WorldScene.ts` tem 1.940 linhas;
- as cenas ficam divididas entre um `action()` de 17 casos (`:939-1290`) e 29 chamadas `b.act` em `areas.ts`;
- o estado passa por `vars: Record<string, unknown>` (`:62`), com cerca de 19 chaves em string e 13 casts.

Novos conteúdos da história são onde mora o risco do F01.

**Proposta:**
- levar cada caso para a área a que pertence;
- tipar `vars`.

Os outros arquivos grandes (`RaceScene.ts` com 2.082 linhas, `LabScene.ts`, `NightScene.ts`, `StageScene.ts`, `BroadcastRoom.tsx`) são coesos e não justificam divisão agora (seção J).

### Itens menores observados (sem ação recomendada agora)

| Item | Detalhe |
| --- | --- |
| Custo da posição no placar | `server/boards.ts:28-59` conta a tabela inteira a cada `standing`: 60–68 ms medidos com 200.000 linhas num placar, dentro da transação do envio. Só importa em escala. |
| Corrida na liquidação da missão | Um resultado aceito às 00:59:59,9 que comita depois da liquidação fica sem colocação final (`runs.ts:131`, `missions.ts:225-250`). Janela de menos de 1 s, uma vez por dia. |
| `player_achievements.run_id` sem FK | Aponta para runs apagados depois de 90 dias. Nada visível quebra. |
| `import "server-only"` | Ausente em `src/server/*`. Seria uma proteção barata contra importação acidental no cliente. |
| Cabeçalhos de segurança | Não há CSP nem `frame-ancestors`. O clickjacking das ações já é mitigado por `SameSite=Lax` e checagem de `Origin`. `frame-ancestors 'none'` seria barato. |
| Semente do ticket | `tickets.ts:28` emite uma semente que nenhum juiz lê. Isso fica entre documentação e uso futuro. |
| `npm audit --omit=dev` | 3 "high", todos o mesmo ReDoS de `effect` dentro do CLI do Prisma (`@prisma/config`). Não é alcançável em runtime. Não rebaixar o Prisma; esperar uma versão nova. |
| Envio em `pagehide` | Um resultado retido só entra na fila depois de `await ticket`, e um envio em curso no fechamento da aba não usa `keepalive` (`GameShell.tsx:499-511`). |
| Resposta do outbox | Resultados enviados pela fila descartam a resposta, então uma missão concluída ao reconectar não mostra toast (`client.ts:195-201`). |
| Missão de ontem | O dia vira por um único `setTimeout` (`missions/hooks.ts:19-24`), sem refetch quando a aba volta a ficar visível. |
| `highScore` duplicado | `GameShell.tsx:161,285,375,384` duplica o que a loja já tem. |
| Catálogo e introdução divergem | O estado "aventura salva" do catálogo olha a chave crua (`useSchedule.ts:14-22`), e a introdução usa `loadState` (`games/resume.ts:4`). |
| Tempo de mira da Rua | `timeMs` da Rua Sem Saída conta tempo de mira parada (`PlayScene.ts:1669`). Um nível deixado aberto por mais de 1 h sem pausar é recusado com `bad_stats` (`rules.ts:139`). |

### Medições

**Verificações executadas em `c9a3ec7`:**

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Passou (6,6 s) |
| `npm run lint` | Passou (11 s) |
| `npm test` | 135 passaram, 43 pulados sem banco (3,6 s) |
| Testes de banco (`vitest --project server`, banco `canal404_audit_test`) | 51 de 51 passaram (3,4 s) |
| `npm run build` | Passou (15 s) |
| E2e | Não rodado localmente. O CI rodou neste commit (execução 45244346181): 18 e2e e 178 + 20 unitários e de banco, tudo verde, e2e em 6,7 min. |
| Histórico do CI em `main` | 37 sucessos, 1 falha (F24), 20 cancelados nas últimas 58 execuções. |

**JavaScript por página**, para um visitante que volta, no Chrome a 1440×900, com `next start`:

| Página | Commit da 0010 (`4677df0`), mesmo Next 16.4.6 | Agora (`c9a3ec7`) | Variação |
| --- | --- | --- | --- |
| Sobre | 565 / 174 KB | 569 / 176 KB | +1% |
| Extras | 644 / 202 | 668 / 210 | +4% |
| Recordes | 700 / 223 | 751 / 239 | +7% |
| Personagens | 793 / 252 | 864 / 274 | +9% |
| Missão | 860 / 274 | 914 / 292 | +6% |
| Página de um jogo | 839 / 266 | 905 / 286 | +8% |
| Sala | 961 / 302 | 1.040 / 325 | +8% |
| Catálogo | 987 / 303 | 1.085 / 334 | +10% |

Os valores são bruto / transferido, contando todo script baixado até a rede ficar ociosa mais 2 s. O commit da 0010 reproduz a tabela da própria decisão com diferença de 0,5%. O crescimento acompanha a passagem de 6 para 9 jogos (registry, capas e logos) e não é uma regressão.

O primeiro acesso de um visitante novo baixa também o `motion` (~124 KB bruto), porque o toast de "primeira visita" carrega o `ToastList` sob demanda. Isso é o comportamento descrito na 0010.

**Carregamento de cada jogo** (build de produção local, sem limitar CPU nem rede):
- até a introdução: 1,0 a 1,1 s na maioria dos jogos, 1,55 s no Férias e 1,68 s na Madrugada, que carregam mais arte;
- script total da página de jogo: 2,46–2,67 MB bruto, ou 710–780 KB transferidos;
- o chunk do Phaser (1,16 MB bruto) é compartilhado e fica em cache entre os jogos.

**Memória**, em 5 ciclos de abrir o jogo, começar, jogar 2,5 s e voltar, com GC forçado via CDP:

| Cenário | Heap usado (MB) | Listeners em `document` | Canvases depois de sair |
| --- | --- | --- | --- |
| Navegação só no portal (controle) | 6,6 → 7,2 | n/d | n/d |
| Abrir a página de jogo sem começar (Lanche) | 10,6 → 12,6 | n/d | n/d |
| Rua / Laboratório / Ladeira | +0,2–0,25 por ciclo | 145 → 149 | 0 |
| Lanche / Recreio / Pijama / Férias / Ao Vivo | +0,5–0,6 por ciclo | 145 → 149 (Ao Vivo 145 → 150) | 0 |

Os listeners em `window` ficaram estáveis em 17 em todos os casos.

**Congelamento por exceção (F03):** reproduzido conforme descrito em F03.

---

## E. Oportunidades de refatoração

| Oportunidade | O que se ganha concretamente | Custo e risco | Recomendação |
| --- | --- | --- | --- |
| Helpers de pontuação únicos (F08) | Uma rodada de polimento não consegue mais quebrar o placar de um jogo em silêncio | Baixo; os valores não mudam | Fazer (Etapa 2) |
| Contrato de erro jogo→shell (F03, F07) | Fim da tela congelada e do carregamento infinito; um lugar só para tratar falhas | Médio: toca `types.ts`, o shell e os 9 `BootScene`, mas o campo opcional não quebra nenhum jogo | Fazer (Etapa 1) |
| `watchFrame`, `onKey` e helpers de Phaser no kit (F13, F16, F22) | Limpeza e entrada iguais nos 9 jogos; correções feitas uma vez | Médio: mexe em todos os jogos; migrar um por PR | Fazer depois das Etapas 1 e 4, aos poucos |
| `mutate(fn)` na loja de progresso (F05) | Fim da sobrescrita entre abas | Baixo; poucos KB de parse por gravação | Fazer (Etapa 3) |
| Separar `WorldScene.ts` do Férias (F27) | Conteúdo novo da história sem casts nem estado em string | Médio; exige jogar a aventura inteira para validar | Opcional, quando houver conteúdo novo |
| Remover código morto (F26) | Menos superfície; o modo dust/kick deixa de ser uma armadilha para o replay | Baixo | Fazer junto de outras mudanças nos mesmos arquivos |
| Extrair hooks do `BroadcastRoom.tsx` (fita, canais) | Leitura mais fácil | Médio, e o arquivo é coeso | Não agora (seção J) |

---

## F. Riscos de regressão

- **`GameShell.tsx` e `Panels.tsx`:** toda mudança chega aos 9 jogos. São os arquivos com mais commits de correção. Depois de qualquer mudança:
  - `e2e/games.spec.ts` (abrir, começar, pausar, continuar nos 9 jogos);
  - `e2e/mobile.spec.ts`;
  - jogar no celular os três jogos com layout em pé (Lanche, Ao Vivo, Madrugada).
- **`src/games/types.ts`:** um campo novo precisa ser opcional, para que cada jogo adote no seu ritmo.
- **Simulações e regras:** qualquer mudança que altere trajetória, temporizador, constante, ordem de corpos ou gráfico de música exige uma nova versão da regra e de placar (0005, 0009, 0011–0014). As correções F02, F10, F12, F13 e F14 não mudam a simulação. F08 e F11 só mudam de onde vem um número, e o valor é o mesmo.
- **Saves:** F01 (Férias) e F05 (`rev` no Férias) mudam o formato do save. Pela 0001, isso pede subir a versão, uma migração, um teste com payload antigo e a compatibilidade com a cópia na nuvem (`Snapshot.version`, 0015).
- **Registry:** é o arquivo mais tocado (46 commits). Mudanças em paralelo nele geram conflito de merge.
- **Kit:** um helper novo do kit migrado em todos os jogos de uma vez espalha o risco. Migrar um jogo por PR.
- **Servidor:** F19 e F20 mudam o que o servidor aceita. Clientes antigos abertos (abas velhas) podem mandar campos que passam a ser recusados. O código `outdated` (`server/http.ts`) já avisa para recarregar.

---

## G. Lacunas de testes

A estratégia da [0007](../decisions/0007-essential-tests-only.md) está certa para o projeto e deve continuar. As lacunas abaixo caem nas três categorias que ela protege:

1. **Saves do jogador:**
   - envio da fila de resultados concorrente com um enfileiramento (F04), em `client.test.ts`;
   - alteração com o storage mudado por outra aba e `clear` (F05), em `store.test.ts`;
   - save do Férias com `ended` e sem `reported`, e a migração nova (F01), em `off-air-vacation/save.test.ts`;
   - restauração da cópia com cota cheia (F17), em `migrate.test.ts` ou num teste de `snapshot`.
2. **Integridade de placar e missões:**
   - `rules.test.ts` usando os helpers de pontuação compartilhados em vez de cópias (F08);
   - um teste curto comparando os níveis do registry e das regras (F11);
   - replay de tipo errado recusado (F20), em `api.test.ts` ou `runs.test.ts`.
3. **Smoke e2e:**
   - nenhum teste novo é necessário;
   - corrigir `e2e/scoreboard.spec.ts:84` para não fixar texto (F24);
   - o estado de erro do shell (F03) deve ser verificado à mão com injeção de falha, como nesta auditoria, e não virar um e2e permanente.

Fora do escopo de testes automatizados, pela 0007, ficam:
- girar o celular no Ao Vivo (F02);
- reiniciar o Recreio (F06);
- pausar com nota longa (F12);
- foco dos painéis (F09).

Estes se verificam jogando, ou com bots descartáveis no scratchpad.

---

## J. O que não vale a pena refatorar

- **Phaser 4 ou um matter-js novo:** a versão do matter está fixada na embutida no Phaser 3.90 para manter os replays bit a bit (0005). Atualizar exigiria novos placares para cinco jogos, sem ganho para o jogador.
- **Dividir cenas grandes pelo número de linhas:** `RaceScene.ts`, `LabScene.ts`, `NightScene.ts`, `StageScene.ts` e `PlayScene.ts` são grandes mas coesos. A lógica já está fora deles, nos `sim/`, `nav.ts`, `brain.ts` e `narration.ts`. A exceção é o Férias (F27).
- **`BroadcastRoom.tsx`:** 1.548 linhas, mas é um único orquestrador da sala. As re-renderizações por movimento do ponteiro já foram tratadas (0010, `lookStore`). Extrair hooks só se a sala ganhar funções novas.
- **Biblioteca de estado (Redux, Zustand):** as lojas com `useSyncExternalStore` são simples, estáveis e sem tearing.
- **Unificar HUDs, painéis dentro do canvas ou layouts dos jogos:** cada jogo tem mecânica e direção de arte próprias. Um componente universal aumentaria o acoplamento.
- **Dividir o `registry.ts` por jogo:** reduziria conflitos de merge, mas a tabela tipada bilíngue em um lugar só é o que garante a 0008. Fica como opcional se os conflitos começarem a custar caro.
- **Replay para os jogos "checked" (Lanche, Recreio, Pijama, Férias):** é muito trabalho (temporizadores em passos, aleatoriedade com semente, log de entradas por jogo) para placares de diversão. Está documentado como risco aceito (0004).
- **Cache de totais de placar ou rate limit em Redis:** 60 ms com 200.000 linhas e janelas fixas no Postgres dão conta da escala atual.
- **CSP estrita:** o Phaser, os scripts inline do Next e o Umami tornam isso caro. Basta `frame-ancestors`.
- **Voltar a ter orçamento de JavaScript no CI:** a 0007 removeu de propósito, e a medição mostra crescimento proporcional (+1% a +10%). Medir à mão quando entrar um jogo novo é suficiente.

---

## Metodologia

1. Leitura de README, ROADMAP, CHANGELOG, `docs/backend-setup.md` e das 15 decisões.
2. Mapa de imports entre módulos.
3. Seis revisões paralelas de leitura: três de jogos, servidor, saves e estado, UI e i18n. Cada achado relevante foi conferido de novo no código antes de entrar aqui.
4. Medições com Playwright e CDP contra `next start`.
5. Reprodução com scripts descartáveis, sem nada gravado no repositório, e com o banco local `canal404_audit_test`.

Conclusões sobre o Phaser foram conferidas no código-fonte em `node_modules/phaser/src` (3.90.0).

Para repetir as medições de página, rode `next start` em um build de produção. Abra cada página num contexto novo do Chrome com o progresso de um visitante que volta já gravado em `localStorage` (`achievements: { "first-visit": 1 }`). Some os bytes de todos os recursos do tipo `script` até `networkidle` mais 2 s.
