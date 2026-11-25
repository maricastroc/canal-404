import { localized } from "@/i18n/copy";

export const STICKER_IDS = ["marbles", "yoyo", "top", "bafo", "ball", "kite", "peteca", "hopscotch", "can-phone", "jacks", "hoop", "sticks", "rope", "domino", "pinwheel"] as const;

export type StickerId = (typeof STICKER_IDS)[number];

export const STICKER_NAMES = localized<Record<StickerId, string>>({
  "pt-BR": {
    marbles: "Bolinhas de gude",
    yoyo: "Ioiô",
    top: "Pião",
    bafo: "Bafo",
    ball: "Bola",
    kite: "Pipa",
    peteca: "Peteca",
    hopscotch: "Amarelinha",
    "can-phone": "Telefone de lata",
    jacks: "Cinco-marias",
    hoop: "Bambolê",
    sticks: "Pega-varetas",
    rope: "Corda",
    domino: "Dominó",
    pinwheel: "Cata-vento",
  },
  en: {
    marbles: "Marbles",
    yoyo: "Yo-yo",
    top: "Spinning top",
    bafo: "Flip cards",
    ball: "Ball",
    kite: "Kite",
    peteca: "Shuttlecock",
    hopscotch: "Hopscotch",
    "can-phone": "Tin can phone",
    jacks: "Jacks",
    hoop: "Hula hoop",
    sticks: "Pick-up sticks",
    rope: "Jump rope",
    domino: "Dominoes",
    pinwheel: "Pinwheel",
  },
});

export function stickerArt(id: StickerId) {
  return `/assets/operation-recess/stickers/${id}.svg`;
}
