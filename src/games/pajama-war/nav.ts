import type { ArenaDef } from "./arenas";
import { FOOT, H, W } from "./config";

export type Point = { x: number; y: number };
export type Rect = { x0: number; y0: number; x1: number; y1: number };
export type Fort = { hp: number; max: number };
export type Box = Rect & { tall: boolean; bouncy: boolean; solid: boolean; index: number; fort?: Fort };
export type Body = { x: number; y: number; vx: number; vy: number };

export const CELL = 20;
export const NAV_PAD = 10;
export const SHOT_PAD = 8;
export const WALL_GAP = 70;
export const FLOOR_Y = 0.86;
export const BOUNCE = { max: 1, bonus: 260, slow: 0.92 };

export function arenaBoxes(def: ArenaDef): Box[] {
  const boxes: Box[] = [];
  def.props.forEach((p, index) => {
    if (p.surface) boxes.push({ x0: p.surface.x0, x1: p.surface.x1, y0: p.surface.y - 4, y1: p.surface.y + 4, tall: true, bouncy: true, solid: false, index });
    const b = p.block;
    if (!b) return;
    const cx = p.x + (b.dx ?? 0);
    const by = p.y + (b.dy ?? 0);
    const fort = p.fort ? { fort: { hp: p.fort, max: p.fort } } : {};
    if (b.tall && b.shot !== undefined) {
      boxes.push({ x0: cx - b.w / 2, x1: cx + b.w / 2, y0: by - b.h, y1: by, tall: false, bouncy: false, solid: true, index });
      boxes.push({ x0: cx - b.shot / 2, x1: cx + b.shot / 2, y0: by - b.h, y1: by, tall: true, bouncy: Boolean(p.bounce), solid: false, index, ...fort });
      return;
    }
    boxes.push({ x0: cx - b.w / 2, x1: cx + b.w / 2, y0: by - b.h, y1: by, tall: Boolean(b.tall), bouncy: Boolean(p.bounce), solid: true, index, ...fort });
  });
  return boxes;
}

export function solidBoxes(boxes: readonly Box[]) {
  return boxes.filter((b) => b.solid);
}

export function resolveBody(f: Body, bounds: Rect, boxes: readonly Rect[]) {
  let touched = false;
  if (f.x < bounds.x0 || f.x > bounds.x1 || f.y < bounds.y0 || f.y > bounds.y1) touched = true;
  f.x = Math.min(bounds.x1, Math.max(bounds.x0, f.x));
  f.y = Math.min(bounds.y1, Math.max(bounds.y0, f.y));
  for (const blk of boxes) {
    const x0 = blk.x0 - FOOT.rx;
    const x1 = blk.x1 + FOOT.rx;
    const y0 = blk.y0 - FOOT.ry;
    const y1 = blk.y1 + FOOT.ry;
    if (f.x <= x0 || f.x >= x1 || f.y <= y0 || f.y >= y1) continue;
    touched = true;
    const left = x0 >= bounds.x0 ? f.x - x0 : Infinity;
    const right = x1 <= bounds.x1 ? x1 - f.x : Infinity;
    const top = y0 >= bounds.y0 ? f.y - y0 : Infinity;
    const bottom = y1 <= bounds.y1 ? y1 - f.y : Infinity;
    const m = Math.min(left, right, top, bottom);
    if (m === left) {
      f.x = x0;
      f.vx = Math.min(0, f.vx);
    } else if (m === right) {
      f.x = x1;
      f.vx = Math.max(0, f.vx);
    } else if (m === top) {
      f.y = y0;
      f.vy = Math.min(0, f.vy);
    } else {
      f.y = y1;
      f.vy = Math.max(0, f.vy);
    }
  }
  f.x = Math.min(bounds.x1, Math.max(bounds.x0, f.x));
  f.y = Math.min(bounds.y1, Math.max(bounds.y0, f.y));
  return touched;
}

export function separateBodies(bodies: readonly Body[]) {
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const c = bodies[j];
      const dx = (c.x - a.x) / (FOOT.rx * 2);
      const dy = (c.y - a.y) / (FOOT.ry * 2);
      const d = Math.hypot(dx, dy);
      if (d >= 1 || d === 0) continue;
      const push = (1 - d) * 0.5;
      a.x -= (dx / d) * push * FOOT.rx * 2;
      a.y -= (dy / d) * push * FOOT.ry * 2;
      c.x += (dx / d) * push * FOOT.rx * 2;
      c.y += (dy / d) * push * FOOT.ry * 2;
    }
  }
}

