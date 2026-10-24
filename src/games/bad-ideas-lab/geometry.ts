import { FLOOR_Y, PARTS, partAngle, type PartType } from "./config";
import type { Block, Goal, Rect } from "./levels";

export type Vec = { x: number; y: number };
export type Poly = Vec[];

export type Sensor = { kind: "circle"; x: number; y: number; r: number } | { kind: "rect"; x: number; y: number; w: number; h: number };

export function rectPoly(cx: number, cy: number, w: number, h: number, angleDeg = 0): Poly {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const hw = w / 2;
  const hh = h / 2;
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({ x: cx + p.x * c - p.y * s, y: cy + p.x * s + p.y * c }));
}

function project(poly: Poly, ax: Vec) {
  let min = Infinity;
  let max = -Infinity;
  for (const p of poly) {
    const d = p.x * ax.x + p.y * ax.y;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}

export function polysOverlap(a: Poly, b: Poly, margin = 0) {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i += 1) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      const ax = { x: -(p2.y - p1.y) / len, y: (p2.x - p1.x) / len };
      const pa = project(a, ax);
      const pb = project(b, ax);
      if (pa.max + margin <= pb.min || pb.max + margin <= pa.min) return false;
    }
  }
  return true;
}

export function polyInsideRect(poly: Poly, r: Rect) {
  return poly.every((p) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
}

export function pointInPoly(p: Vec, poly: Poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function blockPoly(b: Block) {
  return rectPoly(b.x, b.y, b.w, b.h, b.angle ?? 0);
}

export function partPoly(type: PartType, x: number, y: number, rot: number) {
  const def = PARTS[type];
  return rectPoly(x, y, def.w, def.h, partAngle(type, rot));
}

export function goalLayout(goal: Goal): { blocks: Block[]; sensor: Sensor; keepOut: Rect } {
  switch (goal.type) {
    case "target":
      return {
        blocks: [{ x: goal.x, y: (goal.y + 60 + FLOOR_Y) / 2, w: 16, h: FLOOR_Y - (goal.y + 60), kind: "pole" }],
        sensor: { kind: "circle", x: goal.x, y: goal.y, r: 58 },
        keepOut: { x: goal.x - 90, y: goal.y - 90, w: 180, h: 180 },
      };
    case "bell": {
      const blocks: Block[] =
        goal.stand === "pole"
          ? [{ x: goal.x, y: (goal.y + 46 + FLOOR_Y) / 2, w: 16, h: FLOOR_Y - (goal.y + 46), kind: "pole" }]
          : [];
      return {
        blocks,
        sensor: { kind: "circle", x: goal.x, y: goal.y, r: 52 },
        keepOut: { x: goal.x - 80, y: goal.y - 90, w: 160, h: 160 },
      };
    }
    case "toaster":
      return {
        blocks: [{ x: goal.x, y: goal.y - 45, w: 120, h: 90, kind: "metal" }],
        sensor: { kind: "rect", x: goal.x - 82, y: goal.y - 92, w: 34, h: 92 },
        keepOut: { x: goal.x - 110, y: goal.y - 140, w: 190, h: 140 },
      };
    case "juicer":
      return {
        blocks: [
          { x: goal.x - 72, y: goal.y + 50, w: 14, h: 112, kind: "metal" },
          { x: goal.x + 72, y: goal.y + 50, w: 14, h: 112, kind: "metal" },
          { x: goal.x, y: goal.y + 106, w: 158, h: 14, kind: "metal" },
          { x: goal.x, y: (goal.y + 113 + FLOOR_Y) / 2, w: 40, h: FLOOR_Y - (goal.y + 113), kind: "pole" },
        ],
        sensor: { kind: "rect", x: goal.x - 60, y: goal.y + 36, w: 120, h: 62 },
        keepOut: { x: goal.x - 100, y: goal.y - 80, w: 200, h: 200 },
      };
    case "remote":
      return {
        blocks: [{ x: goal.x, y: goal.y - 12, w: 100, h: 24, kind: "metal" }],
        sensor: { kind: "rect", x: goal.x - 60, y: goal.y - 64, w: 140, h: 64 },
        keepOut: { x: goal.x - 70, y: goal.y - 120, w: 180, h: 120 },
      };
  }
}

export function ballInSensor(x: number, y: number, r: number, s: Sensor) {
  if (s.kind === "circle") return Math.hypot(x - s.x, y - s.y) < s.r + r * 0.5;
  return x > s.x - r * 0.4 && x < s.x + s.w + r * 0.4 && y > s.y - r * 0.4 && y < s.y + s.h + r * 0.4;
}

export function pipeKeepOut(px: number, py: number): Rect {
  return { x: px - 110, y: py - 110, w: 220, h: 170 };
}

export type PlacedPart = { type: PartType; x: number; y: number; rot: number };

function rectAsPoly(r: Rect): Poly {
  return rectPoly(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
}

export function placementIssue(
  level: { blocks: Block[]; goal: Goal; build: Rect; pipe: { x: number; y: number } },
  others: PlacedPart[],
  part: PlacedPart,
): "outside" | "blocked" | "crowded" | null {
  const poly = partPoly(part.type, part.x, part.y, part.rot);
  if (!polyInsideRect(poly, level.build)) return "outside";
  const layout = goalLayout(level.goal);
  for (const b of [...level.blocks, ...layout.blocks]) if (polysOverlap(poly, blockPoly(b), 2)) return "blocked";
  if (polysOverlap(poly, rectAsPoly(layout.keepOut))) return "blocked";
  if (polysOverlap(poly, rectAsPoly(pipeKeepOut(level.pipe.x, level.pipe.y)))) return "blocked";
  for (const o of others) if (polysOverlap(poly, partPoly(o.type, o.x, o.y, o.rot), 4)) return "crowded";
  return null;
}
