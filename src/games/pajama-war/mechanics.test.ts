import { describe, expect, it } from "vitest";
import { ARENAS } from "./arenas";
import { PILLOW } from "./config";
import { arenaBoxes, FLOOR_Y, NavGrid, solidBoxes, traceShot, type Box, type Point } from "./nav";
import { SPECIAL, SpecialSpawner } from "./special";

const shoot = (boxes: readonly Box[], arena: (typeof ARENAS)[number], from: Point, to: Point, special = false) => {
  const angle = Math.atan2((to.y - from.y) / FLOOR_Y, to.x - from.x);
  return traceShot(from.x + Math.cos(angle) * 34, from.y + 6, angle, boxes, arena.bounds, { range: PILLOW.range, special });
};

const bouncyKeys = (arena: (typeof ARENAS)[number]) =>
  arenaBoxes(arena)
    .filter((b) => b.bouncy)
    .map((b) => arena.props[b.index].key);

describe("Guerra do Pijama ricochets", () => {
  it("only happen in the living room, on the sofa, the armchairs and the mattresses", () => {
    expect(bouncyKeys(ARENAS[0])).toEqual([]);
    expect(bouncyKeys(ARENAS[1]).sort()).toEqual(["armchair", "armchair", "mattresses", "sofa"]);
    expect(bouncyKeys(ARENAS[2])).toEqual([]);
  });

  it("bounce off springy furniture and stop on everything else", () => {
    for (const arena of ARENAS) {
      const boxes = arenaBoxes(arena);
      const nav = new NavGrid(arena.bounds, solidBoxes(boxes));
      for (const box of boxes.filter((b) => b.tall && b.solid)) {
        const center = { x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 };
        const from = nav.stands.map((c) => ({ x: nav.centerX(c), y: nav.centerY(c) })).find((p) => p.y > box.y1 + 60 && Math.abs(p.x - center.x) < 40);
        if (!from) continue;
        const trace = shoot(boxes, arena, from, center);
        if (box.bouncy) {
          expect(trace.bounce?.box, `${arena.id} ${arena.props[box.index].key}`).toBe(box);
          expect(trace.bounce?.side, arena.props[box.index].key).toBe(3);
          const after = trace.pts[trace.pts.length - 1];
          expect(after.y, arena.props[box.index].key).toBeGreaterThan(trace.bounce!.y);
        } else {
          expect(trace.bounce, `${arena.id} ${arena.props[box.index].key}`).toBeNull();
          expect(trace.end, `${arena.id} ${arena.props[box.index].key}`).toBe("block");
        }
      }
    }
  });

  it("bounce at most once and keep obeying walls and furniture afterwards", () => {
    const arena = ARENAS[1];
    const boxes = arenaBoxes(arena);
    const nav = new NavGrid(arena.bounds, solidBoxes(boxes));
    let bounced = 0;
    for (const c of nav.stands) {
      const ox = nav.centerX(c);
      const oy = nav.centerY(c);
      for (let k = 0; k < 48; k += 1) {
        const angle = (k / 48) * Math.PI * 2;
        const trace = traceShot(ox + Math.cos(angle) * 34, oy + 6, angle, boxes, arena.bounds, { range: PILLOW.range });
        expect(trace.pts.length).toBeLessThanOrEqual(trace.bounce ? 3 : 2);
        expect(trace.length).toBeLessThanOrEqual(PILLOW.range + 260 + 1);
        for (const p of trace.pts) {
          expect(p.y).toBeGreaterThanOrEqual(arena.bounds.y0 - 70 - 0.5);
          for (const b of boxes) {
            if (!b.tall) continue;
            expect(p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1, `${ox},${oy} angle ${k}`).toBe(false);
          }
        }
        if (trace.bounce) bounced += 1;
      }
    }
    expect(bounced).toBeGreaterThan(100);
  });

  it("let the special pillow fly over the furniture", () => {
    const arena = ARENAS[2];
    const boxes = arenaBoxes(arena);
    const tent = boxes.find((b) => arena.props[b.index].key === "tent")!;
    const from = { x: 960, y: 760 };
    const behind = { x: 960, y: tent.y0 - 10 };
    expect(shoot(boxes, arena, from, behind).end).toBe("block");
    expect(shoot(boxes, arena, from, behind, true).end).not.toBe("block");
  });
});

