export const W = 1920;
export const H = 1080;
export const ROUND_MS = 75000;
export const COUNTDOWN_MS = 1300;
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
export const TABLE_PROPS = { y: 772, holder: { x: 456, scale: 0.9 }, napkins: [440, 456, 472], plates: { x: 690, scale: 0.8 }, juice: { x: 714, scale: 0.8 } };
export const MENU_BOARD = { titleX: 1180, titleY: 141, specialX: 1076, specialY: 202, left: 1030, right: 1336, rowY: 246, rowGap: 34 };

export type Row = "back" | "front";

export type SlotDef = { key: number; row: Row; x: number; portraitX: number; tableY: number; upY: number; scale: number; maskBottom: number };

export const SLOTS: SlotDef[] = [
  { key: 1, row: "back", x: 1020, portraitX: 170, tableY: 590, upY: 604, scale: 0.72, maskBottom: 693 },
  { key: 2, row: "front", x: 1180, portraitX: 285, tableY: 790, upY: 806, scale: 0.95, maskBottom: 930 },
  { key: 3, row: "back", x: 1370, portraitX: 470, tableY: 590, upY: 604, scale: 0.72, maskBottom: 693 },
  { key: 4, row: "front", x: 1600, portraitX: 655, tableY: 790, upY: 806, scale: 0.95, maskBottom: 930 },
  { key: 5, row: "back", x: 1720, portraitX: 770, tableY: 590, upY: 604, scale: 0.72, maskBottom: 693 },
];

export type RivalKind = "cap" | "speedy" | "big";

export const RIVAL_KINDS: RivalKind[] = ["cap", "speedy", "big"];
export const RIVAL_LOOKS = [1, 2, 3, 4];

export type RivalDef = {
  kind: RivalKind;
  name: string;
  hp: number;
  points: number;
  size: number;
  windup: number;
};

export const RIVALS: Record<RivalKind, RivalDef> = {
  cap: { kind: "cap", name: "Garoto do boné", hp: 1, points: 100, size: 1, windup: 1 },
  speedy: { kind: "speedy", name: "Pimentinha", hp: 1, points: 150, size: 0.9, windup: 0.7 },
  big: { kind: "big", name: "Grandão", hp: 2, points: 300, size: 1.14, windup: 1.2 },
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
  { from: 0, maxActive: 2, windup: 1300, gap: [800, 1300], speedy: 0, big: 0, flight: 1.0 },
  { from: 12000, maxActive: 2, windup: 1150, gap: [600, 1100], speedy: 0.3, big: 0, flight: 0.95 },
  { from: 28000, maxActive: 3, windup: 1000, gap: [500, 950], speedy: 0.3, big: 0.15, flight: 0.9 },
  { from: 52000, maxActive: 3, windup: 900, gap: [400, 800], speedy: 0.35, big: 0.2, flight: 0.85 },
  { from: 63000, maxActive: 4, windup: 820, gap: [320, 650], speedy: 0.4, big: 0.25, flight: 0.8 },
];

export const LUNCH_LADY = { times: [7000, 17000, 27500, 60000, 70000], speed: 0.27, minGap: 1200, stopMs: 1300, enterX: 2080, exitX: -180, y: 712, scale: 0.68, stride: 26 };

export const COOK = { times: [23000, 37500, 65000], warnMs: 1800, take: 3, grabMs: 1300, enterX: -170, standX: 140, exitX: -200, enterSpeed: 0.32, exitSpeed: 0.38, y: 846, scale: 0.88 };

export const EVENTS = { trayFrom: 19000, trayChance: 0.3, brawlAt: 43000, brawlMs: 6500, brawlers: 4, strayChance: 0.22, strayWindup: 750 };

export const SCORE = {
  bigHurt: 50,
  comboStep: 20,
  lifeBonus: 300,
  cleanBonus: 500,
  lunchLadyPenalty: 200,
  interruptBonus: 100,
  brawlMultiplier: 2,
  twoStars: 7500,
  threeStars: 11500,
};

export const CATCH = { from: 0.68, radius: 100, whiffMs: 400, lessonScale: 0.25, lessonRounds: 3 };

export const IMPACT = { interrupt: 70, big: 80, catch: 60 };

export const FOOD_BAG = ["sandwich", "sandwich", "apple", "grapes", "banana"] as const;

export const FOOD_EFFECTS = { slipMs: 1200, splashMs: 900, recoverMs: [150, 350] as [number, number] };
