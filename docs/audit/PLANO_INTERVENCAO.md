# Plano de intervenção do Canal 404

**Data:** 2026-11-23
**Base:** `origin/main` em `c9a3ec7`
**Diagnóstico:** [AUDITORIA_TECNICA.md](AUDITORIA_TECNICA.md). Os ids `F01`–`F27` deste plano são os de lá, e cada achado tem lá os arquivos, as linhas, a evidência e a solução detalhada.

**Andamento:**
- Etapa 0 concluída em 2026-11-24: PRs #132 (F01), #133 (F02) e #134 (F04), já no `main`.
- Etapa 1 concluída em 2026-11-24: PR #136 (F03, F07, F10).
- Etapa 2 concluída em 2026-11-24: PR #137 (F08, F11, F20 parte 1).
- Etapa 3 concluída em 2026-11-24: PR #138 (F05, F17).
- Etapa 4 (F06, F12, F13, F14, F15, F16) na branch `fix/game-lifecycle`.
- Próxima: Etapa 5.

Este plano foi escrito para que outra sessão execute uma etapa sem refazer a investigação:

- cada PR lista onde mexer, o que mudar, como testar e quando está pronto;
- antes de começar, confira se as linhas citadas ainda batem com `main`, porque o projeto muda rápido.

## Regras que valem para todas as etapas

- **Uma branch e um PR pequeno por item.** Os prefixos são os de sempre: `fix/`, `polish/`, `chore/`, `refactor/`.
- **Siga o `CLAUDE.md`:**
  - testes só nas áreas da [0007](../decisions/0007-essential-tests-only.md): saves, placar e missões, segurança da API, replays e um smoke por fluxo;
  - todo texto visível em pt-BR e inglês com `localized`;
  - links por `@/i18n/Link`.
  - O código do projeto não tem comentários; mantenha assim.
- **Nada que mude trajetória, temporizador, constante, gráfico de música ou regra de pontuação** sem uma versão nova de regra e de placar (0005, 0009, 0011–0014). Nenhuma correção deste plano precisa disso. Se uma precisar, pare e trate como decisão.
- **Mudança de formato de save:** pela [0001](../decisions/0001-save-versioning.md), suba a versão, adicione a migração, estenda o teste do save com um payload antigo e confira a cópia na nuvem ([0015](../decisions/0015-recovery-code-and-cloud-copy.md)).
- **Mudança no shell** (`GameShell.tsx`, `Panels.tsx`, `src/games/types.ts`) chega aos 9 jogos:
  - campos novos do contrato sempre opcionais;
  - rode `npm run test:e2e`;
  - abra pelo menos um jogo de cada formato no celular: em pé (Lanche), deitado (Rua) e com layout próprio de telefone (Ao Vivo).
- **Antes de abrir o PR:** `npm run typecheck`, `npm run lint` e `npm test`. Se tocar o servidor, também `npm run test:db`.

## Visão geral

| Etapa | Objetivo | Achados | Prioridade | Esforço | Depende de | Paralelizável |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Jogador não perde resultado nem fica preso | F01, F02, F04 | P1–P2 | ~1 dia | — | Os 3 PRs entre si |
| 1 | Falhas dentro do jogo chegam ao shell | F03, F07, F10 | P2 | 1–2 dias | PR 0.1 antes do 1.3 (mesmo arquivo) | Com 2, 3.1, 5, 6 |
| 2 | Uma fonte só para pontuação e níveis | F08, F11, F20 (parte do replay) | P2 | ~1 dia | — | Com 1, 3, 5, 6 |
| 3 | Progresso seguro entre abas e na cópia | F05, F17 | P2–P3 | 1–2 dias | PR 0.1 antes do 3.2 | 3.1 e 3.3 com tudo |
| 4 | Correções pontuais nos jogos | F06, F12, F13, F14, F15, F16 | P2–P3 | 1–2 dias | — | Um PR por jogo, em paralelo |
| 5 | Acessibilidade e detalhes do portal | F09, F25 | P2–P3 | ~1 dia | — | Com tudo, menos PRs que mexam em `Panels.tsx` |
| 6 | Servidor: logs, abuso e dados aceitos | F18, F19, F20, F21 | P3 | ~1 dia | — | Com tudo |
| 7 | Infraestrutura comum dos jogos no kit | F13, F16, F22, F23 | P3 | 2–3 dias, aos poucos | 1 e 4 | Um jogo por PR |
| 8 | Limpeza, CI e documentação | F24, F26, F27 (opcional) | P3 | 0,5–1 dia (F27: 1–2 dias) | — | Com tudo |

### Ordem e dependências

```
Etapa 0 ──► (0.1 Férias) ──► 1.3 (save ao sair do Férias) ──► 3.2 (rev no save do Férias)
  │                         └──► 2.1 (parte do Férias, mesmo WorldScene.ts)
  ├─ 0.2, 0.3: sem dependências
Etapa 1 (1.1 shell, 1.2 contrato onError) ──┐
Etapa 4 (correções por jogo) ───────────────┴──► Etapa 7 (kit compartilhado)
Etapas 2, 3.1, 3.3, 5, 6, 8: independentes; podem rodar a qualquer momento
```

**Arquivos disputados** (não rodar em paralelo PRs que tocam o mesmo arquivo):
- `off-air-vacation/scenes/WorldScene.ts`: PRs 0.1, 1.3, 2.1 e 3.2;
- `game-shell/Panels.tsx`: PRs 5.1 e 5.3;
- `GameShell.tsx`: PRs 1.1 e 1.2;
- `talent-show/index.ts` e `StageScene.ts`: PRs 0.2 e 4.2.

---

## Etapa 0: Correções críticas e estabilização

**Objetivo:** fechar os dois caminhos em que o jogador perde o resultado ou fica preso, e o bug da fila de resultados, que é trivial.

