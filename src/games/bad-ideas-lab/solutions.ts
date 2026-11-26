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
  kibble: [
    { type: "belt", x: 1340, y: 560, rot: 1 },
    { type: "ramp", x: 940, y: 680, rot: 3 },
  ],
  vinyl: [
    { type: "spring", x: 620, y: 860, rot: 2 },
    { type: "fan", x: 420, y: 220, rot: 0 },
  ],
  strike: [
    { type: "fan", x: 600, y: 680, rot: 0 },
    { type: "ramp", x: 1220, y: 760, rot: 1 },
  ],
  chain: [
    { type: "belt", x: 880, y: 840, rot: 0 },
    { type: "spring", x: 1080, y: 880, rot: 2 },
    { type: "fan", x: 960, y: 240, rot: 0 },
  ],
};

export const GOLDEN_STEPS: Record<string, number> = {
  test: 235,
  pixel: 256,
  toast: 242,
  juice: 112,
  remote: 241,
  finale: 295,
  kibble: 404,
  vinyl: 181,
  strike: 220,
  chain: 266,
};
