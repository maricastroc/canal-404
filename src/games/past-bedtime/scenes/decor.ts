import type * as Phaser from "phaser";
import { box, NIGHT, rect } from "./house";
import type { Layout } from "./layout";

type Item = { kind: string; x: number; y: number; w?: number; h?: number; v?: string | number };

export type LightDef =
  | { kind: "glow"; x: number; y: number; r: number; color: number; strength: number; flicker?: boolean }
  | { kind: "shaft"; top: [number, number, number]; bottom: [number, number, number]; color: number; strength: number }
  | { kind: "crack"; x: number; y: number; w: number; color: number };

export type LampDef = { owner: string; x: number; y: number };

export type Decor = { wall: Item[]; floor: Item[]; top: Item[]; lights: LightDef[]; lamps: LampDef[]; darkness: number };

const WARM = 0xffc86b;
const MOON = 0xbcd4ff;
const TV = 0x7ff5e0;

const DECOR: Record<string, Decor> = {
  doorway: {
    darkness: 0.56,
    wall: [
      { kind: "door", x: 1.06, y: 1.16, w: 0.88, h: 1.7, v: "bruno" },
      { kind: "frame", x: 1.25, y: 0.3, w: 0.5, h: 0.6, v: 2 },
      { kind: "frame", x: 2.1, y: 0.32, w: 0.8, h: 0.75, v: 0 },
      { kind: "switch", x: 2.75, y: 1.5 },
      { kind: "window", x: 3.55, y: 0.26, w: 1.9, h: 0.52 },
      { kind: "lamp", x: 3.3, y: 0.42 },
      { kind: "doorLeaf", x: 6.06, y: 1.16, w: 0.86, h: 1.7 },
      { kind: "frame", x: 6.2, y: 0.3, w: 0.6, h: 0.55, v: 1 },
      { kind: "frame", x: 7.15, y: 0.36, w: 0.7, h: 0.5, v: 3 },
      { kind: "hooks", x: 7.08, y: 1.2, w: 0.84, h: 1.6 },
      { kind: "jamb", x: 2.9, y: 1.0, h: 1.86 },
      { kind: "jamb", x: 6.0, y: 1.0, h: 1.86 },
      { kind: "alarmClock", x: 5.42, y: 0.7 },
      { kind: "outlet", x: 2.55, y: 2.62 },
    ],
    floor: [
      { kind: "runner", x: 1.08, y: 3.14, w: 1.84, h: 0.72, v: 0x3f7a8c },
      { kind: "slippers", x: 3.36, y: 2.2 },
    ],
    top: [],
    lights: [
      { kind: "shaft", top: [3.6, 5.4, 0.78], bottom: [3.9, 6.1, 2.95], color: MOON, strength: 0.5 },
      { kind: "crack", x: 1.12, y: 3.02, w: 0.76, color: WARM },
      { kind: "glow", x: 1.5, y: 3.2, r: 0.9, color: WARM, strength: 0.35 },
      { kind: "glow", x: 7.6, y: 3.5, r: 1.4, color: MOON, strength: 0.35 },
    ],
    lamps: [{ owner: "dad", x: 3.3, y: 0.58 }],
  },
  hallway: {
    darkness: 0.58,
    wall: [
      { kind: "door", x: 1.06, y: 2.16, w: 0.88, h: 1.7, v: "bruno" },
      { kind: "frame", x: 1.2, y: 1.3, w: 0.6, h: 0.65, v: 2 },
      { kind: "frame", x: 2.1, y: 1.3, w: 0.8, h: 0.9, v: 0 },
      { kind: "frame", x: 3.08, y: 1.45, w: 0.6, h: 0.55, v: 1 },
      { kind: "frame", x: 3.05, y: 2.2, w: 0.7, h: 0.55, v: 3 },
      { kind: "switch", x: 4.3, y: 3.4 },
      { kind: "window", x: 5.3, y: 0.26, w: 1.4, h: 0.52 },
      { kind: "lamp", x: 5.25, y: 0.42 },
      { kind: "jamb", x: 4.9, y: 3.0, h: 0.86 },
      { kind: "jamb", x: 8.0, y: 3.0, h: 0.86 },
      { kind: "frame", x: 8.2, y: 3.15, w: 0.6, h: 0.5, v: 2 },
      { kind: "console", x: 9.04, y: 2.9, w: 0.92, h: 0.96 },
      { kind: "frame", x: 9.2, y: 1.35, w: 0.6, h: 0.75, v: 1 },
      { kind: "door", x: 10.06, y: 2.16, w: 0.88, h: 1.7, v: "plain" },
      { kind: "window", x: 11.1, y: 1.3, w: 1.6, h: 1.0 },
      { kind: "railing", x: 12.0, y: 2.9, w: 1.0, h: 0.96 },
      { kind: "toyShelf", x: 2.12, y: 2.74 },
      { kind: "growthChart", x: 2.08, y: 2.32 },
      { kind: "kidDrawing", x: 3.12, y: 2.92, w: 0.56, h: 0.48 },
      { kind: "mouseHole", x: 3.55, y: 3.99 },
      { kind: "sconce", x: 3.55, y: 1.25 },
      { kind: "sconce", x: 9.95, y: 1.3 },
      { kind: "outlet", x: 8.5, y: 3.62 },
      { kind: "basket", x: 11.45, y: 3.6 },
    ],
    floor: [
      { kind: "rug", x: 1.12, y: 4.14, w: 1.76, h: 2.72, v: 0x4f7f8f },
      { kind: "rug", x: 9.12, y: 4.14, w: 1.76, h: 2.72, v: 0x9a6a72 },
      { kind: "sock", x: 2.62, y: 6.58 },
      { kind: "comic", x: 9.5, y: 6.4 },
    ],
    top: [],
    lights: [
      { kind: "shaft", top: [5.3, 6.7, 0.78], bottom: [5.7, 7.6, 3.95], color: MOON, strength: 0.45 },
      { kind: "shaft", top: [11.1, 12.7, 2.3], bottom: [11.6, 13.2, 6.95], color: MOON, strength: 0.5 },
      { kind: "crack", x: 1.12, y: 4.02, w: 0.76, color: WARM },
      { kind: "glow", x: 1.5, y: 4.25, r: 0.9, color: WARM, strength: 0.3 },
      { kind: "crack", x: 10.12, y: 4.02, w: 0.76, color: 0xfff0b0 },
      { kind: "glow", x: 10.5, y: 4.35, r: 1.1, color: 0xfff0b0, strength: 0.42 },
      { kind: "glow", x: 12.6, y: 5.5, r: 1.3, color: TV, strength: 0.4, flicker: true },
    ],
    lamps: [{ owner: "dad", x: 5.25, y: 0.62 }],
  },
  kitchen: {
    darkness: 0.68,
    wall: [
      { kind: "plates", x: 1.04, y: 0.1 },
      { kind: "hood", x: 2.08, y: 0.2, w: 0.84, h: 0.42 },
      { kind: "calendar", x: 3.25, y: 0.26, w: 0.5, h: 0.58 },
      { kind: "window", x: 4.1, y: 0.24, w: 1.8, h: 0.56, v: "checker" },
      { kind: "herbs", x: 4.16, y: 0.42 },
      { kind: "clock", x: 6.5, y: 0.5 },
      { kind: "pans", x: 7.05, y: 0.22, w: 0.9, h: 0.6 },
      { kind: "cabinets", x: 8.04, y: 0.2, w: 0.92, h: 0.42 },
      { kind: "spices", x: 9.06, y: 0.34, w: 0.88, h: 0.42 },
      { kind: "cabinets", x: 10.04, y: 0.2, w: 1.92, h: 0.42 },
      { kind: "sideDoor", x: 12.0, y: 2.0, v: "left" },
      { kind: "sideDoor", x: 1.0, y: 4.0, v: "right" },
    ],
    floor: [
      { kind: "tableRug", x: 3.72, y: 2.74, w: 4.56, h: 2.52 },
      { kind: "passadeira", x: 1.08, y: 3.16, w: 0.84, h: 1.68 },
      { kind: "braidRug", x: 7.98, y: 2.08, w: 1.04, h: 0.8 },
      { kind: "braidRug", x: 2.05, y: 2.1, w: 0.9, h: 0.76 },
    ],
    top: [
      { kind: "jars", x: 10.12, y: 0.7 },
      { kind: "blender", x: 11.3, y: 0.62 },
      { kind: "fruit", x: 1.5, y: 6.42 },
      { kind: "toaster", x: 2.2, y: 6.28 },
      { kind: "radio", x: 9.15, y: 6.24 },
      { kind: "thermos", x: 10.45, y: 6.18 },
      { kind: "breadbox", x: 11.15, y: 6.26 },
    ],
    lights: [
      { kind: "shaft", top: [4.1, 5.9, 0.8], bottom: [4.6, 6.8, 2.95], color: MOON, strength: 0.5 },
      { kind: "glow", x: 2.55, y: 0.85, r: 0.75, color: 0xffb35c, strength: 0.5, flicker: true },
      { kind: "glow", x: 6.0, y: 4.0, r: 1.5, color: WARM, strength: 0.16 },
      { kind: "glow", x: 11.9, y: 2.5, r: 0.9, color: TV, strength: 0.4, flicker: true },
      { kind: "glow", x: 1.1, y: 4.5, r: 0.8, color: WARM, strength: 0.25 },
    ],
    lamps: [],
  },
  living: {
    darkness: 0.58,
    wall: [
      { kind: "window", x: 0.95, y: 0.24, w: 1.3, h: 0.56, v: "curtain" },
      { kind: "floorLamp", x: 2.5, y: 0.1 },
      { kind: "frame", x: 2.95, y: 0.26, w: 1.5, h: 0.6, v: 4 },
      { kind: "trophy", x: 4.6, y: 0.3 },
      { kind: "frame", x: 5.25, y: 0.3, w: 0.6, h: 0.5, v: 2 },
      { kind: "frame", x: 7.2, y: 1.35, w: 0.6, h: 0.5, v: 3 },
      { kind: "lintel", x: 7.0, y: 3.0 },
      { kind: "poster404", x: 8.1, y: 0.1 },
      { kind: "wallShelf", x: 9.35, y: 0.3, w: 1.5, h: 0.42, v: "vhs" },
      { kind: "frame", x: 11.1, y: 0.3, w: 0.66, h: 0.52, v: 1 },
    ],
    floor: [
      { kind: "runner", x: 1.1, y: 4.16, w: 5.8, h: 0.68, v: 0x9a6a72 },
      { kind: "oval", x: 8.1, y: 1.9, w: 3.4, h: 2.4, v: 0x3f7a8c },
    ],
    top: [
      { kind: "vcrClock", x: 11.5, y: 3.4 },
      { kind: "remote", x: 3.82, y: 1.62 },
      { kind: "vhsStack", x: 8.5, y: 5.3 },
    ],
    lights: [
      { kind: "glow", x: 11.2, y: 2.5, r: 3.4, color: TV, strength: 0.75, flicker: true },
      { kind: "shaft", top: [0.95, 2.25, 0.8], bottom: [1.4, 3.2, 4.95], color: MOON, strength: 0.45 },
      { kind: "glow", x: 2.5, y: 3.2, r: 1.2, color: MOON, strength: 0.2 },
    ],
    lamps: [{ owner: "dad", x: 2.5, y: 0.32 }],
  },
};