### PR 0.1: Férias não perde o final (F01)

- **Arquivos:**
  - `src/games/off-air-vacation/story.ts` (script `console`, `:899-905`);
  - `scenes/WorldScene.ts` (`finish()` em `:1394`, `create()`);
  - `save.ts` e `save.test.ts`.
- **Mudanças:**
  1. Atribuir `ending` antes de `set("ended")`.
  2. Marcar `flags.reported = true` em `finish()`, logo depois de emitir o `finished`.
  3. No `create()` em modo jogo, se `ended && !reported`, levar direto à festa ou emitir o resultado.
  4. Subir a versão do save com uma migração em que um save antigo com `ended` ganha `reported = true` quando o registro do portal do Férias já tem pontuação. Isso evita rever a festa em saves que já mandaram o resultado.
- **Como foi feito** (branch `fix/vacation-ending-report`):
  - a flag ficou `resultPending`, gravada `true` junto com `ended` e `false` em `finish()`;
  - não houve subida de versão, porque `flags` já aceita qualquer booleano;
  - um save antigo é reconhecido pela ausência da flag e só volta à festa se `ctx.highScore` for 0;
  - a decisão fica em `endingUnreported()` (`save.ts`), e `resume()` em `index.ts` abre a festa.
- **Riscos:**
  - rever a festa num save já reportado;
  - a migração errar e tratar como não reportado.

  O teste do save cobre os dois.
- **Testes:** estender `off-air-vacation/save.test.ts`:
  - payload antigo terminado;
  - payload `ended` sem `reported`;
  - migração.
- **Critérios de aceitação:**
  - Jogar até a escolha final e recarregar durante a festa: ao reabrir, o resultado aparece uma vez, o recorde local e a conquista `offair-mystery` são registrados, e o placar recebe a partida (se configurado).
  - Um save terminado antes da mudança abre normalmente, sem rever a festa.
  - `npm test` verde.
- **Esforço:** S–M.

### PR 0.2: Ao Vivo no 404 volta ao cartão depois de reconstruir (F02)

- **Arquivos:** `src/games/talent-show/index.ts:86-94` e `scenes/StageScene.ts:251`.
- **Mudança:** chamar `bridge.onReady()` depois do `create()`, com `this.events.once(Phaser.Scenes.Events.CREATE, …)` ou `setTimeout(…, 0)`. Alternativa: `onReady(scene)` usando a cena recebida em vez de `scene()`.
- **Como foi feito** (branch `fix/talent-show-rebuild-card`): `this.events.once(Phaser.Scenes.Events.CREATE, () => this.bridge.onReady())` em `StageScene.ts`. Reproduzido antes e verificado depois redimensionando de 1280×800 para 390×844 com o cartão aberto.
- **Riscos:** nenhum conhecido. O primeiro carregamento usa o mesmo caminho.
- **Testes:** nenhum novo (0007). Rodar `e2e/games.spec.ts`.
- **Critérios de aceitação:**
  - Com o cartão de uma música aberto, girar o celular (ou redimensionar a janela do desktop cruzando o breakpoint do layout): o cartão reaparece e tocar começa a música.
  - Também depois de girar durante uma música e apertar "próxima música" no resultado.
- **Esforço:** XS.

### PR 0.3: A fila de resultados não apaga o que entra durante o envio (F04)

- **Arquivos:** `src/lib/competition/client.ts:187-208`, e o teste em `client.test.ts`.
- **Mudança:**
  1. Ao fim de `flushOutbox`, reler a fila.
  2. Remover só os tickets que este envio resolveu (enviados ou recusados em definitivo).
  3. Manter os `network` e `not-joined` que ainda estiverem lá.
- **Riscos:** reenviar um ticket já aceito é inofensivo (idempotente no servidor por `runs.ticket_id`).
- **Como foi feito** (branch `fix/outbox-keeps-queued`): o envio guarda os tickets resolvidos num `Set`, relê a fila no fim e remove só esses. O teste novo em `client.test.ts` falhava antes da correção.
- **Testes:** em `client.test.ts`, com um item com envio lento e outro enfileirado no meio, os dois sobrevivem; depois do sucesso, só o resolvido sai.
- **Critérios de aceitação:** o teste passa e `npm test` fica verde.
- **Esforço:** XS.

**Resultado esperado da etapa:** nenhum caminho conhecido de perda de resultado da aventura nem de travamento no Ao Vivo, e a fila de resultados confiável em rede instável.

---

## Etapa 1: Contrato de falhas entre jogo e shell

**Objetivo:** que nenhuma falha de execução ou de carregamento deixe o jogador diante de uma tela congelada ou de um carregamento infinito.

### PR 1.1: O shell percebe um jogo quebrado (F03)

- **Arquivos:** `src/components/game-shell/GameShell.tsx` e `Panels.tsx` (`ErrorPanel` já existe).
- **Mudanças:**
  1. Com a etapa em `intro`, `playing` ou `paused`, escutar `error` e `unhandledrejection` em `window`.
  2. Filtrar erros do mesmo domínio (`event.filename` começando com `location.origin`).
  3. Ao receber um erro, `instance.destroy()`, ir para a etapa `error` e mostrar "Recarregar o jogo", que reaproveita `setAttempt`.
  4. Não tentar continuar o jogo quebrado.
  5. A telemetria continua no `AppProviders`.
- **Riscos:**
  - falso positivo por erros de extensões, mitigado pelo filtro de origem;
  - um erro inofensivo e recuperável passa a interromper a partida, o que é aceitável porque hoje ele já congela o jogo.
