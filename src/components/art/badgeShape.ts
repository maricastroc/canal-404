import { P } from "@/lib/palette";

export const BADGE_ROSETTE = "M32 3 L39 13 L51 9 L51 21 L62 27 L54 36 L58 48 L46 49 L40 60 L32 52 L24 60 L18 49 L6 48 L10 36 L2 27 L13 21 L13 9 L25 13 Z";

export const BADGE_STAR = "M32 20 L35.3 27.6 L43.5 28.2 L37.2 33.5 L39.2 41.6 L32 37.2 L24.8 41.6 L26.8 33.5 L20.5 28.2 L28.7 27.6 Z";

export const BADGE_TONES = {
  sun: [P.sun, P.sunDeep],
  mint: [P.mint, P.mintDeep],
  bubblegum: [P.bubblegum, P.bubblegumDeep],
  tangerine: [P.tangerine, P.tangerineDeep],
  sky: [P.sky, P.skyDeep],
  plum: [P.plum300, P.plum500],
  steel: [P.steel, P.steelDeep],
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;