DECOR.stairs = {
  darkness: 0.6,
  wall: [
    { kind: "hooks", x: 4.08, y: 1.2, w: 0.84, h: 1.6 },
    { kind: "window", x: 5.15, y: 1.3, w: 1.6, h: 0.9, v: "curtain" },
    { kind: "penduloClock", x: 3.5, y: 1.52 },
    { kind: "portrait", x: 7.45, y: 1.66 },
    { kind: "frame", x: 8.2, y: 1.45, w: 0.6, h: 0.5, v: 3 },
    { kind: "hoop", x: 8.5, y: 2.36 },
    { kind: "figurines", x: 9.0, y: 1.72 },
    { kind: "console", x: 9.04, y: 1.9, w: 0.92, h: 0.96 },
    { kind: "sconce", x: 6.95, y: 1.52 },
    { kind: "basketYarn", x: 5.95, y: 3.1 },
    { kind: "umbrellaStand", x: 3.55, y: 3.12 },
    { kind: "fernStand", x: 6.98, y: 3.12 },
    { kind: "sideDoor", x: 10.0, y: 3.0, v: "left" },
  ],
  floor: [
    { kind: "runner", x: 3.1, y: 3.16, w: 5.8, h: 0.68, v: 0x9a6a72 },
    { kind: "braidRug", x: 1.12, y: 3.14, w: 1.76, h: 1.7 },
    { kind: "comic", x: 6.4, y: 4.55 },
  ],
  top: [],
  lights: [
    { kind: "shaft", top: [5.15, 6.75, 2.2], bottom: [5.6, 7.7, 4.95], color: MOON, strength: 0.5 },
    { kind: "glow", x: 1.6, y: 1.4, r: 1.3, color: MOON, strength: 0.35 },
    { kind: "glow", x: 9.9, y: 3.5, r: 0.9, color: WARM, strength: 0.3 },
    { kind: "glow", x: 9.5, y: 2.2, r: 1.1, color: WARM, strength: 0.28 },
    { kind: "glow", x: 7.45, y: 1.9, r: 0.8, color: WARM, strength: 0.14 },
    { kind: "glow", x: 6.95, y: 1.5, r: 0.9, color: WARM, strength: 0.42, flicker: true },
  ],
  lamps: [],
};

