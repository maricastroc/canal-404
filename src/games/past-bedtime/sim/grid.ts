import { DX, DY, type Dir, type LevelDef, type Point } from "./types";

export type Grid = {
  level: LevelDef;
  w: number;
  h: number;
  tiles: string[];
  start: Point;
  goal: Point;
  cones: Map<number, number[]>;
};

export function buildGrid(level: LevelDef): Grid {
  const h = level.map.length;
  const w = level.map[0].length;
  const tiles: string[] = [];
  let start: Point = { x: 0, y: 0 };
  let goal: Point = { x: 0, y: 0 };
  for (let y = 0; y < h; y += 1) {
    const row = level.map[y];
    if (row.length !== w) throw new Error(`${level.id}: row ${y} has ${row.length} tiles, expected ${w}`);
    for (let x = 0; x < w; x += 1) {
      const c = row[x];
      if (c === "B") start = { x, y };
      if (c === "G") goal = { x, y };
      tiles.push(c === "B" ? "." : c);
    }
  }
  return { level, w, h, tiles, start, goal, cones: new Map() };
}

export function tileAt(grid: Grid, x: number, y: number) {
  if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return "#";
  return grid.tiles[y * grid.w + x];
}

export function isWall(grid: Grid, x: number, y: number) {
  return tileAt(grid, x, y) === "#";
}

export function isOpaque(grid: Grid, x: number, y: number) {
  const t = tileAt(grid, x, y);
  return t === "#" || t === "o";
}

export function isFloor(grid: Grid, x: number, y: number) {
  const t = tileAt(grid, x, y);
  return t === "." || t === "~" || t === "G" || t === "h";
}

export function isHiding(grid: Grid, x: number, y: number) {
  return tileAt(grid, x, y) === "h";
}

export function isCreaky(grid: Grid, x: number, y: number) {
  return tileAt(grid, x, y) === "~";
}

function lineClear(grid: Grid, x0: number, y0: number, x1: number, y1: number) {
  const ax = x0 + 0.5;
  const ay = y0 + 0.5;
  const bx = x1 + 0.5;
  const by = y1 + 0.5;
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 16;
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor(ax + (bx - ax) * t);
    const ty = Math.floor(ay + (by - ay) * t);
    if ((tx === x0 && ty === y0) || (tx === x1 && ty === y1)) continue;
    if (isOpaque(grid, tx, ty)) return false;
  }
  return true;
}

export function coneTiles(grid: Grid, x: number, y: number, facing: Dir, range: number, wide: boolean): number[] {
  const key = (((y * grid.w + x) * 4 + facing) * 16 + range) * 2 + (wide ? 1 : 0);
  const cached = grid.cones.get(key);
  if (cached) return cached;
  const out: number[] = [];
  const fx = DX[facing];
  const fy = DY[facing];
  const lx = -fy;
  const ly = fx;
  for (let d = 1; d <= range; d += 1) {
    const spread = wide ? Math.ceil(d / 2) : Math.floor(d / 2);
    for (let l = -spread; l <= spread; l += 1) {
      const tx = x + fx * d + lx * l;
      const ty = y + fy * d + ly * l;
      if (tx < 0 || ty < 0 || tx >= grid.w || ty >= grid.h) continue;
      if (isOpaque(grid, tx, ty)) continue;
      if (!lineClear(grid, x, y, tx, ty)) continue;
      out.push(ty * grid.w + tx);
    }
  }
  grid.cones.set(key, out);
  return out;
}

export function noiseDistances(grid: Grid, x: number, y: number, max: number): Map<number, number> {
  const dist = new Map<number, number>();
  const queue: number[] = [y * grid.w + x];
  dist.set(queue[0], 0);
  for (let i = 0; i < queue.length; i += 1) {
    const cur = queue[i];
    const d = dist.get(cur)!;
    if (d >= max) continue;
    const cx = cur % grid.w;
    const cy = (cur - cx) / grid.w;
    for (let k = 0; k < 4; k += 1) {
      const nx = cx + DX[k];
      const ny = cy + DY[k];
      if (isWall(grid, nx, ny)) continue;
      const n = ny * grid.w + nx;
      if (dist.has(n)) continue;
      dist.set(n, d + 1);
      queue.push(n);
    }
  }
  return dist;
}

export function pathTo(grid: Grid, from: Point, to: Point, blocked: (x: number, y: number) => boolean): Point[] | null {
  if (from.x === to.x && from.y === to.y) return [];
  const size = grid.w * grid.h;
  const prev = new Int32Array(size).fill(-1);
  const startIdx = from.y * grid.w + from.x;
  const goalIdx = to.y * grid.w + to.x;
  prev[startIdx] = startIdx;
  const queue: number[] = [startIdx];
  let found = false;
  for (let i = 0; i < queue.length && !found; i += 1) {
    const cur = queue[i];
    const cx = cur % grid.w;
    const cy = (cur - cx) / grid.w;
    for (let k = 0; k < 4; k += 1) {
      const nx = cx + DX[k];
      const ny = cy + DY[k];
      if (!isFloor(grid, nx, ny)) continue;
      const n = ny * grid.w + nx;
      if (prev[n] !== -1) continue;
      if (n !== goalIdx && blocked(nx, ny)) continue;
      prev[n] = cur;
      if (n === goalIdx) {
        found = true;
        break;
      }
      queue.push(n);
    }
  }
  if (!found) return null;
  const path: Point[] = [];
  for (let cur = goalIdx; cur !== startIdx; cur = prev[cur]) path.push({ x: cur % grid.w, y: Math.floor(cur / grid.w) });
  return path.reverse();
}

export function firstStep(grid: Grid, from: Point, to: Point, blocked: (x: number, y: number) => boolean): Point | null {
  const path = pathTo(grid, from, to, blocked);
  if (!path || path.length === 0) return null;
  return blocked(path[0].x, path[0].y) ? null : path[0];
}

export function dirTo(fromX: number, fromY: number, toX: number, toY: number, fallback: Dir): Dir {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx === 0 && dy === 0) return fallback;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 1 : 3;
  return dy > 0 ? 2 : 0;
}