- **Testes:** nenhum e2e permanente (0007). Verificar à mão com o método da auditoria: injetar um erro único numa chamada WebGL de desenho (`WebGLRenderingContext.prototype.drawElements`) durante a partida.
- **Critérios de aceitação:**
  - Com o erro injetado, em menos de 1 s aparece o painel de erro.
  - "Recarregar o jogo" volta à introdução com o jogo funcionando.
  - Os e2e continuam verdes, sem painel de erro espúrio.
- **Esforço:** S.
- **Como foi feito** (branch `fix/game-fault-panel`, junto com 1.2 e 1.3):
  - o shell escuta `error` em `window` nas etapas carregando, introdução, jogando e pausado; ignora `Script error.` e erros de extensões;
  - ao falhar, destrói a instância e esvazia o elemento do jogo (`hostRef.current.replaceChildren()`), porque com o laço do Phaser morto o `destroy()` nunca termina e o canvas antigo ficava na página;
  - o painel passou a se chamar "Erro no jogo".

### PR 1.2: Falhas de carregamento chegam ao shell (F07)

- **Arquivos:**
  - `src/games/types.ts` (`GameHostContext.onError?`);
  - `GameShell.tsx`;
  - `src/games/kit/` (um helper novo, por exemplo `loadFailures(scene, ctx)`);
  - os 9 `BootScene` (o Ao Vivo e a Madrugada carregam na cena principal, `StageScene.ts:204` e `NightScene.ts:128`);
  - `off-air-vacation/index.ts:11-18` e `scenes/BootScene.ts:140-147`.
- **Mudanças:**
  1. `onError` opcional no contexto, ligado ao `ErrorPanel`.
  2. O helper registra `loaderror`, tenta de novo uma vez os arquivos que falharam e, se ainda faltar algum, chama `ctx.onError`.
  3. No Férias, um `catch` no carregamento do texto que chame `ctx.onError`.
  4. Para evitar um PR enorme, adotar em 2 ou 3 PRs, com 3 ou 4 jogos cada.
- **Riscos:** um arquivo que falhe passa a bloquear o jogo. A nova tentativa reduz isso, e um placeholder era pior para o jogador.
- **Testes:** nenhum novo. Verificar à mão com o Playwright ou o DevTools bloqueando um SVG do jogo (`page.route("**/assets/<slug>/x.svg", r => r.abort())`), e no Férias o chunk de texto.
- **Critérios de aceitação:**
  - Com um arquivo bloqueado, aparece o painel de erro e o "Tentar de novo" funciona quando o bloqueio sai.
  - Sem bloqueio, os 9 jogos carregam como antes (`e2e/games.spec.ts`).
- **Esforço:** S–M.
- **Como foi feito:**
  - `onError` passou a ser obrigatório no contexto, porque quem o fornece é só o shell;
  - o Phaser 3.90 já tenta de novo duas vezes cada arquivo (`loader.maxRetries`), então o helper `reportFailedLoads` (`src/games/kit/load.ts`) só avisa quem ainda falhou no `COMPLETE`;
  - o helper é usado nos 10 pontos de carregamento dos 9 jogos, inclusive o `RaceScene` da Ladeira;
  - foi tudo num PR só, porque cada jogo ganhou uma linha.

### PR 1.3: Salvar e liberar ao sair da página (F10)

- **Arquivos:**
  - `src/games/off-air-vacation/index.ts` (`destroy()` e `pause()`) e `scenes/WorldScene.ts:262`;
  - `src/games/talent-show/index.ts` (`reshape`, descartar o player antes de `game.destroy`) e `scenes/StageScene.ts:252`.
- **Mudanças:**
  - No Férias, salvar em `pause()` e em `destroy()` do `GameInstance`, ou escutar `DESTROY` junto com `SHUTDOWN`.
  - No Ao Vivo, descartar o player antes de destruir o jogo.
- **Riscos:** salvar no destroy com o estado no meio de uma cena de diálogo. O Férias já salva fora de diálogo; mantenha a mesma guarda.
- **Testes:** os do save do Férias continuam passando; nenhum novo.
- **Critérios de aceitação:**
  - Andar no Férias, voltar ao portal em menos de 8 s e reabrir: a posição e o tempo de jogo estão como na saída.
  - No Ao Vivo, uma reconstrução depois da tela de resultado não deixa nós de áudio conectados (conferir no `chrome://media-internals` ou contando nós no motor de áudio).
- **Esforço:** XS–S.
- **Depende de:** PR 0.1 (mesmo `WorldScene.ts`).
- **Como foi feito:**
  - `WorldScene.persist()` é chamado em `pause()` e `destroy()` do `GameInstance`;
  - o Ao Vivo chama `scene()?.quit()` antes de `game.destroy(true)` no `reshape()`;
  - no `main`, andar 1,5 s e sair perdia a posição; agora ela fica.

**Resultado esperado da etapa:** toda falha conhecida dentro de um jogo vira um painel com saída, e nenhum dado se perde ao sair da página.

---

## Etapa 2: Uma fonte só para pontuação e níveis

**Objetivo:** que uma rodada de polimento num jogo não possa quebrar o placar daquele jogo em silêncio.

### PR 2.1: Helpers de pontuação compartilhados (F08)

- **Arquivos:**
  - `src/games/bad-ideas-lab/levels.ts` (`labScore`), `scenes/LabScene.ts:1974-1982`;
  - `src/games/food-fight/config.ts` (`SCORE.bigHurt`), `scenes/LunchScene.ts:1040,1042`;
  - `src/games/off-air-vacation/config.ts` (`resortResult`), `scenes/WorldScene.ts:832,1404`;
  - `src/lib/competition/rules.ts:207-208,219,264,289,439-440`;
  - `src/lib/competition/rules.test.ts:66`.
