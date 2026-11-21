import type { ProjectileId } from "./config";

export type PhaseId = "warm-up" | "sharp-aim" | "up-high" | "domino" | "surprise-bath" | "blocked-path" | "counterattack" | "free-for-all" | "grand-mess";

export type Material = "ceramic" | "wood" | "metal" | "rubber" | "plastic" | "cloth" | "concrete" | "glass";

export type Point = { x: number; y: number };

export type Zone = { x: number; y: number; w: number; h: number };

export type Part = { x: number; y: number; w: number; h: number; chamfer?: number; density?: number };

export type Shape = { type: "box"; w: number; h: number; chamfer?: number } | { type: "ball"; r: number } | { type: "parts"; parts: Part[] };

export type PieceDef = {
  id: string;
  tex: string;
  x: number;
  y: number;
  angle?: number;
  shape: Shape;
  density: number;
  friction?: number;
  restitution?: number;
  frictionAir?: number;
  material: Material;
  mess?: boolean;
  fixed?: boolean;
  sturdy?: boolean;
};

export type TargetName = "gnome" | "flamingo" | "golden-gnome" | "mailbox" | "birdhouse" | "sun-gnome" | "giant-gnome";

export type TargetDef = PieceDef & { name: TargetName; kind: "knock" | "soak"; points: number; direct?: boolean; wobble?: number };

export type StaticLook = "none" | "beam" | "post" | "metal" | "hedge" | "brick" | "roof" | "shelf" | "stump" | "ramp";

export type StaticDef = { x: number; y: number; w: number; h: number; angle?: number; look: StaticLook };

export type GadgetDef =
  | { type: "pivot"; piece: string; at: Point }
  | { type: "rope"; piece: string; anchor: Point; attach: Point; cut?: readonly [number, number] }
  | { type: "bucket"; piece: string }
  | { type: "faucet"; piece: string; nozzle: Point; stream: Zone; push: Point }
  | { type: "blower"; piece: string; zone: Zone; strength: number }
  | { type: "turnstile"; piece: string; step: number; turnSteps: number; hinge?: Point; toggle?: boolean };

export type PhaseDef = {
  id: PhaseId;
  act: 1 | 2 | 3;
  ammo: Partial<Record<ProjectileId, number>>;
  par: readonly [number, number];
  statics: StaticDef[];
  pieces: PieceDef[];
  targets: TargetDef[];
  gadgets: GadgetDef[];
};

const crate = (id: string, x: number, y: number): PieceDef => ({ id, tex: "crate", x, y, shape: { type: "box", w: 74, h: 74, chamfer: 3 }, density: 0.0022, material: "wood" });

const flatTire = (id: string, x: number, y: number): PieceDef => ({
  id,
  tex: "tire-flat",
  x,
  y,
  shape: { type: "box", w: 134, h: 38, chamfer: 14 },
  density: 0.0025,
  friction: 0.95,
  material: "rubber",
});

const trashCan = (id: string, x: number, y = 896): PieceDef => ({ id, tex: "trash-can", x, y, shape: { type: "box", w: 66, h: 106, chamfer: 4 }, density: 0.002, material: "metal" });

const plank = (id: string, x: number, y: number, angle = 0): PieceDef => ({
  id,
  tex: "plank",
  x,
  y,
  angle,
  shape: { type: "box", w: 266, h: 20, chamfer: 3 },
  density: 0.002,
  material: "wood",
});

const gnome = (id: string, x: number, y: number, points = 100, name: TargetName = "gnome"): TargetDef => ({
  id,
  name,
  kind: "knock",
  points,
  tex: name === "golden-gnome" ? "gnome-gold" : "gnome",
  x,
  y,
  shape: { type: "box", w: 54, h: 98, chamfer: 8 },
  density: 0.0016,
  material: "ceramic",
});

const flamingo = (id: string, x: number, y: number, points = 150): TargetDef => ({
  id,
  name: "flamingo",
  kind: "knock",
  points,
  tex: "flamingo",
  x,
  y,
  shape: { type: "box", w: 44, h: 148, chamfer: 6 },
  density: 0.0012,
  material: "plastic",
});


const brick = (id: string, x: number, y: number): PieceDef => ({ id, tex: "brick", x, y, shape: { type: "box", w: 22, h: 96, chamfer: 2 }, density: 0.0024, friction: 0.6, material: "concrete" });

const sunGnome = (id: string, x: number, y: number, points = 150): TargetDef => ({
  id,
  name: "sun-gnome",
  kind: "soak",
  points,
  tex: "sun-gnome",
  x,
  y,
  shape: { type: "box", w: 92, h: 50, chamfer: 8 },
  density: 0.002,
  material: "ceramic",
  fixed: true,
});