export let hitSide = -1;

export function segmentEntry(ax: number, ay: number, bx: number, by: number, x0: number, y0: number, x1: number, y1: number) {
  hitSide = -1;
  if (ax > x0 && ax < x1 && ay > y0 && ay < y1) {
    const d = [ax - x0, x1 - ax, ay - y0, y1 - ay];
    let side = 0;
    for (let i = 1; i < 4; i += 1) if (d[i] < d[side]) side = i;
    hitSide = side;
    return 0;
  }
  const dx = bx - ax;
  const dy = by - ay;
  let t0 = 0;
  let t1 = 1;
  let side = -1;
  if (Math.abs(dx) < 1e-9) {
    if (ax <= x0 || ax >= x1) return -1;
  } else {
    let tn = (x0 - ax) / dx;
    let tf = (x1 - ax) / dx;
    let near = 0;
    if (tn > tf) {
      const s = tn;
      tn = tf;
      tf = s;
      near = 1;
    }
    if (tn > t0) {
      t0 = tn;
      side = near;
    }
    t1 = Math.min(t1, tf);
    if (t0 > t1) return -1;
  }
  if (Math.abs(dy) < 1e-9) {
    if (ay <= y0 || ay >= y1) return -1;
  } else {
    let tn = (y0 - ay) / dy;
    let tf = (y1 - ay) / dy;
    let near = 2;
    if (tn > tf) {
      const s = tn;
      tn = tf;
      tf = s;
      near = 3;
    }
    if (tn > t0) {
      t0 = tn;
      side = near;
    }
    t1 = Math.min(t1, tf);
    if (t0 > t1) return -1;
  }
  if (side === -1) return -1;
  hitSide = side;
  return t0;
}

export type ShotHit = { box: Box; t: number; side: number };

export function firstTallHit(boxes: readonly Box[], ax: number, ay: number, bx: number, by: number): ShotHit | null {
  let best: ShotHit | null = null;
  for (const box of boxes) {
    if (!box.tall) continue;
    const t = segmentEntry(ax, ay, bx, by, box.x0 - SHOT_PAD, box.y0 - SHOT_PAD, box.x1 + SHOT_PAD, box.y1 + SHOT_PAD);
    if (t < 0) continue;
    if (!best || t < best.t) best = { box, t, side: hitSide };
  }
  return best;
}

export function lineBlocked(boxes: readonly Box[], x0: number, y0: number, x1: number, y1: number) {
  for (const box of boxes) {
    if (!box.tall) continue;
    if (segmentEntry(x0, y0, x1, y1, box.x0 - SHOT_PAD, box.y0 - SHOT_PAD, box.x1 + SHOT_PAD, box.y1 + SHOT_PAD) >= 0) return true;
  }
  return false;
}

export function reflect(side: number, vx: number, vy: number): [number, number] {
  return side === 0 || side === 1 ? [-vx, vy] : [vx, -vy];
}

export type ShotTrace = {
  pts: Point[];
  bounce: { x: number; y: number; box: Box; side: number; at: number } | null;
  end: "range" | "wall" | "block" | "out";
  length: number;
};

