import { describe, expect, it } from "vitest";
import { ARENAS } from "./arenas";
import { FOOT, H, W } from "./config";
import { arenaBoxes, CELL, NavGrid, resolveBody, solidBoxes, type Point } from "./nav";
import { seeded } from "./testing";

const grids = ARENAS.map((a) => ({ arena: a, nav: new NavGrid(a.bounds, solidBoxes(arenaBoxes(a))) }));

function physicallyFree(nav: NavGrid, x: number, y: number) {
  const body = { x, y, vx: 0, vy: 0 };
  resolveBody(body, nav.bounds, nav.boxes);
  return body.x === x && body.y === y;
}

describe("Guerra do Pijama navigation grid", () => {
  it("puts every spawn on walkable floor connected to the rest of the arena", () => {
    for (const { arena, nav } of grids) {
      for (const [x, y] of arena.spawns) {
        expect(physicallyFree(nav, x, y), `${arena.id} ${x},${y}`).toBe(true);
        expect(nav.walkable(nav.cellAt(x, y)), `${arena.id} ${x},${y}`).toBe(true);
      }
    }
  });

  it("leaves no pocket a kid can stand in but the bots cannot reach", () => {
    for (const { arena, nav } of grids) {
      const b = arena.bounds;
      const pockets: string[] = [];
      for (let y = b.y0; y <= b.y1; y += 8) {
        for (let x = b.x0; x <= b.x1; x += 8) {
          if (!physicallyFree(nav, x, y)) continue;
          const i = nav.nearest(x, y);
          if (i < 0 || Math.hypot(nav.centerX(i) - x, nav.centerY(i) - y) > CELL * 1.6) pockets.push(`${x},${y}`);
        }
      }
      expect(pockets, arena.id).toEqual([]);
    }
  });

  it("keeps almost all of the open floor in one connected area", () => {
    for (const { arena, nav } of grids) {
      let free = 0;
      let main = 0;
      for (let i = 0; i < nav.free.length; i += 1) {
        if (!nav.free[i]) continue;
        free += 1;
        if (nav.walkable(i)) main += 1;
      }
      expect(main / free, arena.id).toBeGreaterThan(0.97);
      expect(nav.stands.length, arena.id).toBeGreaterThan(80);
    }
  });

  it("finds clear routes between spawns and around furniture", () => {
    const route: Point[] = [];
    for (const { arena, nav } of grids) {
      const rnd = seeded(7);
      const points: Point[] = arena.spawns.map(([x, y]) => ({ x, y }));
      for (let i = 0; i < 24; i += 1) {
        const c = nav.stands[Math.floor(rnd() * nav.stands.length)];
        points.push({ x: nav.centerX(c), y: nav.centerY(c) });
      }
      for (const a of points) {
        for (const b of points) {
          expect(nav.path(a.x, a.y, b.x, b.y, route), `${arena.id} ${a.x},${a.y} -> ${b.x},${b.y}`).toBe(true);
          let from = a;
          for (const p of route) {
            expect(nav.segmentClear(from.x, from.y, p.x, p.y), `${arena.id} leg ${from.x},${from.y} -> ${p.x},${p.y}`).toBe(true);
            from = p;
          }
          expect(Math.hypot(from.x - b.x, from.y - b.y), arena.id).toBeLessThan(CELL);
        }
      }
    }
  });

  it("goes around the bed instead of through it", () => {
    const { nav } = grids[0];
    const route: Point[] = [];
    expect(nav.segmentClear(180, 470, 330, 640)).toBe(false);
    nav.path(560, 470, 250, 700, route);
    expect(route.length).toBeGreaterThan(1);
    expect(route.every((p) => !(p.x > 140 - FOOT.rx && p.x < 480 + FOOT.rx && p.y > 394 - FOOT.ry && p.y < 584 + FOOT.ry))).toBe(true);
  });

  it("stops at the nearest reachable spot when asked to walk past the yard fence", () => {
    const { arena, nav } = grids[2];
    const route: Point[] = [];
    expect(nav.path(520, 720, 520, 300, route)).toBe(true);
    const end = route[route.length - 1];
    expect(end.y).toBeGreaterThanOrEqual(arena.bounds.y0);
    expect(end.y).toBeLessThan(arena.bounds.y0 + CELL * 1.5);
    expect(nav.reachable(520, 300)).toBe(false);
  });

  it("never lets a body rest inside furniture or outside the room", () => {
    for (const { arena, nav } of grids) {
      const rnd = seeded(11);
      for (let i = 0; i < 4000; i += 1) {
        const body = { x: rnd() * W, y: rnd() * H, vx: 0, vy: 0 };
        resolveBody(body, nav.bounds, nav.boxes);
        resolveBody(body, nav.bounds, nav.boxes);
        expect(body.x, arena.id).toBeGreaterThanOrEqual(arena.bounds.x0);
        expect(body.x, arena.id).toBeLessThanOrEqual(arena.bounds.x1);
        expect(body.y, arena.id).toBeGreaterThanOrEqual(arena.bounds.y0);
        expect(body.y, arena.id).toBeLessThanOrEqual(arena.bounds.y1);
        for (const box of nav.boxes) {
          const inside = body.x > box.x0 - FOOT.rx && body.x < box.x1 + FOOT.rx && body.y > box.y0 - FOOT.ry && body.y < box.y1 + FOOT.ry;
          expect(inside, `${arena.id} ${body.x},${body.y}`).toBe(false);
        }
      }
    }
  });
});
