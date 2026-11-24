import type { Localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";

export type CharacterId = "404" | "lina" | "bruno" | "deco" | "mila";

export type Character = {
  id: CharacterId;
  name: string;
  role: string;
  cardClass: string;
  bio: string;
  likes: string;
  dislikes: string;
  catchphrase: string;
  fact: string;
  sound: "boing" | "pop" | "squeak" | "whoosh" | "secret";
};

type CharacterText = Pick<Character, "name" | "role" | "bio" | "likes" | "dislikes" | "catchphrase" | "fact">;

const BASE: Pick<Character, "id" | "cardClass" | "sound">[] = [
  { id: "404", cardClass: "bg-sun", sound: "boing" },
  { id: "lina", cardClass: "bg-bubblegum", sound: "pop" },
  { id: "bruno", cardClass: "bg-mint", sound: "squeak" },
  { id: "deco", cardClass: "bg-tangerine", sound: "whoosh" },
  { id: "mila", cardClass: "bg-plum-300", sound: "secret" },
];

const TEXT: Localized<Record<CharacterId, CharacterText>> = {
  "pt-BR": {
    "404": {
      name: "404",
      role: "O mascote",
      bio: "Tudo começou quando um técnico colou dois olhos numa TV quebrada para animar uma reunião. A ideia funcionou até demais. Hoje, o 404 apresenta a programação, vive perdendo o controle remoto e insiste que está tudo sob controle.",
      likes: "Chiado de fundo, plateia, fitas VHS",
      dislikes: "Ímãs. Muitos ímãs juntos, pior ainda.",
      catchphrase: "Não estou perdido. Estou explorando!",
      fact: "Pega três canais e meio. O meio só transmite chiado.",
    },
    lina: {
      name: "Lina",
      role: "A inventora",
      bio: "Usa óculos de proteção na testa desde os seis anos e tem uma caixa de ferramentas maior que ela. Construiu a engenhoca da Rua Sem Saída com peças de três bicicletas e uma geladeira.",
      likes: "Fita adesiva, parafusos tortos, planos B",
      dislikes: "Manuais de instruções",
      catchphrase: "Isso não é um defeito, é um recurso!",
      fact: "Desmontou o liquidificador da avó para fazer um ventilador turbo.",
    },
    bruno: {
      name: "Bruno",
      role: "O estrategista",
      bio: "Tem um caderno para tudo. Até para organizar os outros cadernos. Calcula trajetórias, prevê desastres e tenta impedir as ideias do Déco. Quase nunca consegue. A linha pontilhada da Rua Sem Saída? Foi ele quem desenhou.",
      likes: "Mapas, canetas de quatro cores, previsões corretas",
      dislikes: "Improviso",
      catchphrase: "Segundo meus cálculos... ah, deixa pra lá.",
      fact: "Calculou a velocidade exata de um tênis voando. Resultado: depende de quem chutou.",
    },
    deco: {
      name: "Déco",
      role: "O impulsivo",
      bio: "Primeiro age, depois pensa. E às vezes pula a segunda parte. Tem um curativo novo por semana e uma ideia genial por minuto. É ele quem puxa o elástico da engenhoca.",
      likes: "Coisas que explodem (de mentirinha), corrida, pudim",
      dislikes: "Esperar a contagem regressiva",
      catchphrase: "Vai dar certo! ...Provavelmente.",
      fact: "Já foi lançado pela própria engenhoca. Duas vezes.",
    },
    mila: {
      name: "Mila",
      role: "A estranha",
      bio: "Fala pouco, observa tudo e coleciona coisas que ninguém entende: pedras em formato de dente, sons de geladeira gravados e mapas de casas que não existem. Diz que a Casa Estranha piscou para ela.",
      likes: "Silêncio, neblina, sapos",
      dislikes: "Dias normais",
      catchphrase: "Isso é normal. Pra mim.",
      fact: "Segundo ela, o grampo em forma de olho que usa no cabelo enxerga sozinho.",
    },
  },
  en: {
    "404": {
      name: "404",
      role: "The mascot",
      bio: "It all started when a technician stuck two eyes on a broken TV to liven up a meeting. The idea worked a little too well. Now 404 hosts the lineup, keeps losing the remote and insists everything is under control.",
      likes: "Background static, a live audience, VHS tapes",
      dislikes: "Magnets. Lots of magnets together, even worse.",
      catchphrase: "I'm not lost. I'm exploring!",
      fact: "He gets three and a half channels. The half only shows static.",
    },
    lina: {
      name: "Lina",
      role: "The inventor",
      bio: "She has worn safety goggles on her forehead since she was six, and her toolbox is bigger than she is. She built the Dead End Street contraption out of parts from three bikes and a fridge.",
      likes: "Duct tape, bent screws, backup plans",
      dislikes: "Instruction manuals",
      catchphrase: "That's not a bug, it's a feature!",
      fact: "She took apart her grandma's blender to build a turbo fan.",
    },
    bruno: {
      name: "Bruno",
      role: "The strategist",
      bio: "He has a notebook for everything. Even one to keep the other notebooks organized. He calculates trajectories, predicts disasters and tries to stop Déco's ideas. He almost never manages. The dotted line in Dead End Street? He drew it.",
      likes: "Maps, four-color pens, correct predictions",
      dislikes: "Winging it",
      catchphrase: "According to my calculations... oh, never mind.",
      fact: "He worked out the exact speed of a flying sneaker. Result: it depends on who kicked it.",
    },
    deco: {
      name: "Déco",
      role: "The impulsive one",
      bio: "He acts first and thinks later. And sometimes he skips the second part. He gets a new bandage every week and a brilliant idea every minute. He's the one who pulls the contraption's rubber band.",
      likes: "Things that explode (pretend ones), racing, pudding",
      dislikes: "Waiting for the countdown",
      catchphrase: "It'll work! ...Probably.",
      fact: "He's been launched by his own contraption. Twice.",
    },
    mila: {
      name: "Mila",
      role: "The weird one",
      bio: "She says little, watches everything and collects things nobody understands: tooth-shaped rocks, recordings of fridge noises and maps of houses that don't exist. She says the Strange House winked at her.",
      likes: "Silence, fog, frogs",
      dislikes: "Normal days",
      catchphrase: "That's normal. For me.",
      fact: "According to her, the eye-shaped clip she wears in her hair can see on its own.",
    },
  },
};

function build(locale: Locale): Character[] {
  return BASE.map((base) => ({ ...base, ...TEXT[locale][base.id] }));
}

export const CHARACTERS: Localized<Character[]> = { "pt-BR": build("pt-BR"), en: build("en") };
