import { atan2 } from "./math";

export type SurfaceKind = "road" | "deck" | "yard" | "rail" | "awning";

export type Surface = {
  kind: SurfaceKind;
  xs: number[];
  ys: number[];
  len: number[];
  tx: number[];
  ty: number[];
  ang: number[];
  x0: number;
  x1: number;
};

export type ObstacleKind = "cone" | "crate" | "line" | "barrier" | "pothole" | "bin" | "gnome" | "fence" | "truck" | "hose" | "gold" | "melon" | "orange" | "stand";

export type Motion = { amp: number; period: number; phase: number };

export type Window = { period: number; on: number; phase: number };

export type Roll = { length: number; period: number; phase: number };

export type Obstacle = { x: number; kind: ObstacleKind; low: number; high: number; heavy: boolean; loss: number; surface: number; motion?: Motion; window?: Window; roll?: Roll };

export type SignKey = "crouch" | "rollers" | "crest" | "ramp" | "land" | "cones" | "crates" | "duck" | "jump" | "shortcut" | "cobbles" | "finish" | "pothole" | "bins" | "hose" | "truck" | "yard" | "fence" | "fruit" | "awnings" | "stairs" | "rail" | "pigeons" | "trolley";

export type Sign = { x: number; key: SignKey };

export type Lip = { surface: number; x: number };

export type Ramp = { x0: number; y0: number; x1: number; y1: number; lipY: number };

export type Track = {
  surfaces: Surface[];
  lips: Lip[];
  obstacles: Obstacle[];
  ramps: Ramp[];
  cobbles: { x0: number; x1: number; stairs?: boolean }[];
  flocks?: { x0: number; x1: number }[];
  awningExit?: number;
  signs: Sign[];
  start: number;
  finish: number;
};

const OBSTACLE_SHAPES: Record<ObstacleKind, { low: number; high: number; heavy: boolean; loss: number }> = {
  cone: { low: 0, high: 42, heavy: false, loss: 1 },
  crate: { low: 0, high: 80, heavy: false, loss: 1 },
  line: { low: 92, high: 420, heavy: false, loss: 1 },
  barrier: { low: 0, high: 104, heavy: true, loss: 1 },
  pothole: { low: -40, high: 14, heavy: false, loss: 0.6 },
  bin: { low: 0, high: 86, heavy: false, loss: 1 },
  gnome: { low: 0, high: 52, heavy: false, loss: 0.5 },
  fence: { low: -400, high: 40, heavy: true, loss: 1 },
  truck: { low: 0, high: 190, heavy: true, loss: 1 },
  hose: { low: 0, high: 70, heavy: false, loss: 0.7 },
  gold: { low: -60, high: 90, heavy: false, loss: 0 },
  melon: { low: 0, high: 62, heavy: false, loss: 0.8 },
  orange: { low: 0, high: 32, heavy: false, loss: 0.35 },
  stand: { low: 0, high: 92, heavy: false, loss: 1 },
};

export function obstacle(x: number, kind: ObstacleKind, extra: { surface?: number; motion?: Motion; window?: Window; roll?: Roll } = {}): Obstacle {
  return { x, kind, ...OBSTACLE_SHAPES[kind], surface: extra.surface ?? 0, motion: extra.motion, window: extra.window, roll: extra.roll };
}

export function rollPhase(o: Obstacle, step: number) {
  if (!o.roll) return 0;
  const { period, phase } = o.roll;
  return ((((step + phase) % period) + period) % period) / period;
}

export function obstacleX(o: Obstacle, step: number) {
  if (o.roll) return o.x + o.roll.length * rollPhase(o, step);
  if (!o.motion) return o.x;
  const { amp, period, phase } = o.motion;
  const u = ((((step + phase) % period) + period) % period) / period;
  const k = u < 0.4 ? u / 0.4 : u < 0.5 ? 1 : u < 0.9 ? 1 - (u - 0.5) / 0.4 : 0;
  return o.x + amp * k;
}