- **Mudança:** cada fórmula passa a existir num lugar só e é importada pelo jogo, pelo juiz e pelo teste.
- **Riscos:** nenhum valor pode mudar, porque se mudasse o placar exigiria uma versão nova. Compare antes e depois com o `rules.test.ts`.
- **Testes:** `rules.test.ts` passa a usar os helpers. As provas reais do `catalog.test.ts` continuam aceitas.
- **Critérios de aceitação:**
  - nenhum literal `1000 + … * 150`, `50` ou limiar de estrela do Férias duplicado em `rules.ts`;
  - `npm test` verde;
  - as versões das regras inalteradas.
- **Esforço:** S.
- **Depende de:** PR 0.1, por causa do `WorldScene.ts` do Férias. Se preferir, separe a parte do Férias num PR seguinte.
- **Como foi feito** (branch `fix/single-score-source`, junto com 2.2 e 2.3):
  - `LAB_SCORE` e `labScore` (com `starsFor`) em `bad-ideas-lab/levels.ts`;
  - `SCORE.bigHurt` em `food-fight/config.ts`;
  - `resortResult` em `off-air-vacation/config.ts`;
  - o jogo, o juiz, `rules.test.ts` e `src/server/testing.ts` usam esses mesmos helpers, sem cópia da conta.

### PR 2.2: Níveis do registry conferidos com as regras (F11)

- **Arquivos:**
  - um teste novo e curto em `src/lib/competition/` (ou no fim de `rules.test.ts`);
  - `rules.ts:450`, para importar os ids de pista da Ladeira.
- **Mudança:** para cada jogo, `GAMES[].levels?.map(l => l.id)` tem de ser igual a `RULES[slug].levels`.
- **Riscos:** nenhum.
- **Testes:** o próprio. Ele está na categoria 2 da 0007, porque evita que partidas honestas sejam recusadas em silêncio.
- **Critérios de aceitação:**
  - o teste passa hoje;
  - renomear um id só no registry, num teste local que não vai para o commit, faz o teste falhar.
- **Esforço:** XS.
- **Como foi feito:**
  - o teste "knows every level the catalog asks tickets for" em `rules.test.ts` compara os jogos jogáveis do registry com as regras;
  - a regra da Ladeira importa `RACE_COURSES`;
  - trocar "antena" por "antenna" só no registry faz o teste falhar.

### PR 2.3: O servidor aceita só o replay que o jogo espera (F20, parte 1)

- **Arquivos:** `src/server/schemas.ts:111`, `src/server/runs.ts:97,149` e `src/app/api/api.test.ts` (ou `runs.test.ts`).
- **Mudança:** depois do zod, recusar com `bad_request` (ou descartar o campo) um `replay` cujo `kind` não seja o da regra do jogo, e recusar replay em jogos "checked".
- **Riscos:** um cliente antigo aberto que mande um replay desnecessário. Hoje nenhum cliente faz isso (verificado: só os jogos replayados enviam).
- **Testes:** em `api.test.ts`, um replay do Ao Vivo numa partida do Férias é recusado.
- **Critérios de aceitação:** `npm run test:db` verde e o e2e de placar verde.
- **Esforço:** S.
- **Como foi feito:**
  - cada regra declara o `replay` que usa (`null` nos jogos "checked");
  - `keptReplay()` guarda só esse tipo e descarta o resto, sem recusar a partida, para não punir um cliente com um campo a mais;
  - o teste fica em `src/server/runs.test.ts`.

**Resultado esperado da etapa:** divergência entre jogo e juiz passa a ser impossível nas fórmulas e detectável nos ids.

---

## Etapa 3: Estado, persistência e cópia na nuvem

**Objetivo:** que nenhuma combinação de abas, recarregamentos ou falta de rede apague progresso ou ressuscite progresso apagado.

### PR 3.1: A loja de progresso relê antes de gravar (F05, portal)

- **Arquivos:** `src/lib/progress/store.ts:172-198` e todos os mutadores (`:244-377`); o teste em `store.test.ts`.
- **Mudanças:**
  1. Um `mutate(fn)` que lê o storage (`readStorage()`), aplica `fn` e grava.
  2. Todos os mutadores passam a usá-lo.
  3. Tratar o `storage` com `key === null` relendo.
  4. Reler em `pageshow` com `persisted`.
- **Riscos:** custo de parse a cada gravação (poucos KB, gravações raras), e nenhum de comportamento.
- **Testes:** em `store.test.ts`:
  - outra "aba" grava uma fase e a mutação local preserva as duas;
  - depois de um `clear`, a próxima gravação não ressuscita o save.
- **Critérios de aceitação:** os testes passam e `npm test` fica verde.
- **Esforço:** S.
- **Como foi feito** (branch `fix/multi-tab-saves`, junto com 3.2 e 3.3):
  - a loja guarda o último texto que viu (`seen`), e antes de cada alteração (`fresh()`) relê o save se o texto guardado mudou;
  - o evento `storage` com `key === null` e o `pageshow` restaurado do bfcache também provocam a releitura;
  - comparar o texto evita reprocessar o save a cada clique.

### PR 3.2: O Férias não sobrescreve a aba mais nova (F05, Férias)

- **Arquivos:** `src/games/off-air-vacation/save.ts:96-101`, `scenes/WorldScene.ts:527-537,1599-1602` e `save.test.ts`.
- **Mudanças:**
  1. Um contador `rev` no save, com versão nova e migração (campo ausente vira 0).
  2. Antes de gravar, se o `rev` guardado for maior que o da aba, não gravar e avisar ("Este jogo foi aberto em outra aba"), ou recarregar o estado.
  3. Filtrar também `found` pelos ids conhecidos, como a 0001 pede (F26).