DECOR.pantry = {
  darkness: 0.66,
  wall: [
    { kind: "spices", x: 2.06, y: 0.3, w: 0.88, h: 0.42 },
    { kind: "garlic", x: 3.34, y: 0.04 },
    { kind: "calendar", x: 4.25, y: 0.24, w: 0.5, h: 0.58 },
    { kind: "apron", x: 5.6, y: 0.06 },
    { kind: "pans", x: 6.05, y: 0.22, w: 0.9, h: 0.6 },
    { kind: "spices", x: 8.06, y: 0.3, w: 0.88, h: 0.42 },
    { kind: "smallDoor", x: 10.1, y: 0.18, w: 0.8, h: 0.8 },
    { kind: "sideDoor", x: 1.0, y: 2.0, v: "right" },
  ],
  floor: [{ kind: "passadeira", x: 1.06, y: 2.1, w: 9.88, h: 0.8 }],
  top: [{ kind: "onions", x: 7.22, y: 0.26 }],
  lights: [
    { kind: "glow", x: 10.5, y: 1.2, r: 0.9, color: MOON, strength: 0.45 },
    { kind: "glow", x: 1.1, y: 2.5, r: 0.8, color: WARM, strength: 0.25 },
    { kind: "glow", x: 5.5, y: 0.7, r: 0.9, color: WARM, strength: 0.24 },
  ],
  lamps: [],
};

DECOR.laundry = {
  darkness: 0.62,
  wall: [
    { kind: "clothesline", x: 1.05, y: 0.16, w: 3.9, h: 0.7 },
    { kind: "dogBowls", x: 4.7, y: 1.12 },
    { kind: "ironingBoard", x: 6.04, y: 0.12 },
    { kind: "namePlate", x: 6.5, y: 3.42 },
    { kind: "window", x: 6.6, y: 0.24, w: 1.8, h: 0.56, v: "checker" },
    { kind: "laundryShelf", x: 8.52, y: 0.3, w: 0.92, h: 0.5 },
    { kind: "bucketMop", x: 8.86, y: 1.14 },
    { kind: "leash", x: 9.5, y: 0.06 },
    { kind: "sideDoor", x: 10.0, y: 4.0, v: "left" },
  ],
  floor: [
    { kind: "rug", x: 7.2, y: 1.2, w: 1.6, h: 0.7, v: 0x4f7f8f },
    { kind: "pawPrints", x: 7.05, y: 3.1, w: 2.7, h: 0.8 },
    { kind: "pawPrints", x: 2.0, y: 4.25, w: 1.6, h: 0.5 },
  ],
  top: [
    { kind: "boneToy", x: 2.42, y: 3.86 },
    { kind: "tennisBall", x: 3.66, y: 3.86 },
  ],
  lights: [
    { kind: "shaft", top: [6.6, 8.4, 0.8], bottom: [7.1, 9.3, 4.95], color: MOON, strength: 0.5 },
    { kind: "glow", x: 9.9, y: 4.5, r: 0.9, color: TV, strength: 0.35, flicker: true },
    { kind: "glow", x: 6.5, y: 4.5, r: 1.0, color: WARM, strength: 0.32 },
  ],
  lamps: [],
};

DECOR.dining = {
  darkness: 0.6,
  wall: [
    { kind: "frame", x: 1.2, y: 0.26, w: 1.3, h: 0.6, v: 4 },
    { kind: "catTree", x: 2.9, y: 1.14 },
    { kind: "clock", x: 3.55, y: 0.5 },
    { kind: "lintel", x: 4.0, y: 0.0 },
    { kind: "crookedFrame", x: 4.5, y: 3.48 },
    { kind: "hangingFern", x: 5.0, y: 0.02 },
    { kind: "window", x: 5.4, y: 0.24, w: 1.8, h: 0.56, v: "curtain" },
    { kind: "sconce", x: 7.5, y: 0.5 },
    { kind: "ovalMirror", x: 8.0, y: 0.5 },
    { kind: "sconce", x: 8.5, y: 0.5 },
    { kind: "catBowl", x: 7.55, y: 1.12 },
    { kind: "sideDoor", x: 10.0, y: 1.0, v: "left" },
  ],
  floor: [
    { kind: "rug", x: 1.2, y: 2.3, w: 2.6, h: 2.4, v: 0x9a6a72 },
    { kind: "oval", x: 5.8, y: 2.3, w: 3.4, h: 2.4, v: 0x3f7a8c },
    { kind: "spill", x: 9.3, y: 2.62 },
    { kind: "runner", x: 5.3, y: 5.08, w: 3.4, h: 0.6, v: 0x9a6a72 },
  ],
  top: [
    { kind: "toyMouse", x: 6.7, y: 3.7 },
    { kind: "yarnBall", x: 3.5, y: 5.3 },
  ],
  lights: [
    { kind: "shaft", top: [5.4, 7.2, 0.8], bottom: [5.9, 8.1, 3.95], color: MOON, strength: 0.45 },
    { kind: "glow", x: 9.9, y: 1.5, r: 1.2, color: TV, strength: 0.45, flicker: true },
    { kind: "glow", x: 2.5, y: 3.3, r: 1.2, color: 0x5ff0d8, strength: 0.5, flicker: true },
    { kind: "glow", x: 7.5, y: 0.55, r: 0.7, color: WARM, strength: 0.35 },
    { kind: "glow", x: 8.5, y: 0.55, r: 0.7, color: WARM, strength: 0.35 },
  ],
  lamps: [],
};