export function obstacleActive(o: Obstacle, step: number) {
  if (!o.window) return true;
  const { period, on, phase } = o.window;
  return (((step + phase) % period) + period) % period < on;
}

export class PathBuilder {
  readonly xs: number[];
  readonly ys: number[];
  slope: number;

  constructor(x: number, y: number, slope = 0) {
    this.xs = [x];
    this.ys = [y];
    this.slope = slope;
  }

  get x() {
    return this.xs[this.xs.length - 1];
  }

  get y() {
    return this.ys[this.ys.length - 1];
  }

  curve(dx: number, dy: number, endSlope: number, step = 12) {
    const x0 = this.x;
    const y0 = this.y;
    const m0 = this.slope * dx;
    const m1 = endSlope * dx;
    const n = Math.max(1, Math.ceil(dx / step));
    for (let i = 1; i <= n; i += 1) {
      const u = i / n;
      const u2 = u * u;
      const u3 = u2 * u;
      const h10 = u3 - 2 * u2 + u;
      const h01 = -2 * u3 + 3 * u2;
      const h11 = u3 - u2;
      this.xs.push(x0 + dx * u);
      this.ys.push(y0 + h10 * m0 + h01 * dy + h11 * m1);
    }
    this.slope = endSlope;
    return this;
  }

  ease(dx: number, endSlope: number, step = 12) {
    return this.curve(dx, ((this.slope + endSlope) / 2) * dx, endSlope, step);
  }

  line(dx: number, step = 12) {
    return this.curve(dx, this.slope * dx, this.slope, step);
  }

  kink(slope: number) {
    this.slope = slope;
    return this;
  }

  straight(dx: number, dy: number) {
    this.xs.push(this.x + dx);
    this.ys.push(this.y + dy);
    this.slope = dy / dx;
    return this;
  }

  ramp(dx: number, height: number, lipSlope: number): Ramp {
    const x0 = this.x;
    const y0 = this.y;
    const base = this.slope;
    this.curve(dx, base * dx - height, lipSlope);
    const lipX = this.x;
    const lipY = this.y;
    const baseY = y0 + base * dx;
    this.xs.push(lipX + 8);
    this.ys.push(baseY + base * 8);
    this.slope = base;
    return { x0, y0, x1: lipX, y1: baseY, lipY };
  }

  rollers(count: number, width: number, amplitude: number, base: number) {
    const half = width / 2;
    for (let i = 0; i < count; i += 1) {
      this.curve(half, base * half + amplitude, base);
      this.curve(half, base * half - amplitude, base);
    }
    return this;
  }

  build(kind: SurfaceKind): Surface {
    return finishSurface(kind, this.xs, this.ys);
  }
}

export function finishSurface(kind: SurfaceKind, xs: number[], ys: number[]): Surface {
  const len: number[] = [];
  const tx: number[] = [];
  const ty: number[] = [];
  const ang: number[] = [];
  for (let i = 0; i < xs.length - 1; i += 1) {
    const dx = xs[i + 1] - xs[i];
    const dy = ys[i + 1] - ys[i];
    const l = Math.sqrt(dx * dx + dy * dy);
    len.push(l);
    tx.push(dx / l);
    ty.push(dy / l);
    ang.push(atan2(dy, dx));
  }
  return { kind, xs, ys, len, tx, ty, ang, x0: xs[0], x1: xs[xs.length - 1] };
}

export function segmentAt(surface: Surface, x: number) {
  const xs = surface.xs;
  let lo = 0;
  let hi = xs.length - 2;
  if (x <= xs[0]) return 0;
  if (x >= xs[hi]) return hi;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function heightAt(surface: Surface, x: number, seg = segmentAt(surface, x)) {
  const x0 = surface.xs[seg];
  const x1 = surface.xs[seg + 1];
  const y0 = surface.ys[seg];
  const y1 = surface.ys[seg + 1];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

export function covers(surface: Surface, x: number) {
  return x >= surface.x0 && x <= surface.x1;
}