export function traceShot(ox: number, oy: number, angle: number, boxes: readonly Box[], bounds: Rect, opts: { range: number; special?: boolean; bounces?: number }): ShotTrace {
  let dx = Math.cos(angle);
  let dy = Math.sin(angle) * FLOOR_Y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  let x = ox;
  let y = oy;
  let left = opts.range;
  let bounces = opts.bounces ?? BOUNCE.max;
  let total = 0;
  const pts: Point[] = [{ x, y }];
  let bounce: ShotTrace["bounce"] = null;
  for (let guard = 0; guard < 4; guard += 1) {
    let ex = x + dx * left;
    let ey = y + dy * left;
    let end: ShotTrace["end"] = "range";
    let k = 1;
    const wallY = bounds.y0 - WALL_GAP;
    if (ey < wallY && dy < 0) {
      const kw = (wallY - y) / (ey - y);
      if (kw < k) {
        k = kw;
        end = "wall";
      }
    }
    if (ex < 20 || ex > W - 20) {
      const kx = ((ex < 20 ? 20 : W - 20) - x) / (ex - x);
      if (kx < k) {
        k = kx;
        end = "out";
      }
    }
    if (ey > H + 30) {
      const ky = (H + 30 - y) / (ey - y);
      if (ky < k) {
        k = ky;
        end = "out";
      }
    }
    const hit = opts.special ? null : firstTallHit(boxes, x, y, ex, ey);
    if (hit && hit.t <= k) {
      const hx = x + (ex - x) * hit.t;
      const hy = y + (ey - y) * hit.t;
      const run = left * hit.t;
      total += run;
      pts.push({ x: hx, y: hy });
      if (hit.box.bouncy && bounces > 0) {
        bounces -= 1;
        bounce = { x: hx, y: hy, box: hit.box, side: hit.side, at: total };
        [dx, dy] = reflect(hit.side, dx, dy);
        x = hx + dx * 0.5;
        y = hy + dy * 0.5;
        left = left - run + BOUNCE.bonus;
        continue;
      }
      return { pts, bounce, end: "block", length: total };
    }
    ex = x + (ex - x) * k;
    ey = y + (ey - y) * k;
    total += left * k;
    pts.push({ x: ex, y: ey });
    return { pts, bounce, end, length: total };
  }
  return { pts, bounce, end: "range", length: total };
}

export function pointOnTrace(trace: ShotTrace, along: number, out: Point) {
  let walked = 0;
  for (let i = 1; i < trace.pts.length; i += 1) {
    const a = trace.pts[i - 1];
    const b = trace.pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (walked + seg >= along || i === trace.pts.length - 1) {
      const k = seg > 0 ? Math.min(1, Math.max(0, (along - walked) / seg)) : 0;
      out.x = a.x + (b.x - a.x) * k;
      out.y = a.y + (b.y - a.y) * k;
      return walked + seg >= along;
    }
    walked += seg;
  }
  out.x = trace.pts[trace.pts.length - 1].x;
  out.y = trace.pts[trace.pts.length - 1].y;
  return false;
}

export function traceReaches(trace: ShotTrace, x: number, y: number, rx: number, ry: number, from = 0) {
  let walked = 0;
  for (let i = 1; i < trace.pts.length; i += 1) {
    const a = trace.pts[i - 1];
    const b = trace.pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (walked + seg > from) {
      const sx = (b.x - a.x) / rx;
      const sy = (b.y - a.y) / ry;
      const px = (x - a.x) / rx;
      const py = (y - a.y) / ry;
      const l2 = sx * sx + sy * sy;
      const k = l2 > 0 ? Math.min(1, Math.max(0, (px * sx + py * sy) / l2)) : 0;
      const qx = px - sx * k;
      const qy = py - sy * k;
      if (qx * qx + qy * qy <= 1 && walked + seg * k >= from) return true;
    }
    walked += seg;
  }
  return false;
}

type Avoid = { x: number; y: number; r: number };

export class NavGrid {
  readonly cols: number;
  readonly rows: number;
  readonly free: Uint8Array;
  readonly region: Int32Array;
  readonly main: number;
  readonly stands: number[] = [];
  private g: Float32Array;
  private f: Float32Array;
  private from: Int32Array;
  private mark: Uint32Array;
  private shut: Uint32Array;
  private heap: Int32Array;
  private gen = 0;
  private cellsBuf: number[] = [];

