import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";

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
  | "offair-room"
  | "talent-finale";

export type ProgressText = {
  title: string;
  description: string;
  hint: string;
};

export type SecretDef = {
  id: SecretId;
};

export type AchievementDef = {
  id: AchievementId;
  color: "sun" | "mint" | "bubblegum" | "tangerine" | "sky" | "plum";
};

export const SECRETS: SecretDef[] = [
  { id: "cat" },
  { id: "pizza" },
  { id: "lost-channel" },
  { id: "blackout" },
  { id: "plane" },
  { id: "cartridge" },
  { id: "tape" },
  { id: "poke" },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-visit", color: "sun" },
  { id: "radio-on", color: "mint" },
  { id: "channel-surfer", color: "sky" },
  { id: "explorer", color: "tangerine" },
  { id: "secret-hunter", color: "plum" },
  { id: "first-launch", color: "bubblegum" },
  { id: "street-win", color: "tangerine" },
  { id: "three-stars", color: "sun" },
  { id: "domino-effect", color: "mint" },
  { id: "high-scorer", color: "bubblegum" },
  { id: "lab-first", color: "plum" },
  { id: "lab-minimalist", color: "mint" },
  { id: "lab-complete", color: "sun" },
  { id: "fight-win", color: "tangerine" },
  { id: "fight-clean", color: "mint" },
  { id: "fight-sharpshooter", color: "sky" },
  { id: "recess-first", color: "sky" },
  { id: "recess-flawless", color: "sun" },
  { id: "recess-boss", color: "bubblegum" },
  { id: "pajama-first", color: "bubblegum" },
  { id: "pajama-flawless", color: "sun" },
  { id: "pajama-trio", color: "plum" },
  { id: "offair-mystery", color: "mint" },
  { id: "offair-posters", color: "tangerine" },
  { id: "offair-room", color: "sky" },
  { id: "talent-finale", color: "bubblegum" },
];

export const SECRET_TEXT = localized<Record<SecretId, ProgressText>>({
  "pt-BR": {
    cat: {
      title: "Amigo do Pixel",
      description: "Você fez carinho no gato da sala até ele ronronar.",
      hint: "Alguém está dormindo no pufe. Seja gentil. E insistente.",
    },
    pizza: {
      title: "Pizza Arqueológica",
      description: "Você abriu a caixa de pizza de 2004. Que coragem.",
      hint: "Tem uma caixa no chão que ninguém tem coragem de abrir.",
    },
    "lost-channel": {
      title: "Canal Perdido",
      description: "Você sintonizou a transmissão que não devia existir.",
      hint: "Tem um canal que só aparece para quem gira o botão da TV demais.",
    },
    blackout: {
      title: "Apagão",
      description: "Você apagou a luz e a parede revelou uma mensagem.",
      hint: "Algumas coisas só aparecem quando a luz vai embora.",
    },
    plane: {
      title: "Piloto de Teto",
      description: "Você fez o aviãozinho do teto voar.",
      hint: "Olhe para cima. Tem algo esperando para decolar.",
    },
    cartridge: {
      title: "Cartucho Perdido",
      description: "Você achou o cartucho escondido perto da planta.",
      hint: "Nem todo cartucho fica na estante. Alguns preferem a companhia do verde.",
    },
    tape: {
      title: "Fita Misteriosa",
      description: "Você colocou a fita proibida no videocassete.",
      hint: "Uma fita na estante pede para não ser assistida. Claro que você vai assistir.",
    },
    poke: {
      title: "Não Cutuque o Mascote",
      description: "Você cutucou o 404 até ele ficar tonto.",
      hint: "O mascote aguenta muita coisa. Mas não tudo.",
    },
  },
  en: {
    cat: {
      title: "Pixel's Friend",
      description: "You petted the room's cat until he purred.",
      hint: "Someone is asleep on the beanbag. Be gentle. And persistent.",
    },
    pizza: {
      title: "Archaeological Pizza",
      description: "You opened the pizza box from 2004. That took guts.",
      hint: "There's a box on the floor that nobody dares to open.",
    },
    "lost-channel": {
      title: "Lost Channel",
      description: "You tuned in to the broadcast that shouldn't exist.",
      hint: "There's a channel that only shows up if you turn the TV knob too much.",
    },
    blackout: {
      title: "Blackout",
      description: "You turned off the light and the wall revealed a message.",
      hint: "Some things only show up when the lights go out.",
    },
    plane: {
      title: "Ceiling Pilot",
      description: "You made the little plane on the ceiling fly.",
      hint: "Look up. Something is waiting to take off.",
    },
    cartridge: {
      title: "Lost Cartridge",
      description: "You found the cartridge hidden near the plant.",
      hint: "Not every cartridge lives on the shelf. Some prefer the company of green things.",
    },
    tape: {
      title: "Mystery Tape",
      description: "You put the forbidden tape in the VCR.",
      hint: "A tape on the shelf asks not to be watched. Of course you're going to watch it.",
    },
    poke: {
      title: "Don't Poke the Mascot",
      description: "You poked 404 until he got dizzy.",
      hint: "The mascot can take a lot. But not everything.",
    },
  },
});