DECOR.sofa = {
  darkness: 0.6,
  wall: [
    { kind: "window", x: 1.1, y: 0.24, w: 1.8, h: 0.56, v: "curtain" },
    { kind: "pennant", x: 3.1, y: 0.18 },
    { kind: "trophy", x: 3.95, y: 0.46 },
    { kind: "floorLamp", x: 4.55, y: 0.1 },
    { kind: "frame", x: 5.25, y: 0.26, w: 1.5, h: 0.58, v: 4 },
    { kind: "sconce", x: 7.3, y: 0.5 },
    { kind: "wallShelf", x: 7.75, y: 0.3, w: 1.6, h: 0.42, v: "vhs" },
    { kind: "turntable", x: 9.48, y: 0.62 },
    { kind: "portrait", x: 10.55, y: 0.48 },
    { kind: "switch", x: 10.75, y: 1.62 },
    { kind: "fernStand", x: 8.4, y: 1.12 },
    { kind: "sideDoor", x: 11.0, y: 2.0, v: "left" },
  ],
  floor: [
    { kind: "oval", x: 1.6, y: 2.05, w: 6.8, h: 2.9, v: 0x3f7a8c },
    { kind: "runner", x: 8.6, y: 2.14, w: 1.84, h: 0.72 },
  ],
  top: [
    { kind: "scarf", x: 5.36, y: 1.0 },
    { kind: "comic", x: 2.18, y: 1.5 },
    { kind: "yarnBall", x: 9.5, y: 1.62 },
    { kind: "popcornBowl", x: 8.92, y: 3.44 },
    { kind: "remote", x: 8.42, y: 3.62 },
    { kind: "vhsStack", x: 5.4, y: 5.36 },
  ],
  lights: [
    { kind: "shaft", top: [1.1, 2.9, 0.8], bottom: [1.6, 3.8, 4.95], color: MOON, strength: 0.45 },
    { kind: "glow", x: 10.9, y: 2.5, r: 1.6, color: TV, strength: 0.55, flicker: true },
    { kind: "glow", x: 9.9, y: 0.9, r: 0.8, color: WARM, strength: 0.3 },
    { kind: "glow", x: 7.3, y: 0.55, r: 0.7, color: WARM, strength: 0.3 },
  ],
  lamps: [{ owner: "dad", x: 4.55, y: 0.32 }],
};

DECOR.return = { ...DECOR.hallway, lights: DECOR.hallway.lights.filter((l) => !(l.kind === "glow" && l.color === TV)).concat([{ kind: "glow", x: 12.5, y: 5.5, r: 1.1, color: MOON, strength: 0.3 }]) };

export function decorFor(levelId: string): Decor {
  return DECOR[levelId] ?? { wall: [], floor: [], top: [], lights: [], lamps: [], darkness: 0.55 };
}

function shade(g: Phaser.GameObjects.Graphics, x: number, y: number, top: number, bottom: number, h: number) {
  const pts = [
    { x: x - top / 2, y: y - h / 2 },
    { x: x + top / 2, y: y - h / 2 },
    { x: x + bottom / 2, y: y + h / 2 },
    { x: x - bottom / 2, y: y + h / 2 },
  ];
  g.fillStyle(0xf6e7c4, 1);
  g.fillPoints(pts, true);
  g.lineStyle(2.5, NIGHT.ink, 1);
  g.strokePoints(pts, true);
  g.lineStyle(2, 0xe0b97a, 1);
  g.lineBetween(x - bottom / 2 + 3, y + h / 2 - 4, x + bottom / 2 - 3, y + h / 2 - 4);
}

function frameArt(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, v: number) {
  const ink = NIGHT.ink;
  const bg = [0xf2d2a0, 0xa9dcf7, 0xf9b6d4, 0xd8f0c8, 0xf6e7c4][v % 5];
  rect(g, x, y, w, h, 0xc9a24a, 4, 3);
  rect(g, x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76, bg, 2, 2);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const u = Math.min(w, h);
  if (v % 5 === 0 || v % 5 === 4) {
    const people = v % 5 === 4 ? 4 : 2;
    for (let i = 0; i < people; i += 1) {
      const px = x + w * (0.25 + (i * 0.5) / Math.max(1, people - 1));
      const ps = u * (i >= 2 ? 0.08 : 0.11);
      g.fillStyle([0x5c3320, 0xe7a874, 0xffd2a8, 0xb5734a][i % 4], 1);
      g.fillCircle(px, cy - ps * 0.6, ps);
      g.fillStyle([0x5cb9f0, 0xf06ba8, 0x63d6c1, 0xffc83d][i % 4], 1);
      g.fillEllipse(px, cy + ps * 1.3, ps * 2.2, ps * 1.8);
    }
  } else if (v % 5 === 1) {
    g.fillStyle(0x4c9a43, 1);
    g.fillTriangle(x + w * 0.14, y + h * 0.86, cx, cy - h * 0.1, x + w * 0.86, y + h * 0.86);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(x + w * 0.7, y + h * 0.3, u * 0.08);
  } else if (v % 5 === 2) {
    g.fillStyle(0xffd2a8, 1);
    g.fillCircle(cx, cy, u * 0.18);
    g.fillStyle(0x1d1830, 1);
    g.fillCircle(cx - u * 0.06, cy - u * 0.02, u * 0.025);
    g.fillCircle(cx + u * 0.06, cy - u * 0.02, u * 0.025);
  } else {
    g.fillStyle(0xef4f43, 1);
    g.fillCircle(cx - u * 0.07, cy - u * 0.03, u * 0.09);
    g.fillCircle(cx + u * 0.07, cy - u * 0.03, u * 0.09);
    g.fillTriangle(cx - u * 0.16, cy, cx + u * 0.16, cy, cx, cy + u * 0.17);
  }
  g.lineStyle(2, ink, 1);
  g.strokeRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76);
}

