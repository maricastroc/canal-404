export type Orientation = "landscape" | "portrait";

export type Rect = { x: number; y: number; w: number; h: number };

export type Layout = {
  orientation: Orientation;
  W: number;
  H: number;
  map: Rect;
  tile: number;
  ox: number;
  oy: number;
  notebook: Rect;
};

export const CANVAS: Record<Orientation, { W: number; H: number }> = { landscape: { W: 1920, H: 1080 }, portrait: { W: 1080, H: 1650 } };

export function computeLayout(orientation: Orientation, cols: number, rows: number): Layout {
  const { W, H } = CANVAS[orientation];
  const map: Rect = orientation === "landscape" ? { x: 30, y: 30, w: 1250, h: 1020 } : { x: 24, y: 20, w: 1032, h: 680 };
  const notebook: Rect = orientation === "landscape" ? { x: 1310, y: 26, w: 584, h: 1028 } : { x: 24, y: 722, w: 1032, h: 900 };
  const tile = Math.floor(Math.min(map.w / cols, map.h / rows, 120));
  const ox = Math.round(map.x + (map.w - tile * cols) / 2);
  const oy = Math.round(map.y + (map.h - tile * rows) / 2);
  return { orientation, W, H, map, tile, ox, oy, notebook };
}

export function tileCenter(layout: Layout, x: number, y: number) {
  return { x: layout.ox + (x + 0.5) * layout.tile, y: layout.oy + (y + 0.5) * layout.tile };
}

export function wobble(seed: number) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
