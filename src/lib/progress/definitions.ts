export type SecretId =
  | "cat"
  | "pizza"
  | "lost-channel"
  | "blackout"
  | "plane"
  | "cartridge"
  | "tape"
  | "poke";

export type AchievementId =
  | "first-visit"
  | "radio-on"
  | "channel-surfer"
  | "explorer"
  | "secret-hunter"
  | "first-launch"
  | "street-win"
  | "three-stars"
  | "domino-effect"
  | "high-scorer"
  | "lab-first"
  | "lab-minimalist"
  | "lab-complete"
  | "fight-win"
  | "fight-clean"
  | "fight-sharpshooter";

export type SecretDef = {
  id: SecretId;
  title: string;
  description: string;
  hint: string;
};

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
  hint: string;
  color: "sun" | "mint" | "bubblegum" | "tangerine" | "sky" | "plum";
};

export const SECRETS: SecretDef[] = [
  {
    id: "cat",
    title: "Amigo do Pixel",
    description: "Você fez carinho no gato da sala até ele ronronar.",
    hint: "Alguém está dormindo no pufe. Seja gentil. E insistente.",
  },
  {
    id: "pizza",
    title: "Pizza Arqueológica",
    description: "Você abriu a caixa de pizza de 2004. Coragem.",
    hint: "Tem uma caixa no chão que ninguém tem coragem de abrir.",
  },
  {
    id: "lost-channel",
    title: "Canal Perdido",
    description: "Você sintonizou a transmissão que não devia existir.",
    hint: "Gire o botão da TV mais vezes do que deveria.",
  },
  {
    id: "blackout",
    title: "Apagão",
    description: "No escuro, a parede revelou uma mensagem.",
    hint: "Algumas coisas só aparecem quando a luz vai embora.",
  },
  {
    id: "plane",
    title: "Piloto de Teto",
    description: "O aviãozinho pendurado finalmente voou.",
    hint: "Olhe para cima. Tem algo esperando decolar.",
  },
  {
    id: "cartridge",
    title: "Cartucho Perdido",
    description: "Você achou o cartucho escondido perto da planta.",
    hint: "Nem todo cartucho está à vista. Procure perto da planta.",
  },
  {
    id: "tape",
    title: "Fita Misteriosa",
    description: "Você colocou a fita proibida no videocassete.",
    hint: "Uma fita na estante diz para não assistir. Claro que você vai assistir.",
  },
  {
    id: "poke",
    title: "Não Cutuque o Mascote",
    description: "Você cutucou o 404 até ele ficar tonto.",
    hint: "O mascote aguenta muita coisa. Mas não tudo.",
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-visit",
    title: "Sintonizou!",
    description: "Entrou no CANAL 404 pela primeira vez.",
    hint: "Basta aparecer.",
    color: "sun",
  },
  {
    id: "radio-on",
    title: "DJ do Porão",
    description: "Ligou o Rádio 404.",
    hint: "A sala fica melhor com música.",
    color: "mint",
  },
  {
    id: "channel-surfer",
    title: "Zapeador Profissional",
    description: "Mudou de canal 5 vezes seguidas.",
    hint: "O controle remoto sumiu, mas a TV tem botão.",
    color: "sky",
  },
  {
    id: "explorer",
    title: "Explorador de Sala",
    description: "Encontrou 3 segredos.",
    hint: "Clique em tudo. Sério, em tudo.",
    color: "tangerine",
  },
  {
    id: "secret-hunter",
    title: "Caçador de Segredos",
    description: "Encontrou todos os segredos da sala.",
    hint: "Ainda tem coisa escondida por aí.",
    color: "plum",
  },
  {
    id: "first-launch",
    title: "Primeiro Lançamento",
    description: "Lançou o primeiro objeto em Rua Sem Saída.",
    hint: "Puxe, mire e solte.",
    color: "bubblegum",
  },
  {
    id: "street-win",
    title: "Bagunça Concluída",
    description: "Derrubou todos os alvos de Rua Sem Saída.",
    hint: "O Seu Arlindo não vai gostar.",
    color: "tangerine",
  },
  {
    id: "three-stars",
    title: "Engenheiro de Quintal",
    description: "Venceu Rua Sem Saída com 3 estrelas.",
    hint: "Sobrar munição conta muito.",
    color: "sun",
  },
  {
    id: "domino-effect",
    title: "Efeito Dominó",
    description: "Derrubou 2 alvos com um único lançamento.",
    hint: "Tente derrubar dois alvos de uma vez.",
    color: "mint",
  },
  {
    id: "high-scorer",
    title: "Recordista do Bairro",
    description: "Fez mais de 2500 pontos em Rua Sem Saída.",
    hint: "Bagunça extra também vale ponto.",
    color: "bubblegum",
  },
  {
    id: "lab-first",
    title: "Péssima Ideia Nº 1",
    description: "Fez a primeira máquina do Laboratório funcionar.",
    hint: "Toda invenção começa com uma rampa torta.",
    color: "plum",
  },
  {
    id: "lab-minimalist",
    title: "Menos É Mais",
    description: "Resolveu uma fase do Laboratório com menos peças que a meta.",
    hint: "Tente gastar menos peças do que a meta pede.",
    color: "mint",
  },
  {
    id: "lab-complete",
    title: "Cientista Maluca",
    description: "Terminou todas as fases do Laboratório de Péssimas Ideias.",
    hint: "A pior ideia de todas está te esperando.",
    color: "sun",
  },
  {
    id: "fight-win",
    title: "Mesa Defendida",
    description: "Aguentou a Guerra de Lanche até o sinal tocar.",
    hint: "Abaixe quando vier pudim.",
    color: "tangerine",
  },
  {
    id: "fight-clean",
    title: "Roupa Limpinha",
    description: "Venceu a Guerra de Lanche sem levar nenhum pudim.",
    hint: "Nem uma manchinha.",
    color: "mint",
  },
  {
    id: "fight-sharpshooter",
    title: "Mira de Cantina",
    description: "Acertou 10 alunos seguidos na Guerra de Lanche.",
    hint: "Não erre nenhum lanche por um bom tempo.",
    color: "sky",
  },
];

export const SECRET_IDS = SECRETS.map((s) => s.id);

export function secretById(id: SecretId) {
  return SECRETS.find((s) => s.id === id);
}

export function achievementById(id: AchievementId) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
