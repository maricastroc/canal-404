export const W = 1920;
export const H = 1080;

export type KidId = "lia" | "nico" | "bia";
export const KIDS: KidId[] = ["lia", "nico", "bia"];

export const KID_INFO: Record<KidId, { name: string; title: string; color: number; css: string; pale: number; tint: number }> = {
  lia: { name: "Lia", title: "A veloz", color: 0x3fae6a, css: "#3fae6a", pale: 0xfff3b0, tint: 0xd9f7e2 },
  nico: { name: "Nico", title: "O atirador", color: 0x8a6fd6, css: "#8a6fd6", pale: 0xe2d8ff, tint: 0xe6ddff },
  bia: { name: "Bia", title: "A resistente", color: 0xf06ba8, css: "#f06ba8", pale: 0xffd2e6, tint: 0xffdcec },
};

export type KidStats = { speed: number; cooldown: number; regenDelay: number; regenEvery: number; bars: [number, number, number] };

export const STATS: Record<KidId, KidStats> = {
  lia: { speed: 450, cooldown: 760, regenDelay: 3600, regenEvery: 2300, bars: [5, 2, 3] },
  nico: { speed: 330, cooldown: 470, regenDelay: 3600, regenEvery: 2300, bars: [2, 5, 3] },
  bia: { speed: 380, cooldown: 640, regenDelay: 2200, regenEvery: 1350, bars: [3, 3, 5] },
};

export const HP = 10;
export const ACCEL = 3400;
export const KID_SCALE = 1.08;
export const SPRITE_ORIGIN_Y = 212 / 224;
export const FOOT = { rx: 36, ry: 19 };
export const BODY = { rx: 48, ry: 32 };

export const PILLOW = { speed: 1000, range: 860, windup: 130, lift: 96, radius: 26 };
export const HIT = { stun: 230, invuln: 560, invulnPlayer: 850, knock: 300 };
export const ESCALATE = { heat: 40000, final: 70000 };

export const SCORE = { hit: 100, ko: 250, win: 1000, hp: 50, second: 300 };

export const PILLOW_ANCHORS: Record<string, { x: number; y: number; angle: number; layer: "front" | "back" }> = {
  "idle-f": { x: 51, y: -62, angle: 18, layer: "front" },
  "run-a-f": { x: 43, y: -58, angle: 10, layer: "front" },
  "run-c-f": { x: 29, y: -70, angle: -6, layer: "front" },
  "run-b-f": { x: 39, y: -64, angle: 6, layer: "front" },
  "run-d-f": { x: 37, y: -70, angle: 2, layer: "front" },
  "run-b-k": { x: 39, y: -62, angle: 8, layer: "back" },
  "run-d-k": { x: 37, y: -68, angle: 2, layer: "back" },
  "windup-f": { x: -5, y: -178, angle: -14, layer: "back" },
  "idle-k": { x: 37, y: -56, angle: 12, layer: "back" },
  "run-a-k": { x: 39, y: -58, angle: 10, layer: "back" },
  "run-c-k": { x: 37, y: -70, angle: -4, layer: "back" },
  "windup-k": { x: 1, y: -172, angle: 10, layer: "front" },
  "idle-s": { x: 25, y: -62, angle: 12, layer: "front" },
  "run-a-s": { x: -31, y: -96, angle: -30, layer: "front" },
  "run-b-s": { x: -11, y: -62, angle: -6, layer: "front" },
  "run-c-s": { x: 43, y: -96, angle: 16, layer: "front" },
  "run-d-s": { x: 27, y: -62, angle: 10, layer: "front" },
  "windup-s": { x: -37, y: -140, angle: -30, layer: "back" },
  "cheer": { x: 65, y: -154, angle: -20, layer: "front" },
};

export type Dir = "f" | "k" | "s";
export const DIRS: Dir[] = ["f", "k", "s"];
export const MOVES = ["idle", "run-a", "run-b", "run-c", "run-d", "windup", "throw"] as const;
export type Move = (typeof MOVES)[number];
export type Pose = `${Move}-${Dir}` | "hurt" | "ko" | "cheer";
export const POSES: Pose[] = [...MOVES.flatMap((m) => DIRS.map((d) => `${m}-${d}` as Pose)), "hurt", "ko", "cheer"];