function windowArt(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: number, v: string | number | undefined) {
  const ink = NIGHT.ink;
  rect(g, x - s * 0.04, y - s * 0.04, w + s * 0.08, h + s * 0.08, 0xeee4cf, 4, 3);
  rect(g, x, y, w, h, 0x24306a, 2, 2.5);
  g.fillStyle(0x34458a, 1);
  g.fillRect(x + 2, y + h * 0.55, w - 4, h * 0.45 - 2);
  for (let i = 0; i < 9; i += 1) {
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(x + w * (0.1 + ((i * 37) % 80) / 100), y + h * (0.12 + ((i * 53) % 40) / 100), s * 0.012);
  }
  g.fillStyle(0xf4f1c9, 1);
  g.fillCircle(x + w * 0.72, y + h * 0.3, Math.min(w, h) * 0.16);
  g.fillStyle(0x24306a, 1);
  g.fillCircle(x + w * 0.76, y + h * 0.26, Math.min(w, h) * 0.13);
  g.lineStyle(3, 0xeee4cf, 1);
  g.lineBetween(x + w / 2, y, x + w / 2, y + h);
  g.lineBetween(x, y + h / 2, x + w, y + h / 2);
  if (v === "checker" || v === "curtain") {
    const cw = w * 0.22;
    const color = v === "checker" ? 0xd9534f : 0xc4687c;
    for (const side of [0, 1]) {
      const cx = side === 0 ? x - s * 0.02 : x + w - cw + s * 0.02;
      g.fillStyle(color, 1);
      g.fillRoundedRect(cx, y - s * 0.06, cw, h + s * 0.1, 6);
      g.lineStyle(2.5, ink, 1);
      g.strokeRoundedRect(cx, y - s * 0.06, cw, h + s * 0.1, 6);
      if (v === "checker") {
        g.fillStyle(0xffffff, 0.5);
        for (let j = 0; j < 4; j += 1) g.fillRect(cx + (j % 2) * cw * 0.5, y + j * (h / 4), cw * 0.5, h / 8);
      }
    }
    g.fillStyle(0x7c4527, 1);
    g.fillRect(x - s * 0.08, y - s * 0.1, w + s * 0.16, s * 0.05);
  }
}