- **Riscos:** um falso "outra aba" se a mesma aba recarregar. Gere o `rev` a partir do valor lido no boot.
- **Testes:** em `save.test.ts`, o payload antigo sem `rev` e a migração.
- **Critérios de aceitação:** com duas abas do Férias, a aba de trás não apaga cartazes pegos na da frente.
- **Esforço:** S.
- **Depende de:** PR 0.1. Se os dois forem feitos perto um do outro, junte as mudanças de formato numa única subida de versão.
- **Como foi feito:**
  - o save ganhou `id` (sorteado por `newAdventureId()` a cada aventura nova) e `rev`, sem subir a versão, porque campos ausentes viram `""` e `0` na normalização, como o teste "fills fields added after the save was made" já previa;
  - `saveState` recusa gravar quando o save guardado é de outra aventura, tem `rev` maior ou foi apagado enquanto esta aba tinha `rev > 0`;
  - a aba recusada mostra "Aventura aberta em outra aba" uma vez e anuncia o aviso;
  - o filtro de `found` (item 3) ficou para a Etapa 8.

### PR 3.3: Cópia na nuvem coerente (F17)

- **Arquivos:**
  - `src/components/extras/ExtrasHub.tsx:330-331`;
  - `src/lib/progress/store.ts:159-171`;
  - `src/lib/competition/cloud-copy.ts:58,86-96`;
  - `src/lib/progress/snapshot.ts:39-52`;
  - `src/lib/progress/migrate.ts:64-74`.
- **Mudanças:**
  1. Não remover `canal404:sync:v1` ao apagar o progresso (é só do aparelho), ou repetir o envio forçado no próximo `connect`.
  2. `backupRaw` retorna sucesso, e a restauração para antes de remover se um backup falhar.
  3. Checar `SNAPSHOT_MAX_KEYS` no cliente e chamar `reportError` quando a cópia não puder ser enviada.
  4. Definir "tem progresso" por uma lista de chaves que contam, ignorando flags de tutorial e assistência.
- **Riscos:** mudar o que conta como progresso afeta a oferta de restauração. Siga o texto da 0015.
- **Testes:** os casos de saves e da cópia em `migrate.test.ts` e `store.test.ts`, e no teste da API se o servidor mudar.
- **Critérios de aceitação:**
  - apagar com o placar fora do ar e reconectar apaga a cópia;
  - restaurar com a cota cheia mantém os saves locais;
  - um navegador só com flags recebe a cópia sem perguntar.
- **Esforço:** S (cada item é XS).
- **Como foi feito:**
  - o reset mantém `canal404:sync:v1`;
  - `applySnapshot` faz todos os backups antes de remover qualquer coisa, e lança erro se um falhar (o Extras já mostra a falha);
  - `upload` chama `reportError` para cópia grande demais e para recusas 4xx;
  - `hasProgress` ignora as chaves que só guardam flags (`FLAG_KEYS` em `snapshot.ts`).

**Resultado esperado da etapa:** o progresso local é a fonte única e coerente, e a cópia cumpre o que o Extras promete.

---

## Etapa 4: Correções pontuais nos jogos

**Objetivo:** corrigir os comportamentos errados confirmados em jogos específicos, sem mexer em regras nem em simulações. Faça um PR por jogo; os PRs podem andar em paralelo.

### PR 4.1: Recreio, "Recomeçar partida" recomeça (F06)

- **Arquivos:**
  - `src/games/operation-recess/index.ts:53-58,84-86`;
  - `scenes/StageScene.ts:221-231,733-734`;
  - o rótulo da ação de resultado (`restartLabel`) e, se usar `alt`, `GameShell.tsx:707`.
- **Mudança:**
  - `restart()` do `GameInstance` limpa o checkpoint e recomeça do início;
  - "Voltar ao sino" fica só como ação do resultado.
- **Critérios de aceitação:**
  - depois de um sino, o botão do cabeçalho e o da pausa recomeçam a fase do início, com `resumed=0` e batidas em 0;
  - no resultado de um nocaute, "Voltar ao sino" continua funcionando;
  - em missão nada muda.
- **Esforço:** S.
- **Como foi feito** (branch `fix/game-lifecycle`, com os PRs 4.2 a 4.5):
  - `restart()` volta ao sino só quando a cena está em nocaute (`knockedOut`, ou seja, a tela de resultado); no meio da partida, limpa o checkpoint e recomeça;
  - no Chrome, tocar o sino do corredor e apertar "Recomeçar partida" recomeça a fase com esta mudança e voltava ao sino no `main`.

### PR 4.2: Ao Vivo, pausa silenciosa e nota longa preservada (F12)

- **Arquivos:** `src/games/talent-show/audio/player.ts:96,146-164` e `scenes/StageScene.ts:1154-1163`.
- **Mudanças:**
  - em `dispose()`, levar o ganho do `sfx` a 0 (não mexer em `cut()` e `stop()`);
  - na pausa, manter a nota aberta e fechar com o tempo da pausa só se o dedo ou a tecla subir durante ela.
- **Riscos:**
  - o juiz não muda, porque os tempos já estão em tempo de música;
  - o log enviado continua no mesmo formato (`talent-taps` v2).
- **Testes:** nenhum novo; os do juiz em `rules.test.ts` continuam verdes. Verificar com um bot descartável no scratchpad.
- **Critérios de aceitação:**
  - pausar durante a contagem silencia em menos de 100 ms;
  - segurar uma nota longa, pausar e continuar segurando, e ela conta como segurada.
- **Esforço:** S.
- **Depende de:** PR 0.2 (mesmos arquivos).
- **Como foi feito:**
  - `dispose()` também zera o ganho do `sfx`;
  - a pausa não solta mais as notas seguradas, e uma soltura durante a pausa ou a contagem de volta fecha a nota no ponto da pausa (`releaseAtPause`);
  - o `keyup` passou a ser ouvido em `window`, porque o painel de pausa tira o foco do palco;
  - não foi testado com áudio real no navegador; a verificação foi o smoke e2e e a leitura do código.

### PR 4.3: Rua Sem Saída, mira e teclado (F13, F14, F16)

