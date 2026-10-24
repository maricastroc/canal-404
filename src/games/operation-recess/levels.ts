export type Theme = "corridor" | "yard" | "office";
export type EnemyKind = "common" | "whistle" | "shield";

export type LevelDef = {
  id: string;
  title: string;
  goal: string;
  intro: string;
  win: string;
  theme: Theme;
  length: number;
  start: number;
  ground: [number, number][];
  blocks: { col: number; row: number; w: number; h: number; art: "bin" | "boxes" | "cabinet" }[];
  platforms: { col: number; row: number; w: number; art: "shelf" | "bench" | "bars" | "desk" }[];
  puddles: { col: number; w: number }[];
  enemies: { kind: EnemyKind; col: number; row?: number }[];
  items: { kind: "snack" | "sticker"; col: number; row: number }[];
  checkpoints: number[];
  balls?: { col: number; every: number; offset: number; wake: number }[];
  carts?: { from: number; to: number; speed: number }[];
  exit?: { col: number; label: string };
  boss?: { arena: number };
};

export const LEVELS: LevelDef[] = [
  {
    id: "corridor",
    title: "Corredor proibido",
    goal: "Passe pelos monitores.",
    intro: "O recreio foi cancelado! Atravesse o corredor.",
    win: "O corredor está livre.",
    theme: "corridor",
    length: 72,
    start: 2,
    ground: [[0, 71]],
    blocks: [
      { col: 9, row: 11, w: 1, h: 1, art: "bin" },
      { col: 30, row: 10, w: 2, h: 2, art: "boxes" },
      { col: 58, row: 11, w: 1, h: 1, art: "bin" },
      { col: 61, row: 10, w: 2, h: 2, art: "boxes" },
    ],
    platforms: [
      { col: 13, row: 9, w: 3, art: "shelf" },
      { col: 17, row: 7, w: 3, art: "shelf" },
      { col: 46, row: 9, w: 3, art: "shelf" },
      { col: 50, row: 7, w: 3, art: "shelf" },
    ],
    puddles: [
      { col: 24, w: 4 },
      { col: 46, w: 7 },
    ],
    enemies: [
      { kind: "common", col: 21 },
      { kind: "common", col: 36 },
      { kind: "common", col: 40 },
      { kind: "common", col: 54 },
      { kind: "common", col: 65 },
      { kind: "common", col: 68 },
    ],
    items: [
      { kind: "sticker", col: 14, row: 8 },
      { kind: "sticker", col: 18, row: 6 },
      { kind: "sticker", col: 31, row: 9 },
      { kind: "snack", col: 43, row: 11 },
      { kind: "sticker", col: 51, row: 6 },
    ],
    checkpoints: [44],
    exit: { col: 70, label: "PÁTIO" },
  },
  {
    id: "yard",
    title: "Pátio ocupado",
    goal: "Atravesse o pátio.",
    intro: "Cuidado com os monitores de apito. Pule as ondas!",
    win: "O pátio é das crianças de novo.",
    theme: "yard",
    length: 80,
    start: 2,
    ground: [[0, 79]],
    blocks: [{ col: 42, row: 10, w: 2, h: 2, art: "boxes" }],
    platforms: [
      { col: 9, row: 10, w: 3, art: "bench" },
      { col: 20, row: 9, w: 3, art: "bars" },
      { col: 24, row: 7, w: 3, art: "bars" },
      { col: 28, row: 9, w: 3, art: "bars" },
      { col: 47, row: 10, w: 3, art: "bench" },
      { col: 56, row: 9, w: 3, art: "bars" },
      { col: 60, row: 7, w: 4, art: "bars" },
      { col: 66, row: 10, w: 3, art: "bench" },
    ],
    puddles: [],
    enemies: [
      { kind: "whistle", col: 16 },
      { kind: "whistle", col: 25, row: 6 },
      { kind: "common", col: 33 },
      { kind: "common", col: 37 },
      { kind: "whistle", col: 45 },
      { kind: "common", col: 53 },
      { kind: "whistle", col: 61, row: 6 },
      { kind: "common", col: 70 },
      { kind: "whistle", col: 75 },
    ],
    items: [
      { kind: "sticker", col: 10, row: 9 },
      { kind: "sticker", col: 21, row: 8 },
      { kind: "sticker", col: 25, row: 5 },
      { kind: "snack", col: 48, row: 9 },
      { kind: "sticker", col: 62, row: 5 },
      { kind: "snack", col: 67, row: 9 },
    ],
    checkpoints: [50],
    balls: [{ col: 41, every: 2600, offset: 400, wake: 1200 }],
    exit: { col: 78, label: "DIREÇÃO" },
  },
  {
    id: "office",
    title: "Caminho da direção",
    goal: "Chegue à direção.",
    intro: "Última parada: a sala do Inspetor do Silêncio.",
    win: "O recreio está de volta!",
    theme: "office",
    length: 88,
    start: 2,
    ground: [
      [0, 17],
      [24, 33],
      [40, 87],
    ],
    blocks: [
      { col: 29, row: 10, w: 1, h: 2, art: "cabinet" },
      { col: 57, row: 10, w: 2, h: 2, art: "boxes" },
    ],
    platforms: [
      { col: 7, row: 10, w: 3, art: "desk" },
      { col: 12, row: 8, w: 3, art: "desk" },
      { col: 44, row: 10, w: 3, art: "desk" },
      { col: 49, row: 8, w: 3, art: "desk" },
      { col: 53, row: 10, w: 3, art: "desk" },
    ],
    puddles: [],
    enemies: [
      { kind: "shield", col: 10 },
      { kind: "common", col: 15 },
      { kind: "common", col: 27 },
      { kind: "shield", col: 31 },
      { kind: "common", col: 43 },
      { kind: "shield", col: 47 },
      { kind: "whistle", col: 50, row: 7 },
      { kind: "common", col: 56 },
      { kind: "shield", col: 61 },
    ],
    items: [
      { kind: "sticker", col: 13, row: 7 },
      { kind: "snack", col: 25, row: 11 },
      { kind: "sticker", col: 45, row: 9 },
      { kind: "snack", col: 41, row: 11 },
      { kind: "snack", col: 62, row: 11 },
    ],
    checkpoints: [26, 63],
    carts: [
      { from: 18, to: 21, speed: 170 },
      { from: 34, to: 37, speed: 190 },
    ],
    boss: { arena: 64 },
  },
];