export function drawWallDecor(g: Phaser.GameObjects.Graphics, decor: Decor, layout: Layout) {
  const s = layout.tile;
  const ink = NIGHT.ink;
  for (const it of decor.wall) {
    const x = layout.ox + it.x * s;
    const y = layout.oy + it.y * s;
    const w = (it.w ?? 1) * s;
    const h = (it.h ?? 1) * s;
    switch (it.kind) {
      case "frame":
        frameArt(g, x, y, w, h, Number(it.v ?? 0));
        break;
      case "window":
        windowArt(g, x, y, w, h, s, it.v);
        break;
      case "door": {
        rect(g, x - s * 0.05, y - s * 0.05, w + s * 0.1, h + s * 0.05, 0xeee4cf, 3, 3);
        rect(g, x, y, w, h, 0x9a6440, 3, 3);
        for (let j = 0; j < 2; j += 1) {
          g.lineStyle(2.5, 0x6d4a3a, 1);
          g.strokeRoundedRect(x + w * 0.16, y + h * (0.08 + j * 0.46), w * 0.68, h * 0.38, 4);
        }
        g.fillStyle(0xffc83d, 1);
        g.fillCircle(x + w * 0.82, y + h * 0.55, s * 0.05);
        g.lineStyle(2, ink, 1);
        g.strokeCircle(x + w * 0.82, y + h * 0.55, s * 0.05);
        if (it.v === "bruno") {
          rect(g, x + w * 0.2, y + h * 0.16, w * 0.6, h * 0.16, 0xfbf5e6, 4, 2.5);
          g.fillStyle(0x5cb9f0, 1);
          g.fillCircle(x + w * 0.35, y + h * 0.24, s * 0.06);
          g.fillStyle(0xef4f43, 1);
          g.fillCircle(x + w * 0.5, y + h * 0.24, s * 0.06);
          g.fillStyle(0xffc83d, 1);
          g.fillCircle(x + w * 0.65, y + h * 0.24, s * 0.06);
          g.fillStyle(0x63d6c1, 1);
          g.fillTriangle(x + w * 0.3, y + h * 0.66, x + w * 0.42, y + h * 0.58, x + w * 0.44, y + h * 0.72);
        }
        break;
      }
      case "doorLeaf": {
        g.fillStyle(0x000000, 0.4);
        g.fillRect(x + s * 0.06, y + s * 0.04, w, h);
        rect(g, x, y, w * 0.86, h, 0x9a6440, 3, 3);
        g.lineStyle(2.5, 0x6d4a3a, 1);
        g.strokeRoundedRect(x + w * 0.12, y + h * 0.08, w * 0.6, h * 0.36, 4);
        g.strokeRoundedRect(x + w * 0.12, y + h * 0.52, w * 0.6, h * 0.36, 4);
        g.fillStyle(0xffc83d, 1);
        g.fillCircle(x + w * 0.74, y + h * 0.55, s * 0.045);
        break;
      }
      case "jamb":
        rect(g, x - s * 0.05, y, s * 0.1, h, 0xeee4cf, 2, 2.5);
        break;
      case "switch":
        rect(g, x - s * 0.06, y - s * 0.09, s * 0.12, s * 0.18, 0xf6f1e4, 3, 2);
        g.fillStyle(0x9aa6b8, 1);
        g.fillRect(x - s * 0.02, y - s * 0.04, s * 0.04, s * 0.06);
        break;
      case "lamp":
        box(g, x - s * 0.2, y + s * 0.2, s * 0.4, s * 0.34, 0x8a5a3c, 0x6a3f2a, s * 0.14, 4);
        g.lineStyle(3, 0xc9a24a, 1);
        g.lineBetween(x, y + s * 0.2, x, y + s * 0.06);
        shade(g, x, y, s * 0.14, s * 0.22, s * 0.16);
        break;
      case "floorLamp":
        g.lineStyle(4, 0x7c4527, 1);
        g.lineBetween(x, y + s * 0.3, x, y + s * 0.84);
        g.fillStyle(0x7c4527, 1);
        g.fillEllipse(x, y + s * 0.84, s * 0.26, s * 0.08);
        shade(g, x, y + s * 0.18, s * 0.16, s * 0.26, s * 0.2);
        break;
      case "hooks": {
        g.fillStyle(0x7c4527, 1);
        g.fillRect(x, y, w, s * 0.08);
        g.lineStyle(2, ink, 1);
        g.strokeRect(x, y, w, s * 0.08);
        rect(g, x + w * 0.08, y + s * 0.06, w * 0.42, h * 0.56, 0x5d7cb0, s * 0.1, 2.5);
        g.lineStyle(2, 0x45619a, 1);
        g.lineBetween(x + w * 0.29, y + s * 0.1, x + w * 0.29, y + h * 0.6);
        rect(g, x + w * 0.6, y + s * 0.08, w * 0.12, h * 0.8, 0xef4f43, 4, 2.5);
        g.lineStyle(3, ink, 1);
        g.beginPath();
        g.arc(x + w * 0.66, y + h * 0.9, s * 0.07, 0, Math.PI);
        g.strokePath();
        break;
      }
      case "console": {
        box(g, x, y + h * 0.3, w, h * 0.7, 0x8a5a3c, 0x6a3f2a, h * 0.32, 4);
        rect(g, x + w * 0.1, y + h * 0.06, w * 0.38, h * 0.3, 0xef4f43, 6, 2.5);
        g.lineStyle(3, ink, 1);
        g.beginPath();
        g.arc(x + w * 0.29, y + h * 0.1, w * 0.12, Math.PI, 2 * Math.PI);
        g.strokePath();
        g.fillStyle(0xfbf5e6, 1);
        g.fillCircle(x + w * 0.29, y + h * 0.22, w * 0.07);
        rect(g, x + w * 0.62, y + h * 0.02, w * 0.18, h * 0.34, 0x63d6c1, w * 0.08, 2.5);
        g.fillStyle(0xf06ba8, 1);
        g.fillCircle(x + w * 0.71, y - h * 0.02, w * 0.07);
        break;
      }
      case "railing": {
        g.lineStyle(4, 0x7c4527, 1);
        g.lineBetween(x + s * 0.05, y + h * 0.2, x + w * 0.95, y + h * 0.5);
        for (let i = 0; i < 5; i += 1) g.lineBetween(x + s * (0.12 + i * 0.18), y + h * (0.24 + i * 0.054), x + s * (0.12 + i * 0.18), y + h);
        break;
      }
      case "hood":
        box(g, x, y, w, h, 0xc9cfdc, 0xa9b0c0, h * 0.4, 4);
        break;
      case "calendar": {
        rect(g, x, y, w, h, 0xfbf5e6, 2, 2.5);
        g.fillStyle(0xef4f43, 1);
        g.fillRect(x + 2, y + 2, w - 4, h * 0.24);
        g.fillStyle(0x3b3550, 1);
        for (let j = 0; j < 3; j += 1) for (let i = 0; i < 4; i += 1) g.fillRect(x + w * (0.12 + i * 0.2), y + h * (0.4 + j * 0.18), w * 0.12, h * 0.08);
        g.fillStyle(0xffc83d, 1);
        g.fillTriangle(x + w * 0.3, y + h * 1.0, x + w * 0.7, y + h * 1.0, x + w * 0.5, y + h * 1.25);
        break;
      }
      case "clock": {
        g.fillStyle(0xfbf5e6, 1);
        g.fillCircle(x, y, s * 0.2);
        g.lineStyle(4, 0xef4f43, 1);
        g.strokeCircle(x, y, s * 0.2);
        g.lineStyle(3, ink, 1);
        g.lineBetween(x, y, x, y - s * 0.13);
        g.lineBetween(x, y, x + s * 0.09, y + s * 0.03);
        break;
      }
      case "pans": {
        g.fillStyle(0x7c4527, 1);
        g.fillRect(x, y, w, s * 0.05);
        const sizes = [0.16, 0.12, 0.14];
        sizes.forEach((r, i) => {
          const cx = x + w * (0.2 + i * 0.3);
          g.lineStyle(2.5, 0x9aa6b8, 1);
          g.lineBetween(cx, y + s * 0.03, cx, y + s * 0.18);
          g.fillStyle(i === 1 ? 0xef4f43 : 0x6f7b8f, 1);
          g.fillCircle(cx, y + s * (0.2 + r), s * r);
          g.lineStyle(2.5, ink, 1);
          g.strokeCircle(cx, y + s * (0.2 + r), s * r);
        });
        break;
      }
      case "cabinets": {
        const n = Math.max(1, Math.round(w / s));
        for (let i = 0; i < n; i += 1) {
          box(g, x + (i * w) / n + 2, y, w / n - 4, h, 0xb88a5e, 0x9a6a48, h * 0.16, 4);
          g.fillStyle(0xe8d9a0, 1);
          g.fillCircle(x + (i * w) / n + w / n / 2, y + h * 0.62, s * 0.025);
        }
        break;
      }
      case "spices": {
        rect(g, x, y + h * 0.7, w, h * 0.16, 0x9a6a48, 2, 2);
        const colors = [0xef4f43, 0xffc83d, 0x4c9a43, 0xc0703f, 0xf06ba8];
        for (let i = 0; i < 5; i += 1) {
          const jx = x + w * (0.08 + i * 0.18);
          rect(g, jx, y + h * 0.2, w * 0.13, h * 0.5, 0xf6f1e4, 3, 2);
          g.fillStyle(colors[i], 1);
          g.fillRect(jx + 2, y + h * 0.4, w * 0.13 - 4, h * 0.28);
        }
        break;
      }
      case "fern": {
        g.lineStyle(2, ink, 1);
        g.lineBetween(x, y, x, y + s * 0.2);
        rect(g, x - s * 0.14, y + s * 0.2, s * 0.28, s * 0.2, 0xc0703f, 4, 2.5);
        g.fillStyle(0x4c9a43, 1);
        for (let i = 0; i < 7; i += 1) {
          const a = Math.PI * (0.15 + (i * 0.7) / 6);
          g.fillEllipse(x + Math.cos(a) * s * 0.22, y + s * 0.42 + Math.sin(a) * s * 0.22, s * 0.12, s * 0.3);
        }
        break;
      }
      case "wallShelf": {
        rect(g, x, y + h * 0.8, w, h * 0.18, 0x7c4527, 2, 2.5);
        const spines = [0x1d1830, 0xef4f43, 0x2b2150, 0x5cb9f0, 0x1d1830, 0xffc83d, 0x2b2150, 0x63d6c1, 0x1d1830, 0xf06ba8];
        const n = Math.floor(w / (s * 0.15));
        for (let i = 0; i < n; i += 1) {
          const bx = x + s * 0.04 + i * s * 0.15;
          g.fillStyle(spines[i % spines.length], 1);
          g.fillRect(bx, y, s * 0.13, h * 0.8);
          g.lineStyle(1.5, ink, 1);
          g.strokeRect(bx, y, s * 0.13, h * 0.8);
          g.fillStyle(0xfbf5e6, 0.9);
          g.fillRect(bx + s * 0.025, y + h * 0.25, s * 0.08, h * 0.3);
        }
        break;
      }
      case "trophy":
        g.fillStyle(0xffc83d, 1);
        g.fillEllipse(x + s * 0.15, y + s * 0.12, s * 0.24, s * 0.2);
        g.fillRect(x + s * 0.12, y + s * 0.18, s * 0.06, s * 0.16);
        rect(g, x + s * 0.05, y + s * 0.34, s * 0.2, s * 0.08, 0x7c4527, 2, 2);
        break;
      case "lintel":
        rect(g, x, y + s * 0.78, s, s * 0.08, 0xf0dfc8, 2, 2);
        break;
      case "smallDoor": {
        rect(g, x, y, w, h, 0x9a6440, 3, 3);
        g.fillStyle(0xffc83d, 1);
        g.fillCircle(x + w * 0.8, y + h * 0.55, s * 0.04);
        break;
      }
      case "clothesline": {
        g.lineStyle(2.5, 0xeee4cf, 1);
        g.lineBetween(x, y + s * 0.08, x + w, y + s * 0.08);
        const clothes = [0x5cb9f0, 0xf06ba8, 0xffc83d, 0x63d6c1, 0xef4f43];
        for (let i = 0; i < 5; i += 1) {
          const cx = x + w * (0.08 + i * 0.2);
          const cw = s * (i % 2 ? 0.3 : 0.4);
          const ch = s * (i % 2 ? 0.28 : 0.5);
          rect(g, cx, y + s * 0.06, cw, ch, clothes[i], 4, 2.5);
          g.fillStyle(0xc9a24a, 1);
          g.fillRect(cx + cw * 0.2, y + s * 0.03, s * 0.03, s * 0.08);
          g.fillRect(cx + cw * 0.7, y + s * 0.03, s * 0.03, s * 0.08);
        }
        break;
      }
      case "sideDoor": {
        const left = it.v === "left";
        const dx = left ? x + s * 0.02 : x - s * 0.2;
        rect(g, dx, y + s * 0.04, s * 0.18, s * 0.92, 0x9a6440, 3, 3);
        g.fillStyle(0xffc83d, 1);
        g.fillCircle(dx + s * 0.09, y + s * 0.5, s * 0.04);
        break;
      }
    }
  }
}

