import type { CSSProperties } from "react";

export const SCENE = { w: 1600, h: 900 } as const;

export type Spot = { x: number; y: number; w: number; h: number };

export const SPOTS = {
  lamp: { x: 572, y: 0, w: 130, h: 240 },
  plane: { x: 386, y: 0, w: 190, h: 140 },
  window: { x: 6, y: 80, w: 352, h: 372 },
  radio: { x: 334, y: 446, w: 172, h: 120 },
  lava: { x: 508, y: 396, w: 56, h: 170 },
  tv: { x: 600, y: 250, w: 480, h: 400 },
  mascot: { x: 742, y: 90, w: 196, h: 196 },
  vhs: { x: 856, y: 670, w: 236, h: 124 },
  arcade: { x: 1150, y: 196, w: 280, h: 664 },
  posterChaos: { x: 366, y: 150, w: 150, h: 190 },
  posterDream: { x: 1448, y: 56, w: 140, h: 320 },
  trophy: { x: 1214, y: 50, w: 84, h: 122 },
  cat: { x: 352, y: 690, w: 282, h: 208 },
  hiddenCart: { x: 324, y: 818, w: 66, h: 50 },
  pizza: { x: 636, y: 800, w: 156, h: 86 },
  controllers: { x: 772, y: 806, w: 180, h: 70 },
  cartridges: { x: 958, y: 796, w: 166, h: 78 },
  books: { x: 1060, y: 706, w: 100, h: 126 },
  onAir: { x: 1000, y: 40, w: 150, h: 70 },
  skate: { x: 1236, y: 846, w: 168, h: 52 },
} satisfies Record<string, Spot>;

export type SpotName = keyof typeof SPOTS;

export function spotStyle(spot: Spot): CSSProperties {
  return {
    left: `${(spot.x / SCENE.w) * 100}%`,
    top: `${(spot.y / SCENE.h) * 100}%`,
    width: `${(spot.w / SCENE.w) * 100}%`,
    height: `${(spot.h / SCENE.h) * 100}%`,
  };
}

export function spotCenter(spot: Spot) {
  return { x: spot.x + spot.w / 2, y: spot.y + spot.h / 2 };
}
