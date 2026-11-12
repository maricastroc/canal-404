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
  | "fight-sharpshooter"
  | "recess-first"
  | "recess-flawless"
  | "recess-boss"
  | "pajama-first"
  | "pajama-flawless"
  | "pajama-trio"
  | "offair-mystery"
  | "offair-posters"
  | "offair-room";

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
    description: "Você abriu a caixa de pizza de 2004. Que coragem.",
    hint: "Tem uma caixa no chão que ninguém tem coragem de abrir.",
  },
  {
    id: "lost-channel",
    title: "Canal Perdido",
    description: "Você sintonizou a transmissão que não devia existir.",
    hint: "Tem um canal que só aparece para quem gira o botão da TV demais.",
  },
  {
    id: "blackout",
    title: "Apagão",
    description: "Você apagou a luz e a parede revelou uma mensagem.",
    hint: "Algumas coisas só aparecem quando a luz vai embora.",
  },
  {
    id: "plane",
    title: "Piloto de Teto",
    description: "Você fez o aviãozinho do teto voar.",
    hint: "Olhe para cima. Tem algo esperando para decolar.",
  },
  {
    id: "cartridge",
    title: "Cartucho Perdido",
    description: "Você achou o cartucho escondido perto da planta.",
    hint: "Nem todo cartucho fica na estante. Alguns preferem a companhia do verde.",
  },
  {
    id: "tape",
    title: "Fita Misteriosa",
    description: "Você colocou a fita proibida no videocassete.",
    hint: "Uma fita na estante pede para não ser assistida. Claro que você vai assistir.",
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
    description: "Você entrou no Canal 404 pela primeira vez.",
    hint: "Basta aparecer.",
    color: "sun",
  },
  {
    id: "radio-on",
    title: "DJ do Porão",
    description: "Você ligou o Rádio 404. A sala agradece.",
    hint: "Ligue o rádio da sala de transmissão.",
    color: "mint",
  },
  {
    id: "channel-surfer",
    title: "Zapeador Profissional",
    description: "Você trocou de canal 5 vezes em poucos segundos.",
    hint: "Gire o botão da TV 5 vezes em poucos segundos.",
    color: "sky",
  },
  {
    id: "explorer",
    title: "Explorador de Sala",
    description: "Você encontrou 3 segredos da sala.",
    hint: "Encontre 3 segredos na sala de transmissão.",
    color: "tangerine",
  },
  {
    id: "secret-hunter",
    title: "Caçador de Segredos",
    description: "Você encontrou todos os segredos da sala. Não sobrou nada escondido.",
    hint: "Encontre todos os segredos da sala de transmissão.",
    color: "plum",
  },
  {
    id: "first-launch",
    title: "Primeiro Lançamento",
    description: "Você fez seu primeiro lançamento em Rua Sem Saída.",
    hint: "Faça seu primeiro lançamento em Rua Sem Saída.",
    color: "bubblegum",
  },
  {
    id: "street-win",
    title: "Bagunça Concluída",
    description: "Você derrubou todos os alvos de Rua Sem Saída. O Seu Arlindo não gostou.",
    hint: "Vença uma partida de Rua Sem Saída.",
    color: "tangerine",
  },
  {
    id: "three-stars",
    title: "Engenheiro de Quintal",
    description: "Você venceu Rua Sem Saída com 3 estrelas.",
    hint: "Vença Rua Sem Saída com 3 estrelas. Sobrar munição ajuda.",
    color: "sun",
  },
  {
    id: "domino-effect",
    title: "Efeito Dominó",
    description: "Você derrubou 2 alvos com um lançamento só.",
    hint: "Derrube 2 alvos com um único lançamento em Rua Sem Saída.",
    color: "mint",
  },
  {
    id: "high-scorer",
    title: "Recordista do Bairro",
    description: "Você fez 2.500 pontos ou mais em Rua Sem Saída.",
    hint: "Faça 2.500 pontos em Rua Sem Saída. Bagunça extra também conta.",
    color: "bubblegum",
  },
  {
    id: "lab-first",
    title: "Péssima Ideia Nº 1",
    description: "Sua primeira máquina no Laboratório funcionou. Mais ou menos como planejado.",
    hint: "Resolva uma fase do Laboratório de Péssimas Ideias.",
    color: "plum",
  },
  {
    id: "lab-minimalist",
    title: "Menos É Mais",
    description: "Você resolveu uma fase do Laboratório com menos peças que a meta.",
    hint: "Resolva uma fase do Laboratório usando menos peças que a meta.",
    color: "mint",
  },
  {
    id: "lab-complete",
    title: "Cientista Maluca",
    description: "Você terminou todas as fases do Laboratório de Péssimas Ideias.",
    hint: "Termine a última fase do Laboratório de Péssimas Ideias.",
    color: "sun",
  },
  {
    id: "fight-win",
    title: "Mesa Defendida",
    description: "Você defendeu a mesa até o sinal tocar.",
    hint: "Aguente a Guerra de Lanche até o sinal tocar.",
    color: "tangerine",
  },
  {
    id: "fight-clean",
    title: "Roupa Limpinha",
    description: "Você venceu a Guerra de Lanche sem nenhuma mancha de pudim.",
    hint: "Vença a Guerra de Lanche sem levar nenhum pudim.",
    color: "mint",
  },
  {
    id: "fight-sharpshooter",
    title: "Mira de Cantina",
    description: "Você acertou 10 alunos seguidos na Guerra de Lanche.",
    hint: "Acerte 10 alunos seguidos na Guerra de Lanche, sem errar no meio.",
    color: "sky",
  },
  {
    id: "recess-first",
    title: "Corredor Livre",
    description: "Você atravessou o corredor proibido da Operação: Recreio.",
    hint: "Termine a primeira fase da Operação: Recreio.",
    color: "sky",
  },
  {
    id: "recess-flawless",
    title: "Sem um Arranhão",
    description: "Você terminou uma fase da Operação: Recreio sem levar nenhuma batida.",
    hint: "Termine uma fase da Operação: Recreio sem levar nenhuma batida.",
    color: "sun",
  },
  {
    id: "recess-boss",
    title: "Recreio Liberado",
    description: "Você venceu o Inspetor do Silêncio. O recreio está liberado.",
    hint: "Vença o chefão da última fase da Operação: Recreio.",
    color: "bubblegum",
  },
  {
    id: "pajama-first",
    title: "Último de Pé",
    description: "Você venceu uma partida da Guerra do Pijama.",
    hint: "Vença uma partida da Guerra do Pijama.",
    color: "bubblegum",
  },
  {
    id: "pajama-flawless",
    title: "Nem uma Pena",
    description: "Você venceu a Guerra do Pijama sem levar nenhuma travesseirada.",
    hint: "Vença a Guerra do Pijama sem levar nenhuma travesseirada.",
    color: "sun",
  },
  {
    id: "pajama-trio",
    title: "Trio do Pijama",
    description: "Você venceu a Guerra do Pijama com a Lia, o Nico e a Bia.",
    hint: "Vença a Guerra do Pijama com a Lia, o Nico e a Bia.",
    color: "plum",
  },
  {
    id: "offair-mystery",
    title: "Férias sem Fim",
    description: "Você descobriu por que o resort do Canal 404 continua no ar.",
    hint: "Siga o sinal até a floresta.",
    color: "mint",
  },
  {
    id: "offair-posters",
    title: "Colecionador de Pôsteres",
    description: "Você achou os 5 pôsteres do Canal 404 escondidos no resort.",
    hint: "Tem um pôster do canal escondido em cada área do resort.",
    color: "tangerine",
  },
  {
    id: "offair-room",
    title: "Hóspede do 404",
    description: "Você abriu o quarto 404 e conheceu quem dorme lá.",
    hint: "Um hóspede bem lento guarda uma chave.",
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