  constructor(
    readonly bounds: Rect,
    readonly boxes: readonly Box[],
  ) {
    this.cols = Math.floor((bounds.x1 - bounds.x0) / CELL);
    this.rows = Math.floor((bounds.y1 - bounds.y0) / CELL);
    const n = this.cols * this.rows;
    this.free = new Uint8Array(n);
    this.region = new Int32Array(n).fill(-1);
    this.g = new Float32Array(n);
    this.f = new Float32Array(n);
    this.from = new Int32Array(n);
    this.mark = new Uint32Array(n);
    this.shut = new Uint32Array(n);
    this.heap = new Int32Array(n * 8 + 8);
    for (let i = 0; i < n; i += 1) {
      const c = this.centerX(i);
      const r = this.centerY(i);
      this.free[i] = this.clearAt(c, r, NAV_PAD) ? 1 : 0;
    }
    const sizes: number[] = [];
    const stack: number[] = [];
    for (let i = 0; i < n; i += 1) {
      if (!this.free[i] || this.region[i] !== -1) continue;
      const id = sizes.length;
      sizes.push(0);
      stack.push(i);
      this.region[i] = id;
      while (stack.length) {
        const cur = stack.pop()!;
        sizes[id] += 1;
        const cx = cur % this.cols;
        const cy = (cur / this.cols) | 0;
        const near = [cx > 0 ? cur - 1 : -1, cx < this.cols - 1 ? cur + 1 : -1, cy > 0 ? cur - this.cols : -1, cy < this.rows - 1 ? cur + this.cols : -1];
        for (const nb of near) {
          if (nb < 0 || !this.free[nb] || this.region[nb] !== -1) continue;
          this.region[nb] = id;
          stack.push(nb);
        }
      }
    }
    let main = 0;
    sizes.forEach((s, i) => {
      if (s > sizes[main]) main = i;
    });
    this.main = main;
    for (let i = 0; i < n; i += 1) {
      const cx = i % this.cols;
      const cy = (i / this.cols) | 0;
      if (cx % 3 === 1 && cy % 3 === 1 && this.walkable(i) && this.clearAt(this.centerX(i), this.centerY(i), NAV_PAD + 18)) this.stands.push(i);
    }
  }

  centerX(i: number) {
    return this.bounds.x0 + ((i % this.cols) + 0.5) * CELL;
  }

  centerY(i: number) {
    return this.bounds.y0 + (((i / this.cols) | 0) + 0.5) * CELL;
  }

  cellAt(x: number, y: number) {
    const cx = Math.floor((x - this.bounds.x0) / CELL);
    const cy = Math.floor((y - this.bounds.y0) / CELL);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return -1;
    return cy * this.cols + cx;
  }

  walkable(i: number) {
    return i >= 0 && this.free[i] === 1 && this.region[i] === this.main;
  }

  clearAt(x: number, y: number, pad = 0) {
    const b = this.bounds;
    if (x < b.x0 + pad || x > b.x1 - pad || y < b.y0 + pad || y > b.y1 - pad) return false;
    for (const box of this.boxes) {
      if (x > box.x0 - FOOT.rx - pad && x < box.x1 + FOOT.rx + pad && y > box.y0 - FOOT.ry - pad && y < box.y1 + FOOT.ry + pad) return false;
    }
    return true;
  }

  segmentClear(ax: number, ay: number, bx: number, by: number, pad = 0) {
    for (const box of this.boxes) {
      if (segmentEntry(ax, ay, bx, by, box.x0 - FOOT.rx - pad, box.y0 - FOOT.ry - pad, box.x1 + FOOT.rx + pad, box.y1 + FOOT.ry + pad) >= 0) return false;
    }
    const b = this.bounds;
    return bx >= b.x0 + pad - 0.5 && bx <= b.x1 - pad + 0.5 && by >= b.y0 + pad - 0.5 && by <= b.y1 - pad + 0.5;
  }

  nearest(x: number, y: number) {
    const start = this.cellAt(Math.min(this.bounds.x1 - 1, Math.max(this.bounds.x0, x)), Math.min(this.bounds.y1 - 1, Math.max(this.bounds.y0, y)));
    if (this.walkable(start)) return start;
    const cx0 = start % this.cols;
    const cy0 = (start / this.cols) | 0;
    let best = -1;
    let bestD = Infinity;
    const maxR = Math.max(this.cols, this.rows);
    for (let r = 1; r <= maxR; r += 1) {
      if (best !== -1 && (r - 1) * CELL > Math.sqrt(bestD)) break;
      for (let dy = -r; dy <= r; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const cx = cx0 + dx;
          const cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) continue;
          const i = cy * this.cols + cx;
          if (!this.walkable(i)) continue;
          const d = (this.centerX(i) - x) ** 2 + (this.centerY(i) - y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
      }
    }
    return best;
  }

  reachable(x: number, y: number) {
    const i = this.nearest(x, y);
    if (i < 0) return false;
    return Math.hypot(this.centerX(i) - x, this.centerY(i) - y) <= CELL * 1.5;
  }

