export type React = "wobble" | "swing" | "bounce" | "roll" | "tip" | "flap" | "cat" | "billow";

export type PropDef = {
  key: string;
  x: number;
  y: number;
  layer: "wall" | "floor" | "sort";
  scale?: number;
  flip?: boolean;
  angle?: number;
  origin?: [number, number];
  block?: { w: number; h: number; dy?: number; tall?: boolean };
  react?: React;
  depth?: number;
  glow?: { dx: number; dy: number; r: number; color: number; alpha?: number };
};

export type ArenaDef = {
  id: string;
  title: string;
  goal: string;
  theme: "bedroom" | "living" | "yard";
  wallBottom: number;
  bounds: { x0: number; y0: number; x1: number; y1: number };
  spawns: [number, number][];
  props: PropDef[];
  floorPillows: [number, number, number, number][];
  ai: number;
  lights: { y: number; sag: number; from: number; to: number; segments: number }[];
  cat?: [number, number, number][];
  cushions?: { key: string; x: number; y: number; angle: number }[];
  fireflies?: number;
};

const WARM = 0xffc46b;

export const ARENAS: ArenaDef[] = [
  {
    id: "bedroom",
    title: "Quarto",
    goal: "Aprenda a mirar e desviar.",
    theme: "bedroom",
    wallBottom: 350,
    bounds: { x0: 130, y0: 440, x1: 1790, y1: 1020 },
    spawns: [
      [960, 900],
      [560, 640],
      [1360, 640],
    ],
    ai: 0.3,
    lights: [{ y: 128, sag: 46, from: 110, to: 1810, segments: 5 }],
    props: [
      { key: "poster-rocket", x: 610, y: 320, layer: "wall", scale: 0.92, react: "flap" },
      { key: "window-night", x: 930, y: 338, layer: "wall", scale: 0.86, glow: { dx: 0, dy: -120, r: 260, color: 0x8fa8ff, alpha: 0.18 } },
      { key: "wall-shelf", x: 1250, y: 290, layer: "wall", scale: 0.9 },
      { key: "rug-round", x: 960, y: 760, layer: "floor", scale: 1.3, origin: [0.5, 0.5] },
      { key: "books", x: 210, y: 690, layer: "floor", scale: 0.8 },
      { key: "slippers", x: 1170, y: 1012, layer: "floor", scale: 0.8 },
      { key: "blocks", x: 1500, y: 740, layer: "sort", scale: 0.75, react: "bounce" },
      { key: "bed-pink", x: 330, y: 590, layer: "sort", scale: 0.92, block: { w: 300, h: 190, dy: -6 } },
      { key: "bed-blue", x: 1590, y: 590, layer: "sort", scale: 0.92, block: { w: 300, h: 190, dy: -6 } },
      { key: "nightstand", x: 1340, y: 452, layer: "sort", scale: 0.9, block: { w: 120, h: 40 } },
      { key: "lamp", x: 1360, y: 344, layer: "sort", scale: 0.78, react: "wobble", glow: { dx: 0, dy: -70, r: 300, color: WARM, alpha: 0.32 } },
      { key: "boombox", x: 800, y: 452, layer: "sort", scale: 0.78, react: "bounce" },
      { key: "teddy", x: 1060, y: 470, layer: "sort", scale: 0.85, react: "tip" },
      { key: "ball", x: 700, y: 560, layer: "sort", scale: 0.8, react: "roll" },
      { key: "toy-chest", x: 300, y: 960, layer: "sort", scale: 0.82, block: { w: 170, h: 56 }, react: "bounce" },
      { key: "beanbag", x: 1650, y: 950, layer: "sort", scale: 0.86, block: { w: 160, h: 56 }, react: "bounce" },
    ],
    floorPillows: [
      [470, 820, 0xffd2e6, -14],
      [1430, 880, 0xd9f7e2, 12],
      [690, 1000, 0xe6ddff, 6],
      [1720, 700, 0xfff3b0, -8],
    ],
  },
  {
    id: "living",
    title: "Sala de estar",
    goal: "Use os móveis para se proteger.",
    theme: "living",
    wallBottom: 350,
    bounds: { x0: 130, y0: 440, x1: 1790, y1: 1020 },
    spawns: [
      [960, 990],
      [470, 620],
      [1450, 620],
    ],
    ai: 0.45,
    lights: [],
    props: [
      { key: "window-city", x: 600, y: 336, layer: "wall", scale: 0.84, glow: { dx: 0, dy: -120, r: 250, color: 0x8fa8ff, alpha: 0.16 } },
      { key: "frame-family", x: 320, y: 290, layer: "wall", scale: 0.74, react: "flap" },
      { key: "frame-boat", x: 1250, y: 270, layer: "wall", scale: 0.7, react: "flap" },
      { key: "rug-living", x: 960, y: 790, layer: "floor", scale: 1.25, origin: [0.5, 0.5] },
      { key: "slippers", x: 720, y: 1012, layer: "floor", scale: 0.8 },
      { key: "bookshelf", x: 1650, y: 470, layer: "sort", scale: 0.9, block: { w: 230, h: 36 } },
      { key: "tv", x: 330, y: 525, layer: "sort", scale: 0.92, block: { w: 250, h: 70, tall: true }, react: "bounce" },
      { key: "floor-lamp", x: 1420, y: 470, layer: "sort", scale: 0.9, react: "wobble", glow: { dx: 0, dy: -270, r: 320, color: WARM, alpha: 0.34 } },
      { key: "sofa", x: 960, y: 664, layer: "sort", scale: 0.95, block: { w: 440, h: 120, dy: -8, tall: true } },
      { key: "coffee-table", x: 960, y: 920, layer: "sort", scale: 0.82, block: { w: 260, h: 50 }, react: "bounce" },
      { key: "armchair", x: 380, y: 880, layer: "sort", scale: 0.84, block: { w: 180, h: 60, tall: true } },
      { key: "armchair", x: 1540, y: 880, layer: "sort", scale: 0.84, flip: true, block: { w: 180, h: 60, tall: true } },
      { key: "plant-big", x: 200, y: 660, layer: "sort", scale: 0.85, react: "wobble", block: { w: 90, h: 34, tall: true } },
      { key: "plant-big", x: 1760, y: 720, layer: "sort", scale: 0.85, flip: true, react: "wobble", block: { w: 90, h: 34, tall: true } },
    ],
    floorPillows: [
      [600, 760, 0xffd2e6, -12],
      [1340, 1000, 0xd9f7e2, 10],
      [1240, 520, 0xe6ddff, 4],
    ],
    cat: [
      [1080, 596, 667],
      [1660, 512, 0],
      [600, 470, 0],
    ],
    cushions: [
      { key: "cushion-a", x: 820, y: 590, angle: -10 },
      { key: "cushion-b", x: 905, y: 588, angle: 8 },
    ],
  },
  {
    id: "yard",
    title: "Quintal",
    goal: "A guerra vai lá para fora.",
    theme: "yard",
    wallBottom: 330,
    bounds: { x0: 120, y0: 440, x1: 1800, y1: 1020 },
    spawns: [
      [960, 960],
      [520, 720],
      [1400, 720],
    ],
    ai: 0.62,
    lights: [{ y: 150, sag: 70, from: 440, to: 1560, segments: 3 }],
    fireflies: 18,
    props: [
      { key: "moon", x: 1380, y: 214, layer: "wall", scale: 0.8, origin: [0.5, 0.5], glow: { dx: 0, dy: 0, r: 220, color: 0xfff2b0, alpha: 0.22 } },
      { key: "bush", x: 200, y: 430, layer: "wall", scale: 1.05 },
      { key: "bush", x: 1730, y: 430, layer: "wall", scale: 1.0, flip: true },
      { key: "picnic", x: 960, y: 820, layer: "floor", scale: 1.15, origin: [0.5, 0.5] },
      { key: "tree", x: 330, y: 610, layer: "sort", scale: 1, block: { w: 70, h: 36, tall: true } },
      { key: "tire-swing", x: 415, y: 335, layer: "sort", scale: 0.9, react: "swing", depth: 611 },
      { key: "tent", x: 960, y: 570, layer: "sort", scale: 1, react: "billow", block: { w: 330, h: 100, tall: true }, glow: { dx: 0, dy: -100, r: 230, color: WARM, alpha: 0.4 } },
      { key: "screen", x: 1570, y: 540, layer: "sort", scale: 0.85, react: "wobble", block: { w: 150, h: 30 }, glow: { dx: 0, dy: -210, r: 240, color: 0x9fd4ff, alpha: 0.24 } },
      { key: "grill", x: 1520, y: 900, layer: "sort", scale: 0.85, react: "wobble", block: { w: 110, h: 40, tall: true } },
      { key: "cooler", x: 640, y: 960, layer: "sort", scale: 0.8, react: "bounce", block: { w: 120, h: 40 } },
      { key: "stump", x: 1250, y: 990, layer: "sort", scale: 0.8, block: { w: 100, h: 34 } },
      { key: "stump", x: 1700, y: 640, layer: "sort", scale: 0.72, block: { w: 90, h: 30 } },
      { key: "gnome", x: 240, y: 930, layer: "sort", scale: 0.9, react: "tip" },
      { key: "lantern", x: 640, y: 480, layer: "sort", scale: 0.8, react: "wobble", glow: { dx: 0, dy: -40, r: 120, color: WARM, alpha: 0.4 } },
      { key: "lantern", x: 1300, y: 480, layer: "sort", scale: 0.8, react: "wobble", glow: { dx: 0, dy: -40, r: 120, color: WARM, alpha: 0.4 } },
      { key: "lantern", x: 190, y: 720, layer: "sort", scale: 0.8, react: "wobble", glow: { dx: 0, dy: -40, r: 120, color: WARM, alpha: 0.4 } },
      { key: "lantern", x: 1790, y: 990, layer: "sort", scale: 0.8, react: "wobble", glow: { dx: 0, dy: -40, r: 120, color: WARM, alpha: 0.4 } },
    ],
    floorPillows: [
      [780, 700, 0xffd2e6, -12],
      [1160, 700, 0xfff3b0, 8],
      [430, 1000, 0xd9f7e2, -4],
    ],
  },
];
