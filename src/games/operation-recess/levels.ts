import type { StickerId } from "./album";

export type Theme = "corridor" | "yard" | "library" | "office";
export type EnemyKind = "common" | "whistle" | "shield";
export type EnemyStyle = "patrol" | "rush" | "guard" | "mixed";

export type LevelDef = {
  id: string;
  theme: Theme;
  length: number;
  start: number;
  ground: [number, number][];
  blocks: { col: number; row: number; w: number; h: number; art: "bin" | "boxes" | "cabinet" }[];
  platforms: { col: number; row: number; w: number; art: "shelf" | "bench" | "bars" | "desk" | "books"; wobbly?: boolean }[];
  puddles: { col: number; w: number }[];
  enemies: { kind: EnemyKind; col: number; row?: number; style?: EnemyStyle; orders?: boolean }[];
  items: ({ kind: "snack"; col: number; row: number } | { kind: "sticker"; col: number; row: number; id: StickerId })[];
  checkpoints: number[];
  balls?: { col: number; every: number; offset: number; wake: number }[];
  carts?: { from: number; to: number; speed: number }[];
  exit?: { col: number; label: string };
  boss?: { arena: number };
  lockers?: number[];
  watchers?: { col: number; look: number }[];
  ropes?: { col: number; w: number; period: number }[];
  pads?: number[];
  lights?: { col: number; span: number; period: number }[];
  towers?: number[];
};

export const LEVELS: LevelDef[] = [
  {
    id: "corridor",
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
      { col: 54, w: 4 },
    ],
    enemies: [
      { kind: "common", col: 21, style: "guard" },
      { kind: "common", col: 38 },
      { kind: "common", col: 41, style: "rush" },
      { kind: "common", col: 56 },
      { kind: "common", col: 64, style: "guard" },
      { kind: "common", col: 68, style: "rush" },
    ],
    items: [
      { kind: "sticker", col: 14, row: 8, id: "marbles" },
      { kind: "sticker", col: 18, row: 6, id: "yoyo" },
      { kind: "sticker", col: 31, row: 9, id: "top" },
      { kind: "snack", col: 43, row: 11 },
      { kind: "sticker", col: 51, row: 6, id: "bafo" },
    ],
    checkpoints: [44],
    exit: { col: 70, label: "PÁTIO" },
    lockers: [34, 60],
    watchers: [{ col: 48, look: 1500 }],
  },
  {
    id: "yard",
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
      { kind: "whistle", col: 19 },
      { kind: "whistle", col: 25, row: 6 },
      { kind: "common", col: 33 },
      { kind: "common", col: 37, style: "rush" },
      { kind: "whistle", col: 45, style: "mixed" },
      { kind: "common", col: 55, style: "guard" },
      { kind: "whistle", col: 61, row: 6 },
      { kind: "common", col: 70, style: "rush" },
      { kind: "whistle", col: 75, style: "mixed" },
    ],
    items: [
      { kind: "sticker", col: 10, row: 9, id: "ball" },
      { kind: "sticker", col: 21, row: 8, id: "kite" },
      { kind: "sticker", col: 25, row: 5, id: "peteca" },
      { kind: "snack", col: 48, row: 9 },
      { kind: "sticker", col: 51, row: 3, id: "hopscotch" },
      { kind: "snack", col: 67, row: 9 },
    ],
    checkpoints: [50],
    balls: [{ col: 41, every: 2600, offset: 400, wake: 1200 }],
    exit: { col: 78, label: "BIBLIOTECA" },
    ropes: [{ col: 13, w: 4, period: 1400 }],
    pads: [52],
  },
  {
    id: "library",
    theme: "library",
    length: 86,
    start: 2,
    ground: [
      [0, 21],
      [28, 47],
      [54, 85],
    ],
    blocks: [],
    platforms: [
      { col: 9, row: 10, w: 3, art: "books" },
      { col: 74, row: 10, w: 3, art: "books" },
      { col: 24, row: 10, w: 3, art: "books", wobbly: true },
      { col: 29, row: 9, w: 3, art: "books" },
      { col: 66, row: 7, w: 3, art: "books" },
    ],
    puddles: [],
    enemies: [
      { kind: "common", col: 12, style: "guard" },
      { kind: "common", col: 16, style: "rush" },
      { kind: "shield", col: 43 },
      { kind: "common", col: 46, style: "guard" },
      { kind: "whistle", col: 57, style: "mixed" },
      { kind: "common", col: 60, style: "rush" },
      { kind: "shield", col: 71 },
      { kind: "common", col: 79, style: "guard" },
    ],
    items: [
      { kind: "sticker", col: 10, row: 9, id: "can-phone" },
      { kind: "sticker", col: 30, row: 8, id: "jacks" },
      { kind: "snack", col: 38, row: 11 },
      { kind: "sticker", col: 41, row: 11, id: "hoop" },
      { kind: "sticker", col: 50, row: 8, id: "sticks" },
      { kind: "snack", col: 63, row: 11 },
      { kind: "sticker", col: 67, row: 5, id: "rope" },
    ],
    checkpoints: [37, 62],
    carts: [{ from: 48, to: 51, speed: 180 }],
    exit: { col: 84, label: "DIREÇÃO" },
    lockers: [6],
    watchers: [{ col: 33, look: 1400 }],
    pads: [65],
    lights: [{ col: 42, span: 3, period: 2600 }],
    towers: [39.5, 69.5],
  },
  {
    id: "office",
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
      { col: 21, row: 10, w: 2, art: "desk", wobbly: true },
      { col: 37, row: 10, w: 2, art: "desk", wobbly: true },
      { col: 44, row: 10, w: 3, art: "desk" },
      { col: 49, row: 8, w: 3, art: "desk" },
      { col: 53, row: 10, w: 3, art: "desk" },
    ],
    puddles: [],
    enemies: [
      { kind: "shield", col: 10, orders: true },
      { kind: "common", col: 15, style: "rush" },
      { kind: "common", col: 27, style: "guard" },
      { kind: "shield", col: 31, orders: true },
      { kind: "common", col: 43 },
      { kind: "shield", col: 47, orders: true },
      { kind: "whistle", col: 51, style: "mixed" },
      { kind: "common", col: 56 },
      { kind: "shield", col: 61, orders: true },
    ],
    items: [
      { kind: "sticker", col: 13, row: 7, id: "domino" },
      { kind: "snack", col: 25, row: 11 },
      { kind: "sticker", col: 45, row: 9, id: "pinwheel" },
      { kind: "snack", col: 41, row: 11 },
      { kind: "snack", col: 62, row: 11 },
    ],
    checkpoints: [26, 63],
    carts: [
      { from: 18, to: 21, speed: 170 },
      { from: 34, to: 37, speed: 190 },
    ],
    boss: { arena: 64 },
    lights: [
      { col: 6, span: 2, period: 2800 },
      { col: 53, span: 4, period: 3000 },
    ],
  },
];
