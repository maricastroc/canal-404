import type { Grid } from "../sim/grid";

export type Orientation = "landscape" | "portrait";

export type Rect = { x: number; y: number; w: number; h: number };

export type View = { x0: number; y0: number; x1: number; y1: number };

export type Layout = {
  orientation: Orientation;
  W: number;
  H: number;
  map: Rect;
  board: Rect;
  frame: Rect;
  scroll: boolean;
  overview: number;
  view: View;
  tile: number;
  ox: number;
  oy: number;
  notebook: Rect;
};

export const CANVAS: Record<Orientation, { W: number; H: number }> = { landscape: { W: 1920, H: 1080 }, portrait: { W: 1080, H: 1650 } };

const SIDE_PAD = 0.2;
const TOP_PAD = 1;
const BOTTOM_PAD = 0.3;
const MAX_TILE = 200;
const MIN_TILE: Record<Orientation, number> = { landscape: 164, portrait: 126 };

export function boardView(grid: Grid): View {
  let minX = grid.w;
  let minY = grid.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (grid.tiles[y * grid.w + x] === "#") continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return {
    x0: Math.max(0, minX - SIDE_PAD),
    y0: Math.max(0, minY - TOP_PAD),
    x1: Math.min(grid.w, maxX + 1 + SIDE_PAD),
    y1: Math.min(grid.h, maxY + 1 + BOTTOM_PAD),
  };
}

export function computeLayout(orientation: Orientation, grid: Grid): Layout {
  const { W, H } = CANVAS[orientation];
  const map: Rect = orientation === "landscape" ? { x: 12, y: 12, w: 1404, h: 1056 } : { x: 12, y: 12, w: 1056, h: 708 };
  const notebook: Rect = orientation === "landscape" ? { x: 1428, y: 12, w: 480, h: 1056 } : { x: 20, y: 734, w: 1040, h: 896 };
  const view = boardView(grid);
  const vw = view.x1 - view.x0;
  const vh = view.y1 - view.y0;
  const fit = Math.min(map.w / vw, map.h / vh);
  const tile = Math.floor(Math.min(MAX_TILE, Math.max(fit, MIN_TILE[orientation])));
  const bw = Math.round(vw * tile);
  const bh = Math.round(vh * tile);
  const fitsX = bw <= map.w;
  const fitsY = bh <= map.h;
  const board: Rect = { x: fitsX ? Math.round(map.x + (map.w - bw) / 2) : map.x, y: fitsY ? Math.round(map.y + (map.h - bh) / 2) : map.y, w: bw, h: bh };
  const frame: Rect = { x: board.x, y: board.y, w: Math.min(bw, map.w), h: Math.min(bh, map.h) };
  const scroll = !fitsX || !fitsY;
  const overview = Math.min(1, frame.w / bw, frame.h / bh);
  const ox = Math.round(board.x - view.x0 * tile);
  const oy = Math.round(board.y - view.y0 * tile);
  return { orientation, W, H, map, board, frame, scroll, overview, view, tile, ox, oy, notebook };
}

export function tileCenter(layout: Layout, x: number, y: number) {
  return { x: layout.ox + (x + 0.5) * layout.tile, y: layout.oy + (y + 0.5) * layout.tile };
}

export function wobble(seed: number) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