- **Arquivos:** `src/games/dead-end-street/scenes/dock.ts:158-159,1055-1071` e `scenes/PlayScene.ts:596-634,674-675`.
- **Mudanças:**
  - `stopHold()` no handler de pausa;
  - a proteção contra tecla reprocessada, como em `LabScene.ts:167,1558-1559`;
  - pausa e retomada registradas com remoção no `SHUTDOWN`.
- **Critérios de aceitação:**
  - segurar a seta de toque, pausar, soltar e continuar: a mira para;
  - Q, Tab e as setas agem uma vez por toque;
  - depois de 5 reinícios, o número de listeners de pausa da cena é 1.
- **Esforço:** S.
- **Como foi feito:** a proteção `handledKeys`, igual à do Laboratório; `dock.stopHold()` na pausa e na retomada; os listeners de `PAUSE`/`RESUME` saem no `SHUTDOWN`.

### PR 4.4: Madrugada, resize duplo não perde a parte (F15)

- **Arquivos:** `src/games/past-bedtime/index.ts:149-166,182`.
- **Mudança:** guardar o último `carry` (jogadas e dicas) e o nível pendente na closure, e usá-los quando `scene()` for nulo.
- **Critérios de aceitação:** dois redimensionamentos seguidos no meio de uma parte mantêm as jogadas e a contagem de dicas. Verificar no Safari do iOS, girando o aparelho, ou com dois `resize` seguidos no DevTools.
- **Esforço:** S.
- **Como foi feito:** `carried` guarda o último `carry` até o `onReady` do jogo reconstruído.

### PR 4.5: Pequenos ajustes de ciclo de vida (F16)

- **Arquivos:**
  - `food-fight/scenes/LunchScene.ts:275`: remover pausa e retomada no `SHUTDOWN`;
  - `downhill-derby/scenes/GarageScene.ts:102`: `once` em vez de `on`.
- **Critérios de aceitação:** o número de listeners fica constante entre reinícios.
- **Esforço:** XS.
- **Como foi feito:** o `RESUME` do Lanche sai no `SHUTDOWN`; o `SHUTDOWN` da garagem usa `once`.

**Resultado esperado da etapa:** os botões e a pausa fazem o que dizem em todos os jogos.

---

## Etapa 5: Acessibilidade e detalhes do portal

**Objetivo:** painéis do shell com foco previsível e pequenos desvios de UX corrigidos. Não mude a direção de arte.

### PR 5.1: Foco dos painéis do shell (F09)

- **Arquivos:**
  - `src/components/game-shell/GameShell.tsx:651-658` (`inert` no palco quando a etapa não é `playing`);
  - `Panels.tsx:174-210,565-571,715`.
- **Mudanças:**
  1. `inert` no palco fora do modo `playing`.
  2. Decidir entre tirar `aria-modal` (o cabeçalho continua como barra de controles) ou adicionar um link "voltar à página do jogo" ao painel de introdução.
  3. Focar de novo quando `missionPending` virar falso e o foco estiver no `body`.
- **Testes:** os e2e de teclado existentes (`e2e/portal.spec.ts`, `games.spec.ts`, `mission.spec.ts`).
- **Critérios de aceitação:**
  - com um painel aberto, Tab e Shift+Tab nunca chegam ao palco;
  - com VoiceOver, dá para sair da introdução;
  - quem entra por `?mission=` com a API lenta tem o foco em "Começar missão".
- **Esforço:** S.

### PR 5.2: Rolagem, movimento reduzido e safe areas (F25)

- **Arquivos:**
  - `src/app/[lang]/layout.tsx:52` e `src/app/global-not-found.tsx` (`data-scroll-behavior="smooth"`);
  - `room/RoomPanner.tsx:79,106`, `game-shell/Panels.tsx:550`, `missions/MissionHub.tsx:117` (`behavior: "auto"` com movimento reduzido);
  - TopBar, rodapé e cabeçalho do jogo (`GameShell.tsx:593`) com `padding-inline: max(…, env(safe-area-inset-left/right))`.
- **Critérios de aceitação:**
  - trocar de página com a página rolada vai direto ao topo, sem animação;
  - com movimento reduzido não há rolagem animada;
  - no iPhone deitado (aparelho ou simulador), o cabeçalho e o TopBar ficam fora do notch.
- **Esforço:** S.

### PR 5.3: Toasts, links e estados presos (F25)

- **Arquivos:**
  - `layout/ToastList.tsx:42-49,91`, `layout/SideNav.tsx:23`;
  - `game-shell/Panels.tsx:615` (usar `@/i18n/Link`);
  - `extras/PosterCard.tsx:46-73,122-131`;
  - `room/tapes/programs.ts:11-18`;
  - os horários em `CloudCopyOffer.tsx:74`, `RecoveryCodePanel.tsx:79`, `PlayerCard.tsx:90`.
- **Mudanças:**
  - toasts pausam com hover ou foco;
  - `IntentLink` onde a 0010 pede;
  - os cartazes mostram erro e têm "tentar de novo";
  - um `import()` que falhou sai do cache;
  - os horários no fuso do visitante, ou com o rótulo do fuso (decidir).
- **Critérios de aceitação:** cada item verificado à mão. Os e2e continuam verdes.
- **Esforço:** S.

---

## Etapa 6: Servidor, observabilidade e abuso

**Objetivo:** enxergar quedas em produção e fechar abusos baratos, sem mudar nenhuma regra de placar.

### PR 6.1: Registrar falhas de banco (F18)

- **Arquivos:** `src/server/route.ts:15` e `src/server/db.ts:33-50`.
- **Mudança:** nos erros classificados como indisponíveis, registrar uma linha com só o código (`P2028`, `ECONNRESET`, …), sem mensagem nem dados.
- **Critérios de aceitação:** o teste "when the database is down" (`api.test.ts`) continua sem vazar detalhes na resposta, e o log mostra o código.
- **Esforço:** XS.