export function drawFloorDecor(g: Phaser.GameObjects.Graphics, decor: Decor, layout: Layout) {
  const s = layout.tile;
  const ink = NIGHT.ink;
  for (const it of decor.floor) {
    const x = layout.ox + it.x * s;
    const y = layout.oy + it.y * s;
    const w = (it.w ?? 1) * s;
    const h = (it.h ?? 1) * s;
    const color = typeof it.v === "number" ? it.v : 0x9c5a6a;
    switch (it.kind) {
      case "mat":
        g.fillStyle(color, 0.8);
        g.fillEllipse(x + w / 2, y + h / 2, w, h);
        g.lineStyle(2.5, 0xf6e7c4, 0.55);
        g.strokeEllipse(x + w / 2, y + h / 2, w * 0.8, h * 0.8);
        break;
      case "rug":
      case "runner": {
        g.fillStyle(color, 0.82);
        g.fillRoundedRect(x, y, w, h, s * 0.08);
        g.lineStyle(3, 0xf6e7c4, 0.5);
        g.strokeRoundedRect(x + s * 0.08, y + s * 0.08, w - s * 0.16, h - s * 0.16, s * 0.05);
        g.fillStyle(0xf6e7c4, 0.22);
        const step = s * 0.3;
        for (let yy = y + step; yy < y + h - step * 0.5; yy += step) {
          for (let xx = x + step; xx < x + w - step * 0.5; xx += step) {
            g.fillPoints(
              [
                { x: xx, y: yy - s * 0.06 },
                { x: xx + s * 0.06, y: yy },
                { x: xx, y: yy + s * 0.06 },
                { x: xx - s * 0.06, y: yy },
              ],
              true,
            );
          }
        }
        if (it.kind === "runner") {
          g.lineStyle(2, 0xf6e7c4, 0.8);
          for (let i = 0; i < Math.floor(w / (s * 0.08)); i += 1) {
            g.lineBetween(x + i * s * 0.08 + 4, y, x + i * s * 0.08 + 4, y - s * 0.04);
            g.lineBetween(x + i * s * 0.08 + 4, y + h, x + i * s * 0.08 + 4, y + h + s * 0.04);
          }
        }
        break;
      }
      case "oval": {
        g.fillStyle(color, 1);
        g.fillEllipse(x + w / 2, y + h / 2, w, h * 0.92);
        g.lineStyle(3, ink, 0.9);
        g.strokeEllipse(x + w / 2, y + h / 2, w, h * 0.92);
        for (let k = 1; k <= 3; k += 1) {
          g.lineStyle(4, k % 2 ? 0xf6e7c4 : 0xc4687c, 0.55);
          g.strokeEllipse(x + w / 2, y + h / 2, w * (1 - k * 0.2), h * 0.92 * (1 - k * 0.2));
        }
        break;
      }
      case "slippers":
        for (let i = 0; i < 2; i += 1) {
          g.fillStyle(0x5cb9f0, 1);
          g.fillEllipse(x + i * s * 0.14, y + i * s * 0.03, s * 0.11, s * 0.26);
          g.lineStyle(2, ink, 1);
          g.strokeEllipse(x + i * s * 0.14, y + i * s * 0.03, s * 0.11, s * 0.26);
          g.lineStyle(2, 0xffffff, 1);
          g.lineBetween(x + i * s * 0.14 - s * 0.04, y + i * s * 0.03 - s * 0.02, x + i * s * 0.14, y + i * s * 0.03 - s * 0.08);
          g.lineBetween(x + i * s * 0.14 + s * 0.04, y + i * s * 0.03 - s * 0.02, x + i * s * 0.14, y + i * s * 0.03 - s * 0.08);
        }
        break;
      case "sock":
        g.fillStyle(0xf6f1e4, 1);
        g.fillRoundedRect(x, y, s * 0.12, s * 0.22, s * 0.05);
        g.fillEllipse(x + s * 0.1, y + s * 0.2, s * 0.18, s * 0.09);
        g.lineStyle(2, ink, 1);
        g.strokeRoundedRect(x, y, s * 0.12, s * 0.22, s * 0.05);
        g.fillStyle(0xef4f43, 1);
        g.fillRect(x, y + s * 0.02, s * 0.12, s * 0.04);
        break;
      case "comic":
        g.fillStyle(0xfbf5e6, 1);
        g.fillRect(x, y, s * 0.32, s * 0.22);
        g.lineStyle(2, ink, 1);
        g.strokeRect(x, y, s * 0.32, s * 0.22);
        g.lineBetween(x + s * 0.16, y, x + s * 0.16, y + s * 0.22);
        g.fillStyle(0xffc83d, 1);
        g.fillRect(x + s * 0.03, y + s * 0.03, s * 0.1, s * 0.07);
        g.fillStyle(0x5cb9f0, 1);
        g.fillRect(x + s * 0.19, y + s * 0.12, s * 0.1, s * 0.07);
        break;
    }
  }
}