describe("Guerra do Pijama special pillow", () => {
  const arena = ARENAS[2];
  const spots = arena.specialSpots!;
  const kid = (x: number, y: number) => ({ x, y, alive: true, special: false });

  it("only drops on open, reachable floor in the backyard", () => {
    const boxes = arenaBoxes(arena);
    const nav = new NavGrid(arena.bounds, solidBoxes(boxes));
    const route: Point[] = [];
    expect(spots.length).toBeGreaterThanOrEqual(5);
    for (const [x, y] of spots) {
      expect(nav.clearAt(x, y, 40), `${x},${y}`).toBe(true);
      for (const [sx, sy] of arena.spawns) expect(nav.path(sx, sy, x, y, route), `${sx},${sy} -> ${x},${y}`).toBe(true);
    }
    expect(ARENAS.filter((a) => a.specialSpots).map((a) => a.id)).toEqual(["yard"]);
  });

  it("drops on a fixed schedule, away from the kids, in the same order every match", () => {
    const run = () => {
      const s = new SpecialSpawner(spots);
      const kids = [kid(960, 960), kid(520, 720), kid(1400, 720)];
      const log: string[] = [];
      for (let t = 0; t <= 90000; t += 100) {
        const ev = s.update(t, kids);
        if (ev) log.push(`${ev.kind}@${t}:${ev.at.x},${ev.at.y}`);
      }
      return log;
    };
    const a = run();
    expect(a).toEqual(run());
    expect(a[0]).toBe(`spawn@${SPECIAL.firstAt}:${spots[0][0]},${spots[0][1]}`);
    expect(a[1]).toBe(`expire@${SPECIAL.firstAt + SPECIAL.life}:${spots[0][0]},${spots[0][1]}`);
    expect(a[2]).toBe(`spawn@${SPECIAL.firstAt + SPECIAL.life + SPECIAL.retry}:${spots[1][0]},${spots[1][1]}`);
    for (const line of a.filter((l) => l.startsWith("spawn"))) {
      const [x, y] = line.split(":")[1].split(",").map(Number);
      expect(spots.some(([sx, sy]) => sx === x && sy === y)).toBe(true);
    }
  });

  it("skips a spot when a kid is standing on it", () => {
    const s = new SpecialSpawner(spots);
    const ev = s.update(SPECIAL.firstAt, [kid(spots[0][0], spots[0][1])]);
    expect(ev?.kind).toBe("spawn");
    expect(ev!.at).toEqual({ x: spots[1][0], y: spots[1][1] });
  });

  it("goes to whoever reaches it, stays single and waits after being thrown", () => {
    const s = new SpecialSpawner(spots);
    const far = kid(140, 1000);
    const runner = kid(140, 990);
    s.update(SPECIAL.firstAt, [far, runner]);
    runner.x = spots[0][0] + 30;
    runner.y = spots[0][1] + 10;
    const grab = s.update(SPECIAL.firstAt + 500, [far, runner]);
    expect(grab?.kind).toBe("grab");
    expect(runner.special).toBe(true);
    expect(s.spot).toBeNull();
    for (let t = SPECIAL.firstAt + 600; t < SPECIAL.firstAt + 60000; t += 500) expect(s.update(t, [far, runner])).toBeNull();
    runner.special = false;
    s.used(70000);
    expect(s.update(70000 + SPECIAL.after - 1, [far, runner])).toBeNull();
    expect(s.update(70000 + SPECIAL.after, [far, runner])?.kind).toBe("spawn");
  });

  it("freezes while the match clock is frozen", () => {
    const s = new SpecialSpawner(spots);
    const kids = [kid(960, 960)];
    s.update(SPECIAL.firstAt, kids);
    for (let i = 0; i < 500; i += 1) expect(s.update(SPECIAL.firstAt + 1000, kids)).toBeNull();
    expect(s.spot).not.toBeNull();
  });
});
