import type { PlacedPart } from "./geometry";

export const SOLUTIONS: Record<string, PlacedPart[]> = {
  test: [{ type: "ramp", x: 680, y: 560, rot: 4 }],
  pixel: [{ type: "ramp", x: 620, y: 420, rot: 4 }],
  toast: [{ type: "spring", x: 640, y: 640, rot: 3 }],
  juice: [{ type: "fan", x: 160, y: 580, rot: 0 }],
  remote: [
    { type: "belt", x: 1140, y: 600, rot: 1 },
    { type: "belt", x: 820, y: 640, rot: 1 },
  ],
  finale: [
    { type: "spring", x: 580, y: 400, rot: 3 },
    { type: "belt", x: 1380, y: 540, rot: 0 },
  ],
};

export const STEPS_BEFORE_EXTRACTION: Record<string, number> = {
  test: 235,
  pixel: 256,
  toast: 242,
  juice: 112,
  remote: 241,
  finale: 295,
};
