export type Params = {
  gravity: number;
  slopeGain: number;
  drag: number;
  rolling: number;
  minSpeed: number;
  crouchBoost: number;
  crouchDrag: number;
  crouchStick: number;
  cobbleStand: number;
  cobbleCrouch: number;
  popBase: number;
  popCharge: number;
  chargeTime: number;
  lipBonus: number;
  spinMax: number;
  spinAccel: number;
  autoAlign: number;
  perfectTol: number;
  okTol: number;
  okLoss: number;
  perfectKeep: number;
  perfectBonus: number;
  flipBonus: number;
  crashTime: number;
  crashKeep: number;
  hitLoss: number;
};

export const DEFAULT_PARAMS: Readonly<Params> = Object.freeze({
  gravity: 2400,
  slopeGain: 1,
  drag: 24,
  rolling: 40,
  minSpeed: 260,
  crouchBoost: 0.3,
  crouchDrag: 0.25,
  crouchStick: 0.25,
  cobbleStand: 360,
  cobbleCrouch: 130,
  popBase: 380,
  popCharge: 400,
  chargeTime: 0.35,
  lipBonus: 0.1,
  spinMax: 420,
  spinAccel: 2600,
  autoAlign: 25,
  perfectTol: 14,
  okTol: 38,
  okLoss: 0.2,
  perfectKeep: 0.7,
  perfectBonus: 110,
  flipBonus: 160,
  crashTime: 1.1,
  crashKeep: 0.3,
  hitLoss: 0.22,
});

export type ParamGroup = "physics" | "crouch" | "jump" | "spin" | "landing" | "crash";

export type ParamUnit = "px/s²" | "px/s" | "%" | "°" | "°/s" | "°/s²" | "s" | "×";

export type ParamSpec = { key: keyof Params; group: ParamGroup; min: number; max: number; step: number; unit: ParamUnit };

export const PARAM_SPECS: readonly ParamSpec[] = [
  { key: "gravity", group: "physics", min: 1200, max: 4000, step: 50, unit: "px/s²" },
  { key: "slopeGain", group: "physics", min: 0.5, max: 1.8, step: 0.05, unit: "×" },
  { key: "drag", group: "physics", min: 4, max: 30, step: 1, unit: "×" },
  { key: "rolling", group: "physics", min: 0, max: 200, step: 5, unit: "px/s²" },
  { key: "minSpeed", group: "physics", min: 100, max: 600, step: 10, unit: "px/s" },
  { key: "cobbleStand", group: "physics", min: 0, max: 1200, step: 20, unit: "px/s²" },
  { key: "cobbleCrouch", group: "physics", min: 0, max: 800, step: 20, unit: "px/s²" },
  { key: "crouchBoost", group: "crouch", min: 0, max: 1, step: 0.05, unit: "%" },
  { key: "crouchDrag", group: "crouch", min: 0, max: 0.8, step: 0.05, unit: "%" },
  { key: "crouchStick", group: "crouch", min: 0, max: 2, step: 0.1, unit: "%" },
  { key: "popBase", group: "jump", min: 200, max: 1000, step: 20, unit: "px/s" },
  { key: "popCharge", group: "jump", min: 0, max: 1200, step: 20, unit: "px/s" },
  { key: "chargeTime", group: "jump", min: 0.1, max: 1, step: 0.05, unit: "s" },
  { key: "lipBonus", group: "jump", min: 0, max: 0.4, step: 0.01, unit: "%" },
  { key: "spinMax", group: "spin", min: 120, max: 900, step: 10, unit: "°/s" },
  { key: "spinAccel", group: "spin", min: 400, max: 6000, step: 100, unit: "°/s²" },
  { key: "autoAlign", group: "spin", min: 0, max: 120, step: 5, unit: "°/s" },
  { key: "perfectTol", group: "landing", min: 4, max: 30, step: 1, unit: "°" },
  { key: "okTol", group: "landing", min: 15, max: 70, step: 1, unit: "°" },
  { key: "okLoss", group: "landing", min: 0, max: 0.6, step: 0.02, unit: "%" },
  { key: "perfectKeep", group: "landing", min: 0, max: 1, step: 0.05, unit: "%" },
  { key: "perfectBonus", group: "landing", min: 0, max: 400, step: 10, unit: "px/s" },
  { key: "flipBonus", group: "landing", min: 0, max: 500, step: 10, unit: "px/s" },
  { key: "crashTime", group: "crash", min: 0.3, max: 3, step: 0.1, unit: "s" },
  { key: "crashKeep", group: "crash", min: 0, max: 1, step: 0.05, unit: "%" },
  { key: "hitLoss", group: "crash", min: 0, max: 0.6, step: 0.02, unit: "%" },
];

export function cloneParams(p: Readonly<Params>): Params {
  return { ...p };
}
