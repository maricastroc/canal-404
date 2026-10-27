import { describe, expect, it } from "vitest";
import { FLOOR_Y, H, PARTS, PART_ORDER, W, partAngle, partFacing, type PartType } from "./config";
import {
  ballInSensor,
  columnSpan,
  partPoly,
  placementConflict,
  placementIssue,
  pointInPoly,
  polyBox,
  polyInsideRect,
  polysOverlap,
  rectPoly,
  sceneBlocks,
  type PlacedPart,
} from "./geometry";
import { LEVELS } from "./levels";

const SOLUTIONS: Record<string, PlacedPart[]> = {
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

describe("polygon helpers", () => {
  it("builds an axis-aligned rectangle around its center", () => {
    expect(rectPoly(100, 50, 40, 20)).toEqual([
      { x: 80, y: 40 },
      { x: 120, y: 40 },
      { x: 120, y: 60 },
      { x: 80, y: 60 },
    ]);
  });

  it("rotates a rectangle around its center", () => {
    const poly = rectPoly(0, 0, 40, 20, 90);
    expect(poly[0].x).toBeCloseTo(10);
    expect(poly[0].y).toBeCloseTo(-20);
  });

  it("detects overlapping and separate polygons", () => {
    expect(polysOverlap(rectPoly(0, 0, 100, 20), rectPoly(40, 0, 100, 20))).toBe(true);
    expect(polysOverlap(rectPoly(0, 0, 100, 20), rectPoly(200, 0, 100, 20))).toBe(false);
  });

  it("separates rotated polygons that only overlap by their bounding boxes", () => {
    expect(polysOverlap(rectPoly(0, 0, 200, 10, 45), rectPoly(60, -60, 20, 20))).toBe(false);
  });

  it("treats touching edges as separate unless a margin is given", () => {
    const a = rectPoly(0, 0, 100, 20);
    const b = rectPoly(100, 0, 100, 20);
    expect(polysOverlap(a, b)).toBe(false);
    expect(polysOverlap(a, rectPoly(102, 0, 100, 20), 4)).toBe(true);
  });

  it("measures boxes and vertical spans of tilted shapes", () => {
    expect(polyBox(rectPoly(100, 50, 40, 20))).toEqual({ left: 80, right: 120, top: 40, bottom: 60 });
    const tilted = rectPoly(0, 0, 200, 20, 45);
    const span = columnSpan(tilted, 0)!;
    expect(span.top).toBeCloseTo(-14.14, 1);
    expect(span.bottom).toBeCloseTo(14.14, 1);
    expect(columnSpan(tilted, 500)).toBeNull();
  });

  it("checks points and polygons against shapes", () => {
    const square = rectPoly(0, 0, 100, 100);
    expect(pointInPoly({ x: 10, y: 10 }, square)).toBe(true);
    expect(pointInPoly({ x: 60, y: 10 }, square)).toBe(false);
    expect(polyInsideRect(rectPoly(50, 50, 20, 20), { x: 0, y: 0, w: 100, h: 100 })).toBe(true);
    expect(polyInsideRect(rectPoly(95, 50, 20, 20), { x: 0, y: 0, w: 100, h: 100 })).toBe(false);
  });

  it("detects the ball inside circle and rectangle sensors", () => {
    expect(ballInSensor(10, 0, 22, { kind: "circle", x: 0, y: 0, r: 40 })).toBe(true);
    expect(ballInSensor(80, 0, 22, { kind: "circle", x: 0, y: 0, r: 40 })).toBe(false);
    expect(ballInSensor(5, 5, 22, { kind: "rect", x: 0, y: 0, w: 10, h: 10 })).toBe(true);
    expect(ballInSensor(40, 5, 22, { kind: "rect", x: 0, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe("parts", () => {
  it("rotate ramps and springs but only flip fans and belts", () => {
    expect(partAngle("ramp", 0)).toBe(-45);
    expect(partAngle("spring", 2)).toBe(0);
    expect(partAngle("fan", 1)).toBe(0);
    expect(partFacing("belt", 1)).toBe(-1);
    expect(partFacing("belt", 0)).toBe(1);
    expect(partFacing("ramp", 6)).toBe(1);
  });

  it("start at a valid rotation", () => {
    for (const type of PART_ORDER) expect(PARTS[type].rotations[PARTS[type].initial], type).toBeDefined();
  });
});

describe("placement rules", () => {
  const level = LEVELS[0];

  it("rejects parts outside the build area", () => {
    expect(placementIssue(level, [], { type: "ramp", x: level.build.x - 200, y: level.build.y + 100, rot: 3 })).toBe("outside");
  });

  it("rejects parts on top of each other", () => {
    const first: PlacedPart = { type: "ramp", x: 680, y: 560, rot: 3 };
    expect(placementIssue(level, [first], { ...first, x: first.x + 20 })).toBe("crowded");
  });

  it("rejects parts that hit a shelf or the wall", () => {
    const pixel = LEVELS.find((l) => l.id === "pixel")!;
    const finale = LEVELS.find((l) => l.id === "finale")!;
    expect(placementIssue(pixel, [], { type: "spring", x: 540, y: 360, rot: 2 })).toBe("blocked");
    expect(placementIssue(finale, [], { type: "spring", x: 360, y: 340, rot: 2 })).toBe("blocked");
  });

  it("says which block, edge or part is in the way", () => {
    const pixel = LEVELS.find((l) => l.id === "pixel")!;
    const conflict = placementConflict(pixel, [], { type: "spring", x: 540, y: 360, rot: 2 });
    expect(conflict).toEqual({ issue: "blocked", block: 0 });
    expect(sceneBlocks(pixel)[0]).toBe(pixel.blocks[0]);
    expect(placementConflict(level, [], { type: "ramp", x: level.build.x, y: level.build.y, rot: 3 })).toEqual({ issue: "outside", edges: ["left", "top"] });
    const first: PlacedPart = { type: "ramp", x: 680, y: 560, rot: 3 };
    expect(placementConflict(level, [first], { ...first, x: first.x + 20 })).toEqual({ issue: "crowded", other: 0 });
  });

  it("accepts the tutorial ramp on its guide mark", () => {
    const guide = level.guide!;
    expect(placementIssue(level, [], guide)).toBeNull();
  });
});

describe("levels", () => {
  it("have unique ids", () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
  });

  it("fit inside the screen and above the floor", () => {
    for (const l of LEVELS) {
      expect(l.build.x, l.id).toBeGreaterThanOrEqual(0);
      expect(l.build.x + l.build.w, l.id).toBeLessThanOrEqual(W);
      expect(l.build.y + l.build.h, l.id).toBeLessThanOrEqual(FLOOR_Y);
      expect(l.pipe.x, l.id).toBeGreaterThan(0);
      expect(l.pipe.x, l.id).toBeLessThan(W);
      expect(l.pipe.y, l.id).toBeLessThan(H);
      expect(l.goal.x, l.id).toBeGreaterThan(0);
      expect(l.goal.x, l.id).toBeLessThan(W);
    }
  });

  it("offer at least as many parts as the par", () => {
    for (const l of LEVELS) {
      const total = Object.values(l.inventory).reduce((a, b) => a + (b ?? 0), 0);
      expect(total, l.id).toBeGreaterThanOrEqual(l.par);
      expect(l.par, l.id).toBeGreaterThan(0);
    }
  });

  it("have a known solution that can be built with the parts on offer", () => {
    for (const l of LEVELS) {
      const plan = SOLUTIONS[l.id];
      expect(plan, l.id).toBeDefined();
      const used: Partial<Record<PartType, number>> = {};
      const placed: PlacedPart[] = [];
      for (const part of plan) {
        used[part.type] = (used[part.type] ?? 0) + 1;
        expect(used[part.type], `${l.id}: ${part.type}`).toBeLessThanOrEqual(l.inventory[part.type] ?? 0);
        expect(placementIssue(l, placed, part), `${l.id}: ${part.type} at ${part.x},${part.y}`).toBeNull();
        placed.push(part);
      }
      expect(plan.length, l.id).toBeLessThanOrEqual(l.par);
    }
  });

  it("keep the guide inside the build area when there is one", () => {
    for (const l of LEVELS.filter((x) => x.guide)) {
      const g = l.guide!;
      expect(polyInsideRect(partPoly(g.type, g.x, g.y, g.rot), l.build), l.id).toBe(true);
      expect(l.inventory[g.type], l.id).toBeGreaterThan(0);
    }
  });
});
