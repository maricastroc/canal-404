export const W = 1920;
export const H = 1080;
export const ROUND_MS = 75000;
export const LIVES = 3;
export const AMMO_MAX = 6;
export const RELOAD_MS = 260;
export const THROW_GAP_MS = 230;
export const INVULNERABLE_MS = 1200;

export const DECO = { x: 330, standY: 800, duckDrop: 250, face: { x: 342, y: 560 }, hand: { x: 440, y: 594 } };
export const MILA = { x: 590, y: 790, duckDrop: 170 };
export const OUR_TABLE = { x: 400, y: 756 };
export const AMMO_SPOTS = [104, 140, 176, 212, 248, 284].map((x) => ({ x, y: 772 }));
export const WALL_SPLAT = { x: 150, y: 590 };

export type Row = "back" | "front";

export type SlotDef = { key: number; row: Row; x: number; tableY: number; upY: number; scale: number; maskBottom: number };

export const SLOTS: SlotDef[] = [
  { key: 1, row: "back", x: 1020, tableY: 590, upY: 604, scale: 0.72, maskBottom: 702 },
  { key: 2, row: "front", x: 1180, tableY: 790, upY: 806, scale: 0.95, maskBottom: 944 },
  { key: 3, row: "back", x: 1370, tableY: 590, upY: 604, scale: 0.72, maskBottom: 702 },
  { key: 4, row: "front", x: 1600, tableY: 790, upY: 806, scale: 0.95, maskBottom: 944 },
  { key: 5, row: "back", x: 1720, tableY: 590, upY: 604, scale: 0.72, maskBottom: 702 },
];

export type RivalKind = "cap" | "speedy" | "big";

export type RivalDef = {
  kind: RivalKind;
  name: string;
  hp: number;
  points: number;
  size: number;
  windup: number;
  taunts: string[];
};

export const RIVALS: Record<RivalKind, RivalDef> = {
  cap: { kind: "cap", name: "Garoto do boné", hp: 1, points: 100, size: 1, windup: 1, taunts: ["Pega!", "Lá vai!", "Ha!"] },
  speedy: { kind: "speedy", name: "Pimentinha", hp: 1, points: 150, size: 0.9, windup: 0.7, taunts: ["Rápida!", "Hihi!", "Toma!"] },
  big: { kind: "big", name: "Grandão", hp: 2, points: 300, size: 1.14, windup: 1.2, taunts: ["Vem!", "Hmpf!", "Pudim duplo!"] },
};

export type Phase = {
  from: number;
  maxActive: number;
  windup: number;
  gap: [number, number];
  speedy: number;
  big: number;
  flight: number;
};

export const PHASES: Phase[] = [
  { from: 0, maxActive: 1, windup: 1350, gap: [900, 1500], speedy: 0, big: 0, flight: 1.0 },
  { from: 15000, maxActive: 2, windup: 1200, gap: [700, 1300], speedy: 0.25, big: 0, flight: 0.95 },
  { from: 35000, maxActive: 2, windup: 1050, gap: [550, 1100], speedy: 0.3, big: 0.15, flight: 0.9 },
  { from: 52000, maxActive: 3, windup: 950, gap: [450, 900], speedy: 0.35, big: 0.2, flight: 0.86 },
  { from: 65000, maxActive: 3, windup: 850, gap: [350, 700], speedy: 0.4, big: 0.2, flight: 0.8 },
];

export const LUNCH_LADY_TIMES = [30000];

export const EVENTS = { trayFrom: 19000, trayChance: 0.3, brawlAt: 43000, brawlMs: 6500, brawlers: 4 };

export const SCORE = {
  comboStep: 20,
  lifeBonus: 300,
  cleanBonus: 500,
  lunchLadyPenalty: 200,
  interruptBonus: 100,
  brawlMultiplier: 2,
  twoStars: 7500,
  threeStars: 11500,
};

export const FOODS = ["sandwich", "apple", "grapes", "banana"] as const;
