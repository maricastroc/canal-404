import { describe, expect, it } from "vitest";
import { findPath } from "./path";

const W = 1200;
const H = 800;
const box = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const outside = (x: number, y: number) => x < 0 || y < 0 || x > W || y > H;
const any =
  (...tests: ((x: number, y: number) => boolean)[]) =>
  (x: number, y: number) =>
    tests.some((t) => t(x, y));

function walk(blocked: (x: number, y: number) => boolean, from: [number, number], path: [number, number][]) {
  let [ax, ay] = from;
  for (const [bx, by] of path) {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 4);
    for (let i = 1; i <= steps; i += 1) {
      const x = ax + ((bx - ax) * i) / steps;
      const y = ay + ((by - ay) * i) / steps;
      if (blocked(x, y)) return false;
    }
    [ax, ay] = [bx, by];
  }
  return true;
}

describe("findPath", () => {
  it("walks straight when nothing is in the way", () => {
    expect(findPath(outside, W, H, 100, 100, 900, 600)).toEqual([[900, 600]]);
  });

  it("goes around a wall without crossing it", () => {
    const wall = box(560, 0, 640, 620);
    const blocked = any(outside, wall);
    const path = findPath(blocked, W, H, 200, 300, 1000, 300);
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual([1000, 300]);
    expect(path.some(([, y]) => y > 620)).toBe(true);
    expect(walk(blocked, [200, 300], path)).toBe(true);
  });

  it("finds its way out of a U-shaped trap", () => {
    const trap = any(box(500, 200, 540, 600), box(500, 560, 900, 600), box(500, 200, 900, 240));
    const blocked = any(outside, trap);
    const path = findPath(blocked, W, H, 700, 400, 300, 400);
    expect(path.at(-1)).toEqual([300, 400]);
    expect(walk(blocked, [700, 400], path)).toBe(true);
  });

  it("stops at the closest reachable point when the target is walled in", () => {
    const pen = any(box(880, 280, 1120, 300), box(880, 500, 1120, 520), box(880, 280, 900, 520), box(1100, 280, 1120, 520));
    const blocked = any(outside, pen);
    const path = findPath(blocked, W, H, 200, 400, 1000, 400);
    const [x, y] = path.at(-1)!;
    expect(Math.hypot(x - 1000, y - 400)).toBeLessThan(200);
    expect(blocked(x, y)).toBe(false);
    expect(walk(blocked, [200, 400], path)).toBe(true);
  });

  it("does not squeeze between two obstacles that only touch at a corner", () => {
    const blocked = any(outside, box(560, 0, 630, 410), box(630, 410, 700, 800));
    const path = findPath(blocked, W, H, 300, 300, 1000, 300);
    for (const [x] of path) expect(x).toBeLessThan(630);
  });

  it("starts from a nearby free cell when the player stands on a blocked spot", () => {
    const wall = box(560, 0, 640, 620);
    const blocked = any(outside, wall, box(195, 295, 205, 305));
    const path = findPath(blocked, W, H, 200, 300, 1000, 300);
    expect(path.at(-1)).toEqual([1000, 300]);
  });
});
