import { localized, type Localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";
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

type TapeText = Omit<Tape, "id" | "sticker">;

const STICKERS: { id: TapeId; sticker: string }[] = [
  { id: "tape-cartoon", sticker: P.cream },
  { id: "tape-street", sticker: P.sky },
  { id: "tape-resort", sticker: P.lime },
  { id: "tape-karaoke", sticker: P.bubblegum },
  { id: "tape", sticker: P.tomato },
];

const EJECT = localized({
  "pt-BR": "Fita de volta na estante. Sem rebobinar, como manda a tradição.",
  en: "Tape back on the shelf. Not rewound, as tradition demands.",
});

const TEXT = localized<Record<TapeId, TapeText>>({
  "pt-BR": {
    "tape-cartoon": {
      label: "Desenhos 03",
      note: "gravado do canal",
      name: "Fita: Desenhos 03",
      insertLine: "Desenhos 03! O episódio em que eu peguei chiado. Gravei direto da TV em 2004.",
      ejectLine: EJECT["pt-BR"],
    },
    "tape-street": {
      label: "Rua S/ Saída",
      note: "comercial!!",
      name: "Fita: comercial da Rua Sem Saída",
      insertLine: "Um comercial de 2004! Naquela época tudo era NOVO e RADICAL.",
      ejectLine: EJECT["pt-BR"],
    },
    "tape-resort": {
      label: "Férias 2004",
      note: "não apagar!",
      name: "Fita: Férias 2004",
      insertLine: "Férias 2004... Quem filmou isso? Eu não lembro dessa viagem.",
      ejectLine: "Fita ejetada. Alguém viu a data mudar ali no canto?",
    },
    "tape-karaoke": {
      label: "Karaokê",
      note: "o 404 canta",
      name: "Fita: Karaokê do 404",
      insertLine: "Ah não, a fita do karaokê. Tá bom, eu canto. Só um pedacinho.",
      ejectLine: "Obrigado, obrigado. Autógrafos só amanhã.",
    },
    tape: {
      label: "Não assista",
      note: "",
      name: "Fita misteriosa no videocassete",
      insertLine: "Peraí... essa fita não!",
      ejectLine: "Fita ejetada. Vamos fingir que nada aconteceu.",
      torn: "Não assis",
    },
  },
  en: {
    "tape-cartoon": {
      label: "Cartoons 03",
      note: "taped off TV",
      name: "Tape: Cartoons 03",
      insertLine: "Cartoons 03! The episode where I caught static. I taped it right off the TV in 2004.",
      ejectLine: EJECT.en,
    },
    "tape-street": {
      label: "Dead End St.",
      note: "commercial!!",
      name: "Tape: Dead End Street commercial",
      insertLine: "A commercial from 2004! Back then everything was NEW and RADICAL.",
      ejectLine: EJECT.en,
    },
    "tape-resort": {
      label: "Vacation '04",
      note: "don't erase!",
      name: "Tape: Vacation 2004",
      insertLine: "Vacation 2004... Who filmed this? I don't remember this trip.",
      ejectLine: "Tape ejected. Did anyone see the date change in the corner?",
    },
    "tape-karaoke": {
      label: "Karaoke",
      note: "404 sings",
      name: "Tape: 404's Karaoke",
      insertLine: "Oh no, the karaoke tape. Fine, I'll sing. Just a little bit.",
      ejectLine: "Thank you, thank you. Autographs tomorrow.",
    },
    tape: {
      label: "Do not watch",
      note: "",
      name: "Mystery tape in the VCR",
      insertLine: "Wait... not that tape!",
      ejectLine: "Tape ejected. Let's pretend nothing happened.",
      torn: "Do not wat",
    },
  },
});

function build(locale: Locale): Tape[] {
  return STICKERS.map(({ id, sticker }) => ({ id, sticker, ...TEXT[locale][id] }));
}

export const TAPES: Localized<Tape[]> = { "pt-BR": build("pt-BR"), en: build("en") };

const BY_ID: Localized<Map<string, Tape>> = {
  "pt-BR": new Map(TAPES["pt-BR"].map((tape) => [tape.id, tape])),
  en: new Map(TAPES.en.map((tape) => [tape.id, tape])),
};

export function isTape(id: string): id is TapeId {
  return BY_ID["pt-BR"].has(id);
}

export function tapeById(id: TapeId, locale: Locale) {
  return BY_ID[locale].get(id)!;
}