### PR 6.2: Limites que resistem a IPv6 e a envios em paralelo (F19)

- **Arquivos:** `src/server/http.ts:98-106`, `src/server/runs.ts:113,122`, `src/server/rate-limit.ts` e `api.test.ts` ou `runs.test.ts`.
- **Mudanças:**
  - `clientAddress` reduz o IPv6 ao prefixo /64 antes do HMAC;
  - o contador de rejeições é incrementado de forma atômica antes do julgamento e devolvido se o envio for aceito, ou a pausa é calculada depois do incremento.
- **Riscos:** uma casa num mesmo /64 passa a dividir o limite, como já acontece com NAT no IPv4. Os limites por endereço já são generosos (0003).
- **Testes:** é segurança da API, então cabe na 0007:
  - dois endereços no mesmo /64 dividem o contador;
  - 25 envios forjados em paralelo param em 8.
- **Critérios de aceitação:** `npm run test:db` verde.
- **Esforço:** S.

### PR 6.3: Cópia na nuvem com limites de leitura (F20, parte 2)

- **Arquivos:** `src/app/api/players/me/copy/route.ts:10-15` e `src/server/schemas.ts:139-146`.
- **Mudanças:**
  - limite por jogador no GET;
  - opcionalmente, exigir que cada valor seja JSON válido. Atenção: hoje existem flags em texto puro, como `"0"`/`"1"` do Ao Vivo, que são JSON válido, mas confira cada chave do inventário.
- **Critérios de aceitação:** o teste da cópia em `api.test.ts` continua verde, e 300 GETs seguidos são limitados.
- **Esforço:** S.

### PR 6.4: Decisão sobre o placar do Férias (F21)

- **Natureza:** documentação e decisão, sem código obrigatório.
- **Opções:**
  - mostrar o Férias como "quem terminou", sem disputa;
  - usar a idade do ticket como tempo mínimo;
  - aceitar e documentar a permanência do primeiro lugar forjado.
- **O que mais decidir:** se o 3º segredo (só depois do final) deve contar.
- **Onde registrar:** uma nova decisão `docs/decisions/0016-…` ou uma nota no topo da 0004, como o projeto já faz.
- **Esforço:** XS a S, conforme a opção.

---

## Etapa 7: Infraestrutura comum dos jogos no kit

**Objetivo:** um lugar só para as regras de ciclo de vida que hoje divergem entre os jogos.

**Pré-requisitos:** Etapas 1 e 4, para que as correções já existam e só sejam movidas.

**Ordem:** migrar um jogo por PR, começando pelos mais simples (Rua, Recreio, Pijama).

### PR 7.1: `watchFrame` no kit (F22)

- **Arquivos:** `src/games/kit/frame.ts` (novo) e os 6 `scenes/frame.ts`.
- **Mudança:**
  - parametrizar por `frameFor` e por um `swap` opcional (Férias);
  - limpar em `SHUTDOWN` e `DESTROY`;
  - ignorar resize repetido, como a Ladeira faz.
- **O que não unificar:** os `layout.ts` (`frameFor`) de cada jogo.
- **Critérios de aceitação:**
  - cada jogo migrado passa no `e2e/games.spec.ts`;
  - jogado no celular em pé e deitado, e no desktop redimensionando;
  - o `scenes/frame.ts` do jogo é apagado.
- **Esforço:** M no total.

### PR 7.2: `onKey` com proteção contra reprocessamento (F13)

- **Arquivos:** `src/games/kit/` e os jogos de teclado.
- **Mudança:** mover a proteção do Laboratório e do Pijama para o kit e adotar nos outros jogos.
- **Esforço:** S.

### PR 7.3: Detecção de toque e destruição limpa (F22, F23)

- **Mudanças:**
  - detecção de toque no primeiro toque, como o Pijama faz em `hud.ts:668-672`, para o Recreio e os outros que fixam `TOUCH_UI` ao carregar o módulo;
  - um helper `destroyGame(game)` que perde o contexto WebGL antes de `game.destroy(true)`.
- **Critérios de aceitação:**
  - num notebook com tela de toque (ou com emulação de toque no DevTools sem `pointer: coarse`), o Recreio mostra os controles no primeiro toque;
  - 10 ciclos de abrir e sair não acumulam contextos WebGL. Não deve aparecer o aviso "Too many active WebGL contexts".
- **Esforço:** S.

**Custo-benefício:** só vale porque as divergências já causaram bugs (F10, F13, F14, F16). Se as Etapas 1 e 4 resolverem os casos e ninguém mais mexer nesses arquivos, esta etapa pode esperar.

---

## Etapa 8: Limpeza, CI e documentação

- **PR 8.1, CI (F24):**
  - `.github/workflows/tests.yml:10`: `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`;
  - `e2e/scoreboard.spec.ts:84`: trocar a regex de texto por asserções sobre a resposta da API (linha 82) e a presença da região.
  - **Aceitação:** um merge seguido de outro deixa as duas execuções de `main` completas, e o e2e passa.
  - **Esforço:** XS.
- **PR 8.2, código morto (F26):**
  - remover a lista verificada em AUDITORIA, seção D, F26;
  - remover o modo dust/kick da Ladeira, ou estreitar o tipo para `"off"`;
  - remover a segunda execução do juiz no Ao Vivo e a dica "gire o celular".
  - **Aceitação:** typecheck, lint, testes e e2e verdes.
  - **Esforço:** S.
- **PR 8.3, documentação e dependências (F26):**
  - `README.md:132` sem "game of the week";
  - a 0002 lista `board_submit` e o teto de `game_load_error`, ou o código passa a respeitar o teto;
  - `jiti` em `devDependencies`, com `npm install --save-dev jiti` na versão já resolvida no lock.
  - **Esforço:** XS.