export function drawTopDecor(g: Phaser.GameObjects.Graphics, decor: Decor, layout: Layout) {
  const s = layout.tile;
  const ink = NIGHT.ink;
  for (const it of decor.top) {
    const x = layout.ox + it.x * s;
    const y = layout.oy + it.y * s;
    switch (it.kind) {
      case "jars":
        [0xffc83d, 0xc0703f, 0xf6f1e4].forEach((c, i) => {
          rect(g, x + i * s * 0.2, y - s * 0.1 * (i % 2), s * 0.16, s * 0.22, 0xe9f2f6, 4, 2);
          g.fillStyle(c, 1);
          g.fillRect(x + i * s * 0.2 + 3, y - s * 0.1 * (i % 2) + s * 0.08, s * 0.16 - 6, s * 0.12);
          g.fillStyle(0xef4f43, 1);
          g.fillRect(x + i * s * 0.2, y - s * 0.1 * (i % 2) - s * 0.03, s * 0.16, s * 0.05);
        });
        break;
      case "blender":
        rect(g, x - s * 0.1, y + s * 0.12, s * 0.2, s * 0.12, 0xef4f43, 3, 2);
        rect(g, x - s * 0.08, y - s * 0.16, s * 0.16, s * 0.28, 0xd9f0f7, 3, 2);
        break;
      case "fruit":
        g.fillStyle(0xf6f1e4, 1);
        g.fillEllipse(x, y, s * 0.42, s * 0.2);
        g.lineStyle(2, ink, 1);
        g.strokeEllipse(x, y, s * 0.42, s * 0.2);
        [0xffc83d, 0xef4f43, 0x93cf4c, 0xf2a33a].forEach((c, i) => {
          g.fillStyle(c, 1);
          g.fillCircle(x + (i - 1.5) * s * 0.08, y - s * 0.06 - (i % 2) * s * 0.03, s * 0.065);
          g.strokeCircle(x + (i - 1.5) * s * 0.08, y - s * 0.06 - (i % 2) * s * 0.03, s * 0.065);
        });
        break;
      case "toaster":
        box(g, x, y, s * 0.34, s * 0.26, 0xc9cfdc, 0xa9b0c0, s * 0.1, 6);
        g.fillStyle(0x1d1830, 1);
        g.fillRect(x + s * 0.06, y + s * 0.05, s * 0.22, s * 0.03);
        break;
      case "radio":
        box(g, x, y, s * 0.42, s * 0.26, 0xc0703f, 0x9a5a30, s * 0.1, 5);
        g.fillStyle(0xf6e7c4, 1);
        g.fillCircle(x + s * 0.12, y + s * 0.08, s * 0.05);
        g.lineStyle(3, ink, 1);
        g.lineBetween(x + s * 0.36, y, x + s * 0.48, y - s * 0.2);
        break;
      case "thermos":
        rect(g, x, y - s * 0.12, s * 0.16, s * 0.36, 0x5cb9f0, 6, 2.5);
        rect(g, x - s * 0.01, y - s * 0.16, s * 0.18, s * 0.06, 0xef4f43, 3, 2);
        break;
      case "breadbox":
        box(g, x, y, s * 0.5, s * 0.28, 0xb88a5e, 0x9a6a48, s * 0.12, 8);
        break;
      case "vcrClock":
        break;
    }
  }
}
