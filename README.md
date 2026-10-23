# CANAL 404 — Desenhos. Jogos. Bagunça.

Portal fictício de jogos inspirado na sensação dos sites de desenho animado dos anos 2000. O canal saiu do ar, mas o portal continua funcionando: uma sala de transmissão ilustrada e interativa, personagens originais, segredos escondidos e o minijogo **Rua Sem Saída**.

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Para gerar a versão de produção:

```bash
npm run build && npm start
```

Não há serviços externos, autenticação ou chaves de API. Progresso, recordes, segredos e preferências ficam no `localStorage` do navegador.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS 4 (tokens de cor, fontes e texturas em `src/app/globals.css`)
- Phaser 3 com Matter.js para o minijogo (carregado sob demanda, só na página do jogo)
- Motion para microinterações da interface
- SVG autoral para todas as ilustrações
- Web Audio API para efeitos sonoros e trilhas sintetizadas ao vivo

## Seções

| Rota | Conteúdo |
| --- | --- |
| `/` | Sala de transmissão: TV com o jogo da semana e canais, fliperama que abre o catálogo, rádio com trilha sonora, mascote 404 e objetos com segredos |
| `/jogos` | Catálogo com filtros por categoria |
| `/jogos/[slug]` | Ficha do jogo (jogável ou "fora do ar") |
| `/jogar/[slug]` | Carregamento real, apresentação, partida, pausa e resultado |
| `/personagens` | Seleção de personagens com reações |
| `/extras` | Pôsteres para baixar (PNG), trilhas, conquistas e segredos |
| `/sobre` | História fictícia do canal |

## Estrutura

```
src/
  app/                 rotas (App Router)
  components/
    room/              sala de transmissão, objetos e diretor do mascote
    mascot/            mascote 404 (expressões, poses, olhar)
    characters/        personagens e tela de seleção
    catalog/           cartões e catálogo de jogos
    game-shell/        carregamento, painéis de pausa/resultado e ponte com o jogo
    extras/            pôsteres, jukebox, conquistas e segredos
    art/               logo, capas, ícones e selos
    layout/            navegação, toasts, som
    ui/                primitivas visuais
  games/
    registry.ts        metadados de todos os jogos (catálogo)
    loaders.ts         import dinâmico de cada jogo jogável
    types.ts           contrato entre o portal e os jogos
    rua-sem-saida/     o jogo (cenas Phaser, nível, sons)
  lib/
    audio/             motor Web Audio, efeitos e trilhas
    progress/          persistência, segredos e conquistas
public/games/rua-sem-saida/   arte SVG do jogo
```

## Adicionando um novo jogo

Os jogos são independentes do portal. Cada um exporta um `GameModule` com `mount(ctx)` e recebe do portal apenas o que precisa (elemento pai, fontes, áudio, recorde atual e callbacks de progresso/eventos).

1. Crie a pasta `src/games/<slug>/` com um `index.ts` que exporte `{ mount }` seguindo `src/games/types.ts`.
2. Registre os metadados em `src/games/registry.ts` (título, categoria, controles, instruções, `status: "disponivel"`).
3. Adicione o carregador em `src/games/loaders.ts`.
4. Desenhe a capa em `src/components/art/Covers.tsx`.

O portal cuida do carregamento com barra de progresso real, da tela de apresentação, pausa, resultado, recordes, conquistas e anúncios para leitores de tela.

## Rua Sem Saída

Estilingue montado num carrinho: puxe para trás (mouse ou toque) ou use as setas para mirar e espaço para lançar. Três rodadas curtas no quintal do Seu Arlindo — alvos próximos, depois atrás de obstáculos e por fim lá no alto — com sete lançamentos de quatro tipos com física diferente (tênis, balão d'água que estoura, pneu pesado, pato que quica). O bairro reage: o gato foge, a tampa da lata voa, o passarinho escapa da casinha. Pontos por alvo, rodada, bagunça, combos e munição de sobra; recorde salvo localmente.

## Acessibilidade

- Todos os objetos da sala são botões ou links reais, navegáveis por teclado, com foco visível.
- Dicas de hover também aparecem no foco; ações importantes têm alternativa sem hover.
- O jogo aceita teclado, mouse e toque, e anuncia eventos via região `aria-live`.
- Respeita `prefers-reduced-motion` e nada depende só de áudio; o som começa apenas após interação e pode ser desligado.
