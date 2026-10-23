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

export type ProjectileId = "tenis" | "balao" | "pneu" | "pato";

export type ProjectileDef = {
  id: ProjectileId;
  name: string;
  tex: string;
  shape: { type: "rectangle"; width: number; height: number } | { type: "circle"; radius: number };
  density: number;
  restitution: number;
  friction: number;
  frictionAir: number;
  material: "rubber" | "soft" | "water" | "squeaky";
  tip: string;
};

export const PROJECTILES: Record<ProjectileId, ProjectileDef> = {
  tenis: {
    id: "tenis",
    name: "Tênis velho",
    tex: "shoe",
    shape: { type: "rectangle", width: 74, height: 36 },
    density: 0.004,
    restitution: 0.22,
    friction: 0.7,
    frictionAir: 0.004,
    material: "soft",
    tip: "Confiável e fedido.",
  },
  balao: {
    id: "balao",
    name: "Balão d'água",
    tex: "balloon",
    shape: { type: "circle", radius: 30 },
    density: 0.0022,
    restitution: 0.3,
    friction: 0.4,
    frictionAir: 0.008,
    material: "water",
    tip: "Estoura e empurra tudo em volta.",
  },
  pneu: {
    id: "pneu",
    name: "Pneu de bicicleta",
    tex: "tire",
    shape: { type: "circle", radius: 37 },
    density: 0.009,
    restitution: 0.5,
    friction: 0.9,
    frictionAir: 0.002,
    material: "rubber",
    tip: "Pesado. Derruba pilhas inteiras.",
  },
  pato: {
    id: "pato",
    name: "Pato de borracha",
    tex: "duck",
    shape: { type: "circle", radius: 29 },
    density: 0.0016,
    restitution: 0.88,
    friction: 0.3,
    frictionAir: 0.004,
    material: "squeaky",
    tip: "Quica em tudo. QUÉ!",
  },
};

export const AMMO: ProjectileId[] = ["tenis", "balao", "pneu", "pato", "tenis", "pneu"];

export type BodyDef = {
  id: string;
  tex: string;
  x: number;
  y: number;
  w: number;
  h: number;
  density: number;
  friction?: number;
  restitution?: number;
  chamfer?: number;
  material: "ceramic" | "wood" | "metal" | "rubber" | "plastic";
};

export type TargetDef = BodyDef & { points: number; name: string; shout: string; fem?: boolean };

export const TARGETS: TargetDef[] = [
  {
    id: "gnomo",
    tex: "gnome",
    x: 760,
    y: 787,
    w: 54,
    h: 98,
    density: 0.0016,
    chamfer: 8,
    material: "ceramic",
    points: 100,
    name: "Gnomo de jardim",
    shout: "MEU GNOMO!",
  },
  {
    id: "flamingo",
    tex: "flamingo",
    x: 1050,
    y: 749,
    w: 44,
    h: 148,
    density: 0.0012,
    chamfer: 6,
    material: "plastic",
    points: 150,
    name: "Flamingo de plástico",
    shout: "O FLAMINGO NÃO!",
  },
  {
    id: "dourado",
    tex: "gnome-gold",
    x: 1462,
    y: 591,
    w: 54,
    h: 98,
    density: 0.0016,
    chamfer: 8,
    material: "ceramic",
    points: 300,
    name: "Gnomo dourado",
    shout: "O GNOMO DE OURO?!",
  },
  {
    id: "correio",
    tex: "mailbox",
    x: 1603,
    y: 769,
    w: 80,
    h: 60,
    density: 0.0014,
    chamfer: 6,
    material: "metal",
    points: 150,
    name: "Caixa de correio",
    fem: true,
    shout: "MINHAS CARTAS!",
  },
  {
    id: "passarinho",
    tex: "birdhouse",
    x: 1736,
    y: 380,
    w: 66,
    h: 80,
    density: 0.0012,
    chamfer: 4,
    material: "wood",
    points: 200,
    name: "Casinha de passarinho",
    fem: true,
    shout: "OS PASSARINHOS!",
  },
];

export const PROPS: BodyDef[] = [
  { id: "pneu-1", tex: "tire-flat", x: 760, y: 930, w: 134, h: 38, density: 0.0025, friction: 0.95, chamfer: 14, material: "rubber" },
  { id: "pneu-2", tex: "tire-flat", x: 764, y: 892, w: 134, h: 38, density: 0.0025, friction: 0.95, chamfer: 14, material: "rubber" },
  { id: "pneu-3", tex: "tire-flat", x: 758, y: 854, w: 134, h: 38, density: 0.0025, friction: 0.95, chamfer: 14, material: "rubber" },
  { id: "lata-1", tex: "trash-can", x: 980, y: 896, w: 66, h: 106, density: 0.002, chamfer: 4, material: "metal" },
  { id: "lata-2", tex: "trash-can", x: 1140, y: 896, w: 66, h: 106, density: 0.002, chamfer: 4, material: "metal" },
  { id: "tabua", tex: "plank", x: 1060, y: 833, w: 266, h: 20, density: 0.002, chamfer: 3, material: "wood" },
  { id: "caixa-3", tex: "crate", x: 1150, y: 786, w: 74, h: 74, density: 0.0022, chamfer: 3, material: "wood" },
  { id: "caixa-1", tex: "crate", x: 1300, y: 603, w: 74, h: 74, density: 0.0022, chamfer: 3, material: "wood" },
  { id: "caixa-2", tex: "crate", x: 1376, y: 603, w: 74, h: 74, density: 0.0022, chamfer: 3, material: "wood" },
  { id: "caixa-4", tex: "crate", x: 1338, y: 529, w: 74, h: 74, density: 0.0022, chamfer: 3, material: "wood" },
];

export const STATICS = [
  { x: W / 2, y: GROUND_Y + 80, w: W + 800, h: 160, label: "chao" },
  { x: -70, y: H / 2 - 600, w: 140, h: H + 1600, label: "parede" },
  { x: W + 70, y: H / 2 - 600, w: 140, h: H + 1600, label: "parede" },
  { x: 1380, y: 653, w: 260, h: 26, label: "plataforma" },
  { x: 1280, y: 808, w: 24, h: 290, label: "poste" },
  { x: 1480, y: 808, w: 24, h: 290, label: "poste" },
  { x: 1605, y: 876, w: 22, h: 152, label: "poste" },
  { x: 1750, y: 430, w: 104, h: 20, label: "galho" },
  { x: 1818, y: 700, w: 62, h: 500, label: "tronco" },
];

export const SCORE = {
  messBonus: 25,
  comboBonus: 100,
  ammoBonus: 250,
  twoStars: 1300,
  threeStars: 1750,
  record: 2000,
};
