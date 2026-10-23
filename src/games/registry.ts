export type GameCategory = "acao" | "puzzle" | "aventura" | "estrategia";

export type GameStatus = "disponivel" | "em-breve";

export type ControlHint = { input: string; action: string };

export type HowToStep = { title: string; text: string };

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
    objective: "Derrube os 5 alvos do quintal antes de acabar a munição. Bagunça extra vale pontos.",
    controls: [
      { input: "Arrastar (mouse ou dedo)", action: "Puxe para trás e solte para lançar" },
      { input: "← → ou A D", action: "Ajustar o ângulo" },
      { input: "↑ ↓ ou W S", action: "Ajustar a força" },
      { input: "Espaço ou Enter", action: "Lançar" },
      { input: "Esc ou P", action: "Pausar" },
    ],
    howTo: [
      { title: "Puxe", text: "Arraste para trás em qualquer lugar da tela. Quanto mais longe, mais força." },
      { title: "Mire", text: "A linha pontilhada é o plano do Bruno. Ela mostra o começo da trajetória." },
      { title: "Bagunce", text: "Cada objeto voa diferente. O pato quica, o pneu derruba, o balão estoura." },
    ],
  },
  {
    slug: "laboratorio-de-pessimas-ideias",
    title: "Laboratório de Péssimas Ideias",
    tagline: "Monte máquinas absurdas para resolver problemas simples.",
    description:
      "A Lina transformou a garagem num laboratório. Cada fase é um problema bobo (acordar o gato, servir um copo de suco) que só pode ser resolvido com uma máquina gigante de engrenagens, ventiladores e bolinhas de gude.",
    category: "puzzle",
    tags: ["Puzzle", "Construção", "Física"],
    status: "em-breve",
    accent: "plum",
    cast: ["lina", "bruno"],
    production: "Protótipo de engrenagens funcionando. Os ventiladores ainda sopram para o lado errado.",
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
