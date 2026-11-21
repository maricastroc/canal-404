export type CartId = "deco" | "bruno" | "lina" | "mila";

export const CART_IDS: readonly CartId[] = ["deco", "bruno", "lina", "mila"];

export type CartRules = {
  crashTime: number;
  drag: number;
  rolling: number;
  pop: number;
  perfectTol: number;
  spin: number;
  rightSelf: number;
  floor: number;
  fanPush: number;
  hitLoss: number;
  puddle: number;
  bumpy: boolean;
  jumpLine: boolean;
};

export const NEUTRAL_RULES: Readonly<CartRules> = Object.freeze({
  crashTime: 1,
  drag: 1,
  rolling: 1,
  pop: 1,
  perfectTol: 0,
  spin: 1,
  rightSelf: 0,
  floor: 0,
  fanPush: 0,
  hitLoss: 1,
  puddle: -380,
  bumpy: false,
  jumpLine: false,
});

export const CART_RULES: Readonly<Record<CartId, Readonly<CartRules>>> = Object.freeze({
  deco: Object.freeze({ ...NEUTRAL_RULES, crashTime: 0.6 }),
  bruno: Object.freeze({ ...NEUTRAL_RULES, drag: 1.03, pop: 0.95, perfectTol: 4, rightSelf: 120, jumpLine: true }),
  lina: Object.freeze({ ...NEUTRAL_RULES, drag: 1.04, pop: 0.97, spin: 0.65, floor: 800, fanPush: 120, hitLoss: 0.6 }),
  mila: Object.freeze({ ...NEUTRAL_RULES, drag: 1.05, rolling: 0.6, pop: 1.08, perfectTol: -6, spin: 1.5, puddle: 520, bumpy: true }),
});

export const UNLOCKS: Readonly<Record<CartId, { course: "arlindo" | "feira" | "antena"; beat: CartId } | null>> = Object.freeze({
  deco: null,
  bruno: null,
  lina: { course: "feira", beat: "lina" },
  mila: { course: "antena", beat: "mila" },
});
