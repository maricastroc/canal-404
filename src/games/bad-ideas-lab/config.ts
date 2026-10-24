export const W = 1920;
export const H = 1080;
export const FLOOR_Y = 930;
export const STEP_MS = 1000 / 60;
export const GRAVITY_Y = 1.2;
export const GRID = 20;
export const BALL_R = 22;
export const SPRING_SPEED = 21;
export const FAN_REACH = 440;
export const FAN_HALF = 64;
export const FAN_ACCEL = 0.0011;
export const BELT_SPEED = 8;
export const RUN_TIMEOUT = 14000;

export type PartType = "ramp" | "spring" | "fan" | "belt";

export type PartDef = {
  type: PartType;
  name: string;
  plural: string;
  tex: string;
  w: number;
  h: number;
  rotations: number[];
  initial: number;
  tip: string;
};

export const PART_ORDER: PartType[] = ["ramp", "spring", "fan", "belt"];

export const PARTS: Record<PartType, PartDef> = {
  ramp: {
    type: "ramp",
    name: "Rampa",
    plural: "rampas",
    tex: "ramp",
    w: 200,
    h: 24,
    rotations: [-45, -30, -15, 0, 15, 30, 45],
    initial: 4,
    tip: "Gire para escolher a inclinação.",
  },
  spring: {
    type: "spring",
    name: "Mola",
    plural: "molas",
    tex: "spring",
    w: 100,
    h: 48,
    rotations: [-30, -15, 0, 15, 30],
    initial: 3,
    tip: "Joga a bolinha para onde aponta.",
  },
  fan: {
    type: "fan",
    name: "Ventilador",
    plural: "ventiladores",
    tex: "fan-body",
    w: 96,
    h: 112,
    rotations: [0, 180],
    initial: 0,
    tip: "Sopra tudo que passa na frente.",
  },
  belt: {
    type: "belt",
    name: "Esteira",
    plural: "esteiras",
    tex: "belt",
    w: 240,
    h: 34,
    rotations: [0, 180],
    initial: 0,
    tip: "Leva a bolinha na direção das setas.",
  },
};

export function partAngle(type: PartType, rot: number) {
  const def = PARTS[type];
  return type === "fan" || type === "belt" ? 0 : def.rotations[rot];
}

export function partFacing(type: PartType, rot: number) {
  return (type === "fan" || type === "belt") && PARTS[type].rotations[rot] === 180 ? -1 : 1;
}

export const BALL_BODY = { density: 0.004, restitution: 0.25, friction: 0.002, frictionStatic: 0, frictionAir: 0.0015 };
export const SURFACE = { friction: 0.002, frictionStatic: 0, restitution: 0.15 };
