export const W = 1920;
export const H = 1080;
export const GROUND_Y = 950;
export const STEP_MS = 1000 / 60;
export const GRAVITY_Y = 1.35;
export const GRAVITY_PER_STEP = GRAVITY_Y * 0.001 * STEP_MS * STEP_MS;

export const ANCHOR = { x: 250, y: 688 };
export const BAND_BACK = { x: 214, y: 686 };
export const BAND_FRONT = { x: 286, y: 686 };
export const MAX_PULL = 170;
export const MIN_SPEED = 8;
export const MAX_SPEED = 38;
export const ANGLE_MIN = -8;
export const ANGLE_MAX = 82;
export const MIN_POWER = 0.12;

export const WAGON = { x: 110, y: 650 };
export const ARLINDO_WINDOW = { x: 1230, y: 400, w: 140, h: 110 };
export const CAT_SPOT = { x: 606, y: 716 };

export type ProjectileId = "shoe" | "balloon" | "tire" | "duck";

export const PROJECTILE_ORDER: readonly ProjectileId[] = ["shoe", "balloon", "tire", "duck"];

export type ProjectileDef = {
  id: ProjectileId;
  tex: string;
  shape: { type: "rectangle"; width: number; height: number } | { type: "circle"; radius: number };
  density: number;
  restitution: number;
  friction: number;
  frictionAir: number;
  spin: number;
  material: "rubber" | "soft" | "water" | "squeaky";
};

export const PROJECTILES: Record<ProjectileId, ProjectileDef> = {
  shoe: {
    id: "shoe",
    tex: "shoe",
    shape: { type: "rectangle", width: 74, height: 36 },
    density: 0.004,
    restitution: 0.22,
    friction: 0.7,
    frictionAir: 0.004,
    spin: 0.12,
    material: "soft",
  },
  balloon: {
    id: "balloon",
    tex: "balloon",
    shape: { type: "circle", radius: 30 },
    density: 0.0022,
    restitution: 0.3,
    friction: 0.4,
    frictionAir: 0.008,
    spin: 0.03,
    material: "water",
  },
  tire: {
    id: "tire",
    tex: "tire",
    shape: { type: "circle", radius: 37 },
    density: 0.009,
    restitution: 0.5,
    friction: 0.9,
    frictionAir: 0.002,
    spin: 0.03,
    material: "rubber",
  },
  duck: {
    id: "duck",
    tex: "duck",
    shape: { type: "circle", radius: 29 },
    density: 0.0016,
    restitution: 0.88,
    friction: 0.3,
    frictionAir: 0.004,
    spin: -0.06,
    material: "squeaky",
  },
};

export const SCORE = {
  messBonus: 25,
  comboBonus: 100,
  gadgetBonus: 50,
  clearBonus: 300,
  ammoBonus: 250,
  record: 2500,
};

export const SOAK_RADIUS = 150;
export const BURST_RADIUS = 250;
