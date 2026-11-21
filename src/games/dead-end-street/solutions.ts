import type { PhaseId } from "./phases";
import type { Launch } from "./sim";

export const SOLUTIONS: Record<PhaseId, Launch[]> = {
  "warm-up": [{ at: 30, angle: 0, power: 960, ammo: "shoe" }],
  "sharp-aim": [{ at: 30, angle: 2400, power: 880, ammo: "shoe" }],
  "up-high": [
    { at: 30, angle: 3800, power: 800, ammo: "shoe" },
    { at: 271, angle: 3800, power: 840, ammo: "tire" },
  ],
  domino: [{ at: 30, angle: 800, power: 880, ammo: "tire" }],
  "surprise-bath": [
    { at: 30, angle: 2400, power: 880, ammo: "duck" },
    { at: 256, angle: -600, power: 560, ammo: "balloon" },
  ],
  "blocked-path": [
    { at: 30, angle: 6800, power: 640, ammo: "duck" },
    { at: 373, angle: 4600, power: 880, ammo: "duck" },
    { at: 685, angle: 4200, power: 680, ammo: "balloon" },
  ],
  counterattack: [
    { at: 30, angle: 4400, power: 680, ammo: "shoe" },
    { at: 248, angle: 600, power: 800, ammo: "balloon" },
  ],
  "free-for-all": [
    { at: 30, angle: 5600, power: 560, ammo: "duck" },
    { at: 344, angle: 5200, power: 680, ammo: "duck" },
    { at: 666, angle: 6800, power: 760, ammo: "balloon" },
  ],
  "grand-mess": [
    { at: 30, angle: 3400, power: 400, ammo: "duck" },
    { at: 285, angle: 1400, power: 960, ammo: "tire" },
  ],
};