const bucket = (id: string, x: number, y: number): PieceDef => ({ id, tex: "bucket", x, y, shape: { type: "box", w: 56, h: 58, chamfer: 6 }, density: 0.004, material: "metal" });


const melon = (id: string, x: number, y: number): PieceDef => ({ id, tex: "melon", x, y, shape: { type: "ball", r: 28 }, density: 0.008, restitution: 0.2, friction: 0.6, frictionAir: 0.002, material: "plastic" });

const faucet = (id: string, x: number, y: number): PieceDef => ({ id, tex: "faucet", x, y, shape: { type: "box", w: 34, h: 30, chamfer: 6 }, density: 0.002, material: "metal", fixed: true, mess: false });

const blower = (id: string, x: number, y: number): PieceDef => ({ id, tex: "blower", x, y, shape: { type: "box", w: 96, h: 72, chamfer: 10 }, density: 0.0025, material: "plastic" });

const sandbag = (id: string, x: number, y: number): PieceDef => ({ id, tex: "sandbag", x, y, shape: { type: "box", w: 60, h: 64, chamfer: 14 }, density: 0.008, friction: 0.9, material: "cloth" });


export const PHASES: PhaseDef[] = [
  {
    id: "warm-up",
    act: 1,
    ammo: { shoe: 4 },
    par: [2, 3],
    statics: [],
    pieces: [
      flatTire("tire-1", 760, 930),
      flatTire("tire-2", 764, 892),
      flatTire("tire-3", 758, 854),
      trashCan("can-1", 980),
      trashCan("can-2", 1140),
      plank("plank", 1060, 833),
      crate("crate", 1150, 786),
    ],
    targets: [gnome("gnome", 760, 787), flamingo("flamingo", 1050, 749)],
    gadgets: [],
  },
  {
    id: "sharp-aim",
    act: 1,
    ammo: { shoe: 3, duck: 2 },
    par: [2, 3],
    statics: [
      { x: 1380, y: 653, w: 260, h: 26, look: "beam" },
      { x: 1280, y: 808, w: 28, h: 290, look: "post" },
      { x: 1480, y: 808, w: 28, h: 290, look: "post" },
      { x: 1605, y: 876, w: 22, h: 152, look: "metal" },
      { x: 1532, y: 878, w: 56, h: 144, look: "hedge" },
    ],
    pieces: [
      flatTire("tire-1", 820, 930),
      flatTire("tire-2", 824, 892),
      crate("crate-1", 1300, 603),
      crate("crate-2", 1376, 603),
      crate("crate-3", 1338, 529),
    ],
    targets: [
      gnome("golden-gnome", 1462, 591, 300, "golden-gnome"),
      {
        id: "mailbox",
        name: "mailbox",
        kind: "knock",
        points: 150,
        tex: "mailbox",
        x: 1603,
        y: 769,
        shape: { type: "box", w: 80, h: 60, chamfer: 6 },
        density: 0.0014,
        material: "metal",
      },
    ],
    gadgets: [],
  },
  {
    id: "up-high",
    act: 1,
    ammo: { tire: 1, balloon: 1, shoe: 2, duck: 1 },
    par: [2, 3],
    statics: [
      { x: 1180, y: 905, w: 80, h: 90, look: "stump" },
      { x: 900, y: 715, w: 22, h: 470, look: "metal" },
      { x: 900, y: 472, w: 96, h: 18, look: "shelf" },
    ],
    pieces: [crate("crate-1", 1180, 823), crate("crate-2", 1180, 749), crate("crate-3", 1180, 675), crate("crate-4", 1180, 601), trashCan("can", 1420)],
    targets: [
      flamingo("flamingo", 900, 389),
      gnome("gnome", 1180, 515),
      {
        id: "birdhouse",
        name: "birdhouse",
        kind: "knock",
        points: 200,
        tex: "birdhouse",
        x: 1736,
        y: 380,
        shape: { type: "box", w: 66, h: 80, chamfer: 4 },
        density: 0.0012,
        material: "wood",
      },
    ],
    gadgets: [],
  },
  {
    id: "domino",
    act: 2,
    ammo: { shoe: 2, duck: 1, tire: 1 },
    par: [1, 2],
    statics: [
      { x: 930, y: 840, w: 540, h: 220, look: "brick" },
      { x: 1380, y: 840, w: 414, h: 18, angle: 29, look: "ramp" },
      { x: 1505, y: 590, w: 590, h: 40, look: "roof" },
      { x: 1226, y: 630, w: 24, h: 50, look: "beam" },
    ],
    pieces: [
      ...[0, 1, 2, 3, 4, 5].map((i) => brick(`brick-${i + 1}`, 720 + i * 68, 682)),
      melon("melon", 1192, 702),
    ],
    targets: [flamingo("flamingo", 1130, 656), gnome("gnome", 1640, 901)],
    gadgets: [],
  },
  {
    id: "surprise-bath",
    act: 2,
    ammo: { balloon: 2, shoe: 1, duck: 2 },
    par: [2, 3],
    statics: [
      { x: 1040, y: 880, w: 46, h: 140, look: "hedge" },
      { x: 1690, y: 760, w: 210, h: 18, look: "roof" },
      { x: 1598, y: 855, w: 18, h: 190, look: "beam" },
      { x: 1400, y: 905, w: 16, h: 90, look: "metal" },
    ],
    pieces: [
      {
        id: "parasol",
        tex: "parasol",
        x: 1200,
        y: 840,
        shape: {
          type: "parts",
          parts: [
            { x: 20, y: 0, w: 10, h: 210 },
            { x: -30, y: -100, w: 230, h: 22, chamfer: 8 },
            { x: 20, y: 100, w: 96, h: 16, density: 0.03 },
          ],
        },
        density: 0.0015,
        material: "cloth",
      },
      bucket("bucket", 1704, 822),
      faucet("faucet", 1400, 846),
    ],
    targets: [sunGnome("gnome-a", 860, 925), sunGnome("gnome-b", 1150, 925), sunGnome("gnome-c", 1700, 925)],
    gadgets: [
      { type: "rope", piece: "bucket", anchor: { x: 1722, y: 440 }, attach: { x: 0, y: -29 }, cut: [0, 0.82] },
      { type: "bucket", piece: "bucket" },
      { type: "faucet", piece: "faucet", nozzle: { x: 1262, y: 930 }, stream: { x: 1080, y: 860, w: 180, h: 90 }, push: { x: -0.2, y: -0.3 } },
    ],
  },
  {
    id: "blocked-path",
    act: 2,
    ammo: { shoe: 2, duck: 2, balloon: 1 },
    par: [3, 4],
    statics: [
      { x: 790, y: 483, w: 190, h: 26, look: "shelf" },
      { x: 970, y: 562, w: 247, h: 26, angle: 41.1, look: "ramp" },
      { x: 1105, y: 682, w: 132, h: 26, angle: 40.8, look: "ramp" },
      { x: 1230, y: 722, w: 160, h: 34, look: "beam" },
      { x: 1365, y: 812, w: 110, h: 34, look: "beam" },
      { x: 1316, y: 737, w: 12, h: 32, look: "beam" },
      { x: 1603, y: 827, w: 366, h: 245, look: "brick" },
      { x: 1660, y: 555, w: 260, h: 40, look: "roof" },
      { x: 1540, y: 608, w: 24, h: 66, look: "beam" },
    ],
    pieces: [
      { id: "bowling", tex: "bowling-ball", x: 850, y: 444, shape: { type: "ball", r: 26 }, density: 0.01, restitution: 0.1, friction: 0.05, frictionAir: 0.0005, material: "rubber" },
      crate("crate", 1272, 668),
      { id: "bridge", tex: "bridge", x: 1406.8, y: 663.3, angle: 84, shape: { type: "box", w: 100, h: 16, chamfer: 3 }, density: 0.003, material: "wood" },
    ],
    targets: [{ ...gnome("golden-gnome", 1600, 656, 300, "golden-gnome"), direct: false }],
    gadgets: [
      { type: "pivot", piece: "bridge", at: { x: 1412, y: 713 } },
      { type: "rope", piece: "bridge", anchor: { x: 1530, y: 540 }, attach: { x: -50, y: 0 } },
    ],
  },
  {
    id: "counterattack",
    act: 3,
    ammo: { shoe: 2, tire: 1, duck: 2, balloon: 1 },
    par: [2, 3],
    statics: [
      { x: 1600, y: 880, w: 150, h: 140, look: "brick" },
      { x: 1300, y: 905, w: 60, h: 90, look: "stump" },
      { x: 1290, y: 640, w: 260, h: 40, look: "roof" },
      { x: 1405, y: 805, w: 30, h: 290, look: "post" },
    ],
    pieces: [
      blower("blower", 1586, 774),
      { id: "door", tex: "door", x: 1172, y: 806, shape: { type: "box", w: 30, h: 292, chamfer: 4 }, density: 0.002, material: "wood", fixed: true, mess: false },
    ],
    targets: [gnome("gnome", 1300, 811), flamingo("flamingo", 1728, 876)],
    gadgets: [
      { type: "blower", piece: "blower", zone: { x: 760, y: 420, w: 780, h: 530 }, strength: 0.9 },
      { type: "turnstile", piece: "door", step: 90, turnSteps: 30, hinge: { x: 1172, y: 662 }, toggle: true },
    ],
  },
  {
    id: "free-for-all",
    act: 3,
    ammo: { tire: 1, shoe: 1, duck: 2, balloon: 1 },
    par: [3, 4],
    statics: [
      { x: 930, y: 855, w: 460, h: 190, look: "brick" },
      { x: 680, y: 690, w: 30, h: 520, look: "post" },
      { x: 750, y: 430, w: 170, h: 30, look: "beam" },
      { x: 1272, y: 836, w: 268, h: 18, angle: 31, look: "ramp" },
      { x: 1520, y: 905, w: 100, h: 90, look: "brick" },
      { x: 1405, y: 735, w: 170, h: 40, look: "roof" },
    ],
    pieces: [
      bucket("bucket", 822, 650),
      ...[0, 1, 2, 3].map((i) => brick(`brick-${i + 1}`, 860 + i * 68, 712)),
      melon("melon", 1153, 732),
      blower("blower", 1520, 824),
    ],
    targets: [sunGnome("sun-gnome", 772, 735), gnome("gnome", 1432, 901), flamingo("flamingo", 1640, 876)],
    gadgets: [
      { type: "rope", piece: "bucket", anchor: { x: 822, y: 445 }, attach: { x: 0, y: -29 } },
      { type: "bucket", piece: "bucket" },
      { type: "blower", piece: "blower", zone: { x: 980, y: 560, w: 480, h: 390 }, strength: 0.9 },
    ],
  },
  {
    id: "grand-mess",
    act: 3,
    ammo: { shoe: 1, tire: 1, duck: 1, balloon: 1 },
    par: [2, 3],
    statics: [
      { x: 820, y: 855, w: 300, h: 190, look: "brick" },
      { x: 1600, y: 845, w: 150, h: 210, look: "brick" },
      { x: 1610, y: 360, w: 300, h: 40, look: "roof" },
      { x: 1556, y: 300, w: 12, h: 80, look: "metal" },
      { x: 1270, y: 905, w: 16, h: 90, look: "metal" },
    ],
    pieces: [
      ...[0, 1, 2].map((i) => brick(`brick-${i + 1}`, 720 + i * 68, 712)),
      sandbag("sandbag", 1560, 440),
      { id: "door", tex: "door", x: 1440, y: 548, shape: { type: "box", w: 30, h: 296, chamfer: 4 }, density: 0.002, material: "wood", fixed: true, mess: false },
      blower("blower", 1662, 304),
      faucet("faucet", 1270, 846),
    ],
    targets: [
      gnome("guard", 925, 711),
      sunGnome("sun-gnome", 1080, 925),
      {
        id: "giant-gnome",
        name: "giant-gnome",
        kind: "knock",
        points: 500,
        direct: false,
        sturdy: true,
        wobble: 0.06,
        tex: "giant-gnome",
        x: 1600,
        y: 625,
        shape: { type: "box", w: 100, h: 230, chamfer: 12 },
        density: 0.0016,
        material: "ceramic",
      },
    ],
    gadgets: [
      { type: "rope", piece: "sandbag", anchor: { x: 1556, y: 262 }, attach: { x: 0, y: -32 }, cut: [0, 0.5] },
      { type: "blower", piece: "blower", zone: { x: 1000, y: 150, w: 530, h: 410 }, strength: 0.9 },
      { type: "turnstile", piece: "door", step: 90, turnSteps: 30, hinge: { x: 1440, y: 400 }, toggle: true },
      { type: "faucet", piece: "faucet", nozzle: { x: 1150, y: 930 }, stream: { x: 1010, y: 870, w: 150, h: 80 }, push: { x: -0.2, y: -0.3 } },
    ],
  },
];

export const PHASE_IDS = PHASES.map((p) => p.id);

export function phaseById(id: string) {
  return PHASES.find((p) => p.id === id) ?? null;
}

export function ammoTotal(phase: PhaseDef) {
  return Object.values(phase.ammo).reduce((sum, n) => sum + (n ?? 0), 0);
}

export const MAX_AMMO = Math.max(...PHASES.map(ammoTotal));