  private push(size: number, node: number) {
    const heap = this.heap;
    const f = this.f;
    let i = size;
    heap[i] = node;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (f[heap[p]] <= f[node]) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = node;
  }

  private pop(size: number) {
    const heap = this.heap;
    const f = this.f;
    const top = heap[0];
    const last = heap[size - 1];
    let i = 0;
    const n = size - 1;
    while (true) {
      let c = i * 2 + 1;
      if (c >= n) break;
      if (c + 1 < n && f[heap[c + 1]] < f[heap[c]]) c += 1;
      if (f[heap[c]] >= f[last]) break;
      heap[i] = heap[c];
      i = c;
    }
    heap[i] = last;
    return top;
  }

  path(ax: number, ay: number, bx: number, by: number, out: Point[], avoid: readonly Avoid[] = [], hard = false) {
    out.length = 0;
    const s = this.nearest(ax, ay);
    const goal = this.nearest(bx, by);
    if (s < 0 || goal < 0) return false;
    this.gen += 1;
    const gen = this.gen;
    const cols = this.cols;
    const gx = goal % cols;
    const gy = (goal / cols) | 0;
    const h = (i: number) => {
      const dx = Math.abs((i % cols) - gx);
      const dy = Math.abs(((i / cols) | 0) - gy);
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    };
    const extra = (i: number) => {
      if (!avoid.length) return 0;
      const x = this.centerX(i);
      const y = this.centerY(i);
      let cost = 0;
      for (const a of avoid) if ((x - a.x) ** 2 + (y - a.y) ** 2 < a.r * a.r) cost += hard ? Infinity : 10;
      return cost;
    };
    this.g[s] = 0;
    this.f[s] = h(s);
    this.from[s] = -1;
    this.mark[s] = gen;
    let size = 0;
    this.push(size, s);
    size += 1;
    let found = false;
    while (size > 0) {
      const cur = this.pop(size);
      size -= 1;
      if (this.shut[cur] === gen) continue;
      this.shut[cur] = gen;
      if (cur === goal) {
        found = true;
        break;
      }
      const cx = cur % cols;
      const cy = (cur / cols) | 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= this.rows) continue;
          const nb = ny * cols + nx;
          if (!this.walkable(nb) || this.shut[nb] === gen) continue;
          if (dx && dy && (!this.walkable(cy * cols + nx) || !this.walkable(ny * cols + cx))) continue;
          const step = (dx && dy ? Math.SQRT2 : 1) + extra(nb);
          if (step === Infinity) continue;
          const ng = this.g[cur] + step;
          if (this.mark[nb] === gen && ng >= this.g[nb]) continue;
          this.mark[nb] = gen;
          this.g[nb] = ng;
          this.f[nb] = ng + h(nb);
          this.from[nb] = cur;
          if (size < this.heap.length) {
            this.push(size, nb);
            size += 1;
          }
        }
      }
    }
    if (!found) return false;
    const cells = this.cellsBuf;
    cells.length = 0;
    for (let c = goal; c !== -1; c = this.from[c]) cells.push(c);
    cells.reverse();
    let px = ax;
    let py = ay;
    let i = 0;
    const startClear = this.clearAt(ax, ay, 0);
    if (!startClear || !this.segmentClear(ax, ay, this.centerX(cells[0]), this.centerY(cells[0]), 2)) {
      out.push({ x: this.centerX(cells[0]), y: this.centerY(cells[0]) });
      px = out[0].x;
      py = out[0].y;
    }
    while (i < cells.length - 1) {
      let j = cells.length - 1;
      while (j > i + 1 && !this.lineOk(px, py, this.centerX(cells[j]), this.centerY(cells[j]), avoid)) j -= 1;
      i = j;
      px = this.centerX(cells[i]);
      py = this.centerY(cells[i]);
      out.push({ x: px, y: py });
    }
    if (!out.length) out.push({ x: this.centerX(goal), y: this.centerY(goal) });
    const last = out[out.length - 1];
    if (this.clearAt(bx, by, 4) && Math.hypot(bx - last.x, by - last.y) < CELL * 2 && this.segmentClear(last.x, last.y, bx, by, 2)) out.push({ x: bx, y: by });
    return true;
  }

  lineOk(ax: number, ay: number, bx: number, by: number, avoid: readonly Avoid[], pad = 4) {
    if (!this.segmentClear(ax, ay, bx, by, pad)) return false;
    for (const a of avoid) {
      const dx = bx - ax;
      const dy = by - ay;
      const l2 = dx * dx + dy * dy;
      const k = l2 > 0 ? Math.min(1, Math.max(0, ((a.x - ax) * dx + (a.y - ay) * dy) / l2)) : 0;
      if ((ax + dx * k - a.x) ** 2 + (ay + dy * k - a.y) ** 2 < a.r * a.r) return false;
    }
    return true;
  }
}