- **PR 8.4, opcional: `WorldScene.ts` do Férias (F27):**
  - levar os casos de `action()` para as áreas;
  - tipar `vars`.
  - Só quando houver conteúdo novo de história.
  - **Aceitação:** jogar a aventura inteira, do início ao fim, em pt-BR e em inglês.
  - **Esforço:** M–L.

---

## I. Quick wins

São correções pequenas, de baixo risco e benefício claro. Cada uma é um PR próprio, e todas cabem num dia.

| Achado | Mudança | Onde | Esforço |
| --- | --- | --- | --- |
| F02 | Chamar `onReady` depois do `create()` | `talent-show/scenes/StageScene.ts:251` | XS |
| F04 | Reler a fila no fim do envio | `lib/competition/client.ts:203` | XS |
| F08 (Lanche) | `SCORE.bigHurt` em `config.ts` | `food-fight/config.ts`, `LunchScene.ts:1040`, `rules.ts:219` | XS |
| F11 | Teste registry = regras; importar ids da Ladeira | `rules.ts:450` | XS |
| F18 | Registrar o código de erro de banco | `server/route.ts:15` | XS |
| F24 | `cancel-in-progress` fora de `main` | `.github/workflows/tests.yml:10` | XS |
| F25 | `data-scroll-behavior="smooth"` no `<html>` | `app/[lang]/layout.tsx:52` | XS |
| F16 | `once` no `SHUTDOWN` da garagem | `downhill-derby/scenes/GarageScene.ts:102` | XS |
| F14 | `stopHold()` na pausa | `dead-end-street/scenes/PlayScene.ts:674` | XS |
| F26 | README sem "game of the week"; `jiti` declarado | `README.md:132`, `package.json` | XS |

---

## Estratégia de execução segura

- **Pequeno e reversível:**
  - cada PR resolve um achado, ou um grupo que toca os mesmos arquivos;
  - todos podem ser revertidos sozinhos;
  - nenhum depende de migração de banco.
  - As únicas mudanças de formato são os saves do Férias (PRs 0.1 e 3.2), com migração e backup automáticos (0001).
- **Teste antes do risco:** nas Etapas 2 e 3, estender o teste primeiro e ver que ele pega o problema, por exemplo o caso da fila de resultados falhando antes da correção, e só então corrigir.
- **Contratos públicos preservados:**
  - `GameModule` e `GameHostContext` só ganham campos opcionais;
  - a API só fica mais estrita onde nenhum cliente legítimo é afetado (verificado para F20);
  - nenhuma regra muda de versão.
- **Validação entre jogos:** qualquer PR do shell ou do kit roda o e2e completo (desktop e mobile) e uma volta manual em três jogos de formatos diferentes.
- **Rollback:**
  - um PR de shell ou de kit que regredir um jogo é revertido inteiro; não se corrige em cima;
  - para o save do Férias, um rollback de código encontra um save mais novo, que vai para backup sem se perder (0001); restaurar é manual.
- **Ordem sugerida em semanas de trabalho:**
  1. Etapa 0 (os três PRs em paralelo).
  2. Etapa 1 e quick wins.
  3. Etapas 2 e 3.
  4. Etapas 4 e 5.
  5. Etapas 6 e 8.
  6. Etapa 7, se ainda fizer sentido.

---

## Custo-benefício das intervenções maiores

| Intervenção | O que ganhamos concretamente | Custo e risco | Veredito |
| --- | --- | --- | --- |
| Contrato de falhas (Etapa 1) | Fim de duas classes de tela morta (congelada e carregando para sempre) nos 9 jogos; falhas recuperáveis com um clique | Toca o contrato e os 9 jogos, mas com campo opcional e adoção gradual | Fazer |
| Pontuação de fonte única (Etapa 2) | Polimento num jogo não derruba o placar; o teste prova a mesma fórmula do jogo | Baixo; os valores não mudam | Fazer |
| `mutate` e `rev` (Etapa 3) | Fim de estrelas e itens perdidos entre abas | Baixo; um parse a mais por gravação; uma migração no Férias | Fazer |
| Kit de ciclo de vida (Etapa 7) | Correções feitas uma vez; regras iguais de limpeza e entrada | Médio: mexe em 9 jogos, mesmo um por PR | Fazer depois de 1 e 4, aos poucos, ou adiar |
| Separar `WorldScene.ts` (F27) | Conteúdo novo da história sem casts e sem estado em string | Médio; exige jogar a aventura inteira | Só junto de conteúdo novo |
| Dividir `registry.ts` | Menos conflitos de merge entre branches paralelas | Perde a tabela bilíngue tipada num lugar só (0008) | Não agora |
| Dividir `BroadcastRoom.tsx` | Leitura | Arquivo coeso; risco de regressão na sala | Não agora |
| Atualizar Phaser ou matter | Nenhum ganho para o jogador | Quebra os replays e exige novos placares em 5 jogos | Não |

---

## K. Próxima ação recomendada

Comece pela **Etapa 0, PR 0.1 (Férias não perde o final)**, e abra em paralelo os PRs 0.2 e 0.3, que são XS e tocam outros arquivos.

**Por que o 0.1 primeiro:**
- é o único achado em que o jogador perde, sem volta, o resultado de algo que levou várias sessões para conquistar;
- a correção fica dentro do Férias;
- o teste do save já existe e está na categoria que a 0007 manda proteger;
- não depende de nenhuma outra mudança.

**Os outros dois:**
- O 0.2 tira o único travamento conhecido num fluxo comum no celular.
- O 0.3 é uma correção de poucas linhas que impede perder resultados justamente quando a rede falha.

Com os três fora, a Etapa 1 resolve a fragilidade que atravessa todos os jogos: falha dentro do jogo não tem saída.