export const ACHIEVEMENT_TEXT = localized<Record<AchievementId, ProgressText>>({
  "pt-BR": {
    "first-visit": {
      title: "Sintonizou!",
      description: "Você entrou no Canal 404 pela primeira vez.",
      hint: "Basta aparecer.",
    },
    "radio-on": {
      title: "DJ do Porão",
      description: "Você ligou o Rádio 404. A sala agradece.",
      hint: "Ligue o rádio da sala de transmissão.",
    },
    "channel-surfer": {
      title: "Zapeador Profissional",
      description: "Você trocou de canal 5 vezes em poucos segundos.",
      hint: "Gire o botão da TV 5 vezes em poucos segundos.",
    },
    explorer: {
      title: "Explorador de Sala",
      description: "Você encontrou 3 segredos da sala.",
      hint: "Encontre 3 segredos na sala de transmissão.",
    },
    "secret-hunter": {
      title: "Caçador de Segredos",
      description: "Você encontrou todos os segredos da sala. Não sobrou nada escondido.",
      hint: "Encontre todos os segredos da sala de transmissão.",
    },
    "first-launch": {
      title: "Primeiro Lançamento",
      description: "Você fez seu primeiro lançamento em Rua Sem Saída.",
      hint: "Faça seu primeiro lançamento em Rua Sem Saída.",
    },
    "street-win": {
      title: "Bagunça Concluída",
      description: "Você derrubou o Gnomão e o Seu Arlindo se rendeu.",
      hint: "Complete a fase 9 de Rua Sem Saída.",
    },
    "three-stars": {
      title: "Engenheiro de Quintal",
      description: "Você ganhou 3 estrelas numa fase de Rua Sem Saída.",
      hint: "Termine uma fase de Rua Sem Saída com poucos lançamentos.",
    },
    "domino-effect": {
      title: "Efeito Dominó",
      description: "Você derrubou 2 alvos com um lançamento só.",
      hint: "Derrube 2 alvos com um único lançamento em Rua Sem Saída.",
    },
    "high-scorer": {
      title: "Recordista do Bairro",
      description: "Você ganhou as 27 estrelas de Rua Sem Saída.",
      hint: "Ganhe 3 estrelas em todas as fases de Rua Sem Saída.",
    },
    "lab-first": {
      title: "Péssima Ideia Nº 1",
      description: "Sua primeira máquina no Laboratório funcionou. Mais ou menos como planejado.",
      hint: "Resolva uma fase do Laboratório de Péssimas Ideias.",
    },
    "lab-minimalist": {
      title: "Menos É Mais",
      description: "Você resolveu uma fase do Laboratório com menos peças que a meta.",
      hint: "Resolva uma fase do Laboratório usando menos peças que a meta.",
    },
    "lab-complete": {
      title: "Cientista Maluca",
      description: "Você terminou todas as fases do Laboratório de Péssimas Ideias.",
      hint: "Termine a última fase do Laboratório de Péssimas Ideias.",
    },
    "fight-win": {
      title: "Mesa Defendida",
      description: "Você defendeu a mesa até o sinal tocar.",
      hint: "Aguente a Guerra de Lanche até o sinal tocar.",
    },
    "fight-clean": {
      title: "Roupa Limpinha",
      description: "Você venceu a Guerra de Lanche sem nenhuma mancha de pudim.",
      hint: "Vença a Guerra de Lanche sem levar nenhum pudim.",
    },
    "fight-sharpshooter": {
      title: "Mira de Cantina",
      description: "Você acertou 10 alunos seguidos na Guerra de Lanche.",
      hint: "Acerte 10 alunos seguidos na Guerra de Lanche, sem errar no meio.",
    },
    "recess-first": {
      title: "Corredor Livre",
      description: "Você atravessou o corredor proibido da Operação: Recreio.",
      hint: "Termine a primeira fase da Operação: Recreio.",
    },
    "recess-flawless": {
      title: "Sem um Arranhão",
      description: "Você terminou uma fase da Operação: Recreio sem levar nenhuma batida.",
      hint: "Termine uma fase da Operação: Recreio sem levar nenhuma batida.",
    },
    "recess-boss": {
      title: "Recreio Liberado",
      description: "Você venceu o Inspetor do Silêncio. O recreio está liberado.",
      hint: "Vença o chefão da última fase da Operação: Recreio.",
    },
    "pajama-first": {
      title: "Último de Pé",
      description: "Você venceu uma partida da Guerra do Pijama.",
      hint: "Vença uma partida da Guerra do Pijama.",
    },
    "pajama-flawless": {
      title: "Nem uma Pena",
      description: "Você venceu a Guerra do Pijama sem levar nenhuma travesseirada.",
      hint: "Vença a Guerra do Pijama sem levar nenhuma travesseirada.",
    },
    "pajama-trio": {
      title: "Trio do Pijama",
      description: "Você venceu a Guerra do Pijama com a Lia, o Nico e a Bia.",
      hint: "Vença a Guerra do Pijama com a Lia, o Nico e a Bia.",
    },
    "offair-mystery": {
      title: "Férias sem Fim",
      description: "Você descobriu por que o resort do Canal 404 continua no ar.",
      hint: "Siga o sinal até a floresta.",
    },
    "offair-posters": {
      title: "Colecionador de Pôsteres",
      description: "Você achou os 5 pôsteres do Canal 404 escondidos no resort.",
      hint: "Tem um pôster do canal escondido em cada área do resort.",
    },
    "offair-room": {
      title: "Hóspede do 404",
      description: "Você abriu o quarto 404 e conheceu quem dorme lá.",
      hint: "Um hóspede bem lento guarda uma chave.",
    },
    "talent-finale": {
      title: "Bis!",
      description: "Você terminou o Pot-pourri do 404 com pelo menos uma estrela.",
      hint: "A final do show de calouros ainda espera pela banda.",
    },
  },
  en: {
    "first-visit": {
      title: "Tuned In!",
      description: "You visited Canal 404 for the first time.",
      hint: "Just show up.",
    },
    "radio-on": {
      title: "Basement DJ",
      description: "You turned on Radio 404. The room thanks you.",
      hint: "Turn on the radio in the broadcast room.",
    },
    "channel-surfer": {
      title: "Pro Channel Surfer",
      description: "You changed the channel 5 times in a few seconds.",
      hint: "Turn the TV knob 5 times in a few seconds.",
    },
    explorer: {
      title: "Room Explorer",
      description: "You found 3 secrets in the room.",
      hint: "Find 3 secrets in the broadcast room.",
    },
    "secret-hunter": {
      title: "Secret Hunter",
      description: "You found every secret in the room. Nothing is left hidden.",
      hint: "Find every secret in the broadcast room.",
    },
    "first-launch": {
      title: "First Launch",
      description: "You made your first launch in Dead End Street.",
      hint: "Make your first launch in Dead End Street.",
    },
    "street-win": {
      title: "Mess Complete",
      description: "You knocked down the Giant Gnome and Mr. Arlindo gave up.",
      hint: "Clear level 9 of Dead End Street.",
    },
    "three-stars": {
      title: "Backyard Engineer",
      description: "You earned 3 stars on a Dead End Street level.",
      hint: "Clear a Dead End Street level with few launches.",
    },
    "domino-effect": {
      title: "Domino Effect",
      description: "You knocked down 2 targets with a single launch.",
      hint: "Knock down 2 targets with a single launch in Dead End Street.",
    },
    "high-scorer": {
      title: "Neighborhood Record Holder",
      description: "You earned all 27 stars in Dead End Street.",
      hint: "Get 3 stars on every Dead End Street level.",
    },
    "lab-first": {
      title: "Bad Idea No. 1",
      description: "Your first machine in the Lab worked. More or less as planned.",
      hint: "Solve a level in Bad Ideas Lab.",
    },
    "lab-minimalist": {
      title: "Less Is More",
      description: "You solved a Lab level with fewer parts than the target.",
      hint: "Solve a Lab level using fewer parts than the target.",
    },
    "lab-complete": {
      title: "Mad Scientist",
      description: "You finished every level of Bad Ideas Lab.",
      hint: "Finish the last level of Bad Ideas Lab.",
    },
    "fight-win": {
      title: "Table Defended",
      description: "You defended the table until the bell rang.",
      hint: "Hold out in Food Fight until the bell rings.",
    },
    "fight-clean": {
      title: "Squeaky Clean",
      description: "You won Food Fight without a single pudding stain.",
      hint: "Win Food Fight without getting hit by any pudding.",
    },
    "fight-sharpshooter": {
      title: "Cafeteria Sharpshooter",
      description: "You hit 10 students in a row in Food Fight.",
      hint: "Hit 10 students in a row in Food Fight, without missing in between.",
    },
    "recess-first": {
      title: "Hallway Clear",
      description: "You made it through the forbidden hallway in Operation: Recess.",
      hint: "Finish the first level of Operation: Recess.",
    },
    "recess-flawless": {
      title: "Not a Scratch",
      description: "You finished a level of Operation: Recess without taking a single hit.",
      hint: "Finish a level of Operation: Recess without taking a single hit.",
    },
    "recess-boss": {
      title: "Recess Is On",
      description: "You beat the Silence Inspector. Recess is on.",
      hint: "Beat the boss of the last level of Operation: Recess.",
    },
    "pajama-first": {
      title: "Last One Standing",
      description: "You won a match of Pajama War.",
      hint: "Win a match of Pajama War.",
    },
    "pajama-flawless": {
      title: "Not a Feather",
      description: "You won Pajama War without taking a single pillow hit.",
      hint: "Win Pajama War without taking a single pillow hit.",
    },
    "pajama-trio": {
      title: "Pajama Trio",
      description: "You won Pajama War with Lia, Nico and Bia.",
      hint: "Win Pajama War with Lia, Nico and Bia.",
    },
    "offair-mystery": {
      title: "Endless Vacation",
      description: "You found out why the Canal 404 resort is still on the air.",
      hint: "Follow the signal into the forest.",
    },
    "offair-posters": {
      title: "Poster Collector",
      description: "You found the 5 Canal 404 posters hidden around the resort.",
      hint: "There's a channel poster hidden in every area of the resort.",
    },
    "offair-room": {
      title: "Guest of 404",
      description: "You opened Room 404 and met whoever sleeps there.",
      hint: "A very slow guest is keeping a key.",
    },
    "talent-finale": {
      title: "Encore!",
      description: "You finished the 404 Medley with at least one star.",
      hint: "The talent show final is still waiting for the band.",
    },
  },
});

export const SECRET_IDS = SECRETS.map((s) => s.id);

export function secretText(id: SecretId, locale: Locale) {
  return SECRET_TEXT[locale][id];
}

export function achievementText(id: AchievementId, locale: Locale) {
  return ACHIEVEMENT_TEXT[locale][id];
}