export type SteerOut = { x: number; y: number; arrived: boolean };

export class Navigator {
  goal: Point | null = null;
  readonly path: Point[] = [];
  stuckEvents = 0;
  failed = false;
  blocked = false;
  private idx = 0;
  private repathAt = 0;
  private sample = { x: 0, y: 0, t: -1, wanting: true };
  private avoid: (Avoid & { until: number })[] = [];
  private stuckRun = 0;
  private lastStuckAt = -99999;
  private live: Avoid[] = [];

  constructor(private nav: NavGrid) {}

  setGoal(x: number, y: number, t: number, slack = 28) {
    this.blocked = false;
    if (this.goal && Math.hypot(x - this.goal.x, y - this.goal.y) <= slack) return;
    this.goal = { x, y };
    this.failed = false;
    this.repathAt = t;
  }

  clear() {
    this.goal = null;
    this.path.length = 0;
    this.idx = 0;
  }

  get stuck() {
    return this.stuckRun;
  }

  private repath(me: Point, t: number) {
    this.live.length = 0;
    this.avoid = this.avoid.filter((a) => a.until > t);
    for (const a of this.avoid) this.live.push(a);
    const ok = this.goal ? this.nav.path(me.x, me.y, this.goal.x, this.goal.y, this.path, this.live, true) || this.nav.path(me.x, me.y, this.goal.x, this.goal.y, this.path, this.live) : false;
    this.idx = 0;
    this.repathAt = t + 650;
    if (!ok) {
      this.failed = true;
      this.goal = null;
      this.path.length = 0;
    }
  }

  steer(me: Point, t: number, out: SteerOut) {
    out.x = 0;
    out.y = 0;
    out.arrived = false;
    if (!this.goal) {
      this.sample.wanting = false;
      return 0;
    }
    if (t >= this.repathAt || !this.path.length) this.repath(me, t);
    if (!this.path.length) return 0;
    while (this.idx < this.path.length - 1) {
      const p = this.path[this.idx];
      const next = this.path[this.idx + 1];
      if (Math.hypot(p.x - me.x, p.y - me.y) < 18 || this.nav.lineOk(me.x, me.y, next.x, next.y, this.live, 2)) this.idx += 1;
      else break;
    }
    const p = this.path[this.idx];
    const dx = p.x - me.x;
    const dy = p.y - me.y;
    const d = Math.hypot(dx, dy);
    const final = this.idx === this.path.length - 1;
    if (final && d < 12) {
      out.arrived = true;
      this.sample.wanting = false;
      return 0;
    }
    const mag = final ? Math.min(1, Math.max(0.35, d / 70)) : 1;
    out.x = dx / (d || 1);
    out.y = dy / (d || 1);
    this.watch(me, t, out);
    return mag;
  }

  hold() {
    this.sample.wanting = false;
  }

  private watch(me: Point, t: number, dir: Point) {
    const s = this.sample;
    if (s.t < 0 || !s.wanting) {
      s.x = me.x;
      s.y = me.y;
      s.t = t;
      s.wanting = true;
      return;
    }
    if (t - s.t < 650) return;
    const moved = Math.hypot(me.x - s.x, me.y - s.y);
    s.x = me.x;
    s.y = me.y;
    s.t = t;
    if (moved >= 18) {
      if (t - this.lastStuckAt > 2600) this.stuckRun = 0;
      return;
    }
    this.stuckEvents += 1;
    this.stuckRun = t - this.lastStuckAt < 2600 ? this.stuckRun + 1 : 1;
    this.lastStuckAt = t;
    this.avoid.push({ x: me.x + dir.x * 34, y: me.y + dir.y * 34, r: 64, until: t + 2600 });
    this.repathAt = t;
    if (this.stuckRun >= 3) {
      this.blocked = true;
      this.clear();
    }
  }
}
