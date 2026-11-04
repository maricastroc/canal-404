import { P } from "@/lib/palette";

export type TapeId = "tape-cartoon" | "tape-street" | "tape-resort" | "tape-karaoke" | "tape";

export type Tape = {
  id: TapeId;
  label: string;
  note: string;
  name: string;
  sticker: string;
  insertLine: string;
  ejectLine: string;
  torn?: string;
};

const EJECT = "Fita de volta na estante. Sem rebobinar, como manda a tradição.";

export const TAPES: Tape[] = [
  {
    id: "tape-cartoon",
    label: "Desenhos 03",
    note: "gravado do canal",
    name: "Fita: Desenhos 03",
    sticker: P.cream,
    insertLine: "Desenhos 03! O episódio em que eu peguei chiado. Gravei direto da TV em 2004.",
    ejectLine: EJECT,
  },
  {
    id: "tape-street",
    label: "Rua S/ Saída",
    note: "comercial!!",
    name: "Fita: comercial da Rua Sem Saída",
    sticker: P.sky,
    insertLine: "Um comercial de 2004! Naquela época tudo era NOVO e RADICAL.",
    ejectLine: EJECT,
  },
  {
    id: "tape-resort",
    label: "Férias 2004",
    note: "não apagar!",
    name: "Fita: Férias 2004",
    sticker: P.lime,
    insertLine: "Férias 2004... Quem filmou isso? Eu não lembro dessa viagem.",
    ejectLine: "Fita ejetada. Alguém viu a data mudar ali no canto?",
  },
  {
    id: "tape-karaoke",
    label: "Karaokê",
    note: "o 404 canta",
    name: "Fita: Karaokê do 404",
    sticker: P.bubblegum,
    insertLine: "Ah não, a fita do karaokê. Tá bom, eu canto. Só um pedacinho.",
    ejectLine: "Obrigado, obrigado. Autógrafos só amanhã.",
  },
  {
    id: "tape",
    label: "Não assista",
    note: "",
    name: "Fita misteriosa no videocassete",
    sticker: P.tomato,
    insertLine: "Peraí... essa fita não!",
    ejectLine: "Fita ejetada. Vamos fingir que nada aconteceu.",
    torn: "Não assis",
  },
];

const BY_ID = new Map<string, Tape>(TAPES.map((tape) => [tape.id, tape]));

export function isTape(id: string): id is TapeId {
  return BY_ID.has(id);
}

export function tapeById(id: TapeId) {
  return BY_ID.get(id)!;
}
