export type GameCategory = "acao" | "puzzle" | "aventura" | "estrategia";

export type GameStatus = "disponivel" | "em-breve";

export type ControlHint = { input: string; action: string };

export type HowToStep = { title: string; text: string };

export type LevelMeta = { id: string; title: string; goal: string };

export type GameMeta = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: GameCategory;
  tags: string[];
  status: GameStatus;
  accent: "sun" | "mint" | "bubblegum" | "tangerine" | "plum" | "sky";
  cast: ("lina" | "bruno" | "deco" | "mila" | "404")[];
  production?: string;
  controls?: ControlHint[];
  howTo?: HowToStep[];
  objective?: string;
  levels?: LevelMeta[];
  tips?: string[];
  controlsSummary?: string;
  copy?: { winTitle: string; winText: string; loseTitle: string; loseText: string };
};

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  acao: "Ação",
  puzzle: "Puzzle",
  aventura: "Aventura",
  estrategia: "Estratégia",
};

export const GAMES: GameMeta[] = [
  {
    slug: "rua-sem-saida",
    title: "Rua Sem Saída",
    tagline: "Engenhocas, física e muita confusão no quintal do vizinho.",
    description:
      "Déco e Lina construíram uma engenhoca de lançamento com um carrinho de rolimã, uma colher de pau gigante e elástico de calcinha. Mire, lance objetos absurdos pelo bairro e derrube todos os enfeites do jardim do Seu Arlindo antes que a munição acabe.",
    category: "acao",
    tags: ["Ação", "Física", "Engenhocas"],
    status: "disponivel",
    accent: "sun",
    cast: ["deco", "lina", "bruno"],
    objective: "Três rodadas no quintal do Seu Arlindo: derrube os enfeites antes de acabar a munição. Bagunça extra vale pontos.",
    controls: [
      { input: "Arrastar (mouse ou dedo)", action: "Puxe para trás e solte para lançar" },
      { input: "← → ou A D", action: "Ajustar o ângulo" },
      { input: "↑ ↓ ou W S", action: "Ajustar a força" },
      { input: "Espaço ou Enter", action: "Lançar" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Puxe", text: "Arraste para trás em qualquer lugar da tela. Quanto mais longe, mais força." },
      { title: "Mire", text: "A linha pontilhada mostra o começo do caminho. É o plano do Bruno." },
      { title: "Bagunce", text: "Cada objeto voa diferente. O pato quica, o pneu derruba, o balão estoura." },
    ],
    tips: [
      "Derrubar dois alvos com um lançamento vale bônus.",
      "O pato de borracha quica muito. Use isso a seu favor.",
      "Bagunça também vale ponto. Derrube tudo!",
      "Munição que sobra vira bônus no final.",
      "A linha pontilhada é o plano do Bruno. Confie... um pouco.",
      "O balão d'água empurra tudo que estiver perto quando estoura.",
      "O pneu é pesado: mire na base das pilhas.",
    ],
    controlsSummary: "Rua Sem Saída. Setas ajustam ângulo e força, espaço lança, Esc pausa.",
    copy: {
      winTitle: "Bagunça completa!",
      winText: "O quintal do Seu Arlindo nunca mais será o mesmo.",
      loseTitle: "Acabou a munição!",
      loseText: "Os enfeites do Seu Arlindo sobreviveram. Por enquanto.",
    },
  },
  {
    slug: "laboratorio-de-pessimas-ideias",
    title: "Laboratório de Péssimas Ideias",
    tagline: "Monte máquinas malucas para resolver problemas bobos.",
    description:
      "A Lina transformou a garagem num laboratório de invenções. Em cada fase tem um problema bobo para resolver, como acordar o gato ou ligar a torradeira. Use rampas, molas, ventiladores e esteiras para levar a bolinha até o lugar certo.",
    category: "puzzle",
    tags: ["Puzzle", "Construção", "Física"],
    status: "disponivel",
    accent: "plum",
    cast: ["lina", "bruno"],
    objective: "Use as peças para levar a bolinha até o alvo. Quanto menos peças você usar, mais estrelas ganha.",
    controls: [
      { input: "Arrastar (mouse ou dedo)", action: "Levar uma peça da caixa até a área tracejada" },
      { input: "Tocar numa peça", action: "Mostrar os botões de girar e tirar" },
      { input: "1 a 4", action: "Pegar uma peça da caixa" },
      { input: "Setas", action: "Mover a peça" },
      { input: "R (ou Q)", action: "Girar a peça" },
      { input: "Enter", action: "Soltar a peça no lugar" },
      { input: "Delete ou X", action: "Guardar a peça na caixa" },
      { input: "S", action: "Escolher uma peça já montada" },
      { input: "Espaço", action: "Ligar ou desligar a máquina" },
      { input: "H", action: "Pedir uma dica" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Pegue", text: "Arraste uma peça da caixa, lá embaixo, até a área tracejada." },
      { title: "Ajuste", text: "Gire a peça se precisar. Verde quer dizer que ela cabe ali." },
      { title: "Ligue", text: "Aperte LIGAR e veja a bolinha. Não deu? Mude as peças e tente de novo." },
    ],
    levels: [
      { id: "teste", title: "Primeiro teste", goal: "Coloque a rampa e ligue a máquina." },
      { id: "pixel", title: "Bom dia, Pixel", goal: "Faça a bolinha tocar o sino." },
      { id: "torrada", title: "Café da manhã", goal: "Faça a bolinha apertar o botão da torradeira." },
      { id: "suco", title: "Suco de laranja", goal: "Leve a laranja até o espremedor." },
      { id: "controle", title: "Cadê o controle?", goal: "Faça a bolinha apertar o botão do controle." },
      { id: "definitiva", title: "A pior ideia de todas", goal: "Faça a bolinha tocar o sino atrás do muro." },
    ],
    tips: [
      "Não deu certo? Mude uma peça de lugar e tente de novo.",
      "A mola joga a bolinha para onde ela aponta.",
      "O ventilador empurra a bolinha que passa na frente dele.",
      "A esteira leva a bolinha para onde as setas apontam.",
      "Quanto menos peças, mais estrelas.",
      "Toda grande invenção começou como uma péssima ideia.",
    ],
    controlsSummary: "Laboratório de Péssimas Ideias. Números pegam peças, setas movem, R gira, Enter coloca, espaço liga a máquina, H pede dica, Esc pausa.",
    copy: {
      winTitle: "Funcionou!",
      winText: "Mais uma péssima ideia que deu certo.",
      loseTitle: "Não deu...",
      loseText: "Mude as peças e tente de novo.",
    },
  },
  {
    slug: "guerra-de-lanche",
    title: "Guerra de Lanche",
    tagline: "A cantina virou campo de batalha. Abaixe-se!",
    description:
      "Alguém jogou uma uva. Agora é guerra. Desvie de pudins voadores, recarregue com sanduíches e defenda sua mesa na cantina da escola até o sinal tocar.",
    category: "acao",
    tags: ["Ação", "Arcade", "Comida"],
    status: "em-breve",
    accent: "tangerine",
    cast: ["deco", "mila"],
    production: "Estamos testando quantos pudins cabem na tela ao mesmo tempo. Resposta atual: demais.",
  },
  {
    slug: "casa-estranha",
    title: "Casa Estranha",
    tagline: "Uma casa onde a gravidade tem opinião própria.",
    description:
      "A Mila jura que a casa no fim da rua muda de lugar à noite. Explore cômodos onde o teto vira chão, as escadas dão voltas e os móveis sussurram dicas. Ou ameaças.",
    category: "aventura",
    tags: ["Aventura", "Exploração", "Puzzles"],
    status: "em-breve",
    accent: "mint",
    cast: ["mila", "bruno"],
    production: "Mapeando os 13 cômodos. Ou 14. Depende da noite.",
  },
  {
    slug: "operacao-recreio",
    title: "Operação: Recreio",
    tagline: "15 minutos de intervalo. Uma missão impossível.",
    description:
      "Bruno planejou tudo: recuperar a bola presa no telhado, trocar figurinhas raras e voltar antes do sinal. Monte equipamentos improvisados e complete missões no pátio da escola.",
    category: "estrategia",
    tags: ["Estratégia", "Missões", "Equipamentos"],
    status: "em-breve",
    accent: "sky",
    cast: ["bruno", "deco", "lina"],
    production: "O plano do Bruno tem 47 etapas. Estamos na etapa 12.",
  },
];

export function getGame(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}

export const PLAYABLE = GAMES.filter((g) => g.status === "disponivel");
