import { describe, expect, it } from "vitest";
import { ARENAS } from "./arenas";
import { BODY, HP, KIDS, PILLOW, type KidId } from "./config";
import { lineBlocked, Navigator, traceReaches, traceShot, type Point, type SteerOut } from "./nav";
import { Brain, type BrainView } from "./scenes/brain";
import { seeded, SimKid, simWorld, stepKids, type SimWorld } from "./testing";

const DT = 1 / 60;
const MS = 1000 / 60;

function walk(world: SimWorld, kid: SimKid, goal: Point, seconds: number) {
  const nav = new Navigator(world.nav);
  const out: SteerOut = { x: 0, y: 0, arrived: false };
  const wants = new Map<SimKid, { mx: number; my: number }>();
  let pressing = 0;
  let t = 0;
  nav.setGoal(goal.x, goal.y, 0);
  for (let i = 0; i < seconds * 60; i += 1) {
    t += MS;
    if (!nav.goal && nav.blocked) nav.setGoal(goal.x, goal.y, t);
    const mag = nav.steer(kid, t, out);
    wants.set(kid, { mx: out.x * mag, my: out.y * mag });
    if (stepKids([kid], world, wants, t, DT).has(kid)) pressing += 1;
    if (Math.hypot(kid.x - goal.x, kid.y - goal.y) < 24) return { arrived: true, seconds: t / 1000, pressing: pressing / 60, stuck: nav.stuckEvents };
  }
  return { arrived: false, seconds: t / 1000, pressing: pressing / 60, stuck: nav.stuckEvents };
}

type Match = { kids: SimKid[]; brains: Map<SimKid, Brain>; throws: Map<SimKid, number>; onTarget: Map<SimKid, number>; maxIdle: Map<SimKid, number>; pressing: Map<SimKid, number> };

function match(world: SimWorld, seed: number, seconds: number, opts: { special?: Point | null; skill?: number } = {}): Match {
  const rnd = seeded(seed);
  const kids = KIDS.map((kid, i) => new SimKid(kid, false, world.def.spawns[i][0], world.def.spawns[i][1]));
  const brains = new Map(kids.map((k) => [k, new Brain(k, opts.skill ?? world.def.ai, world, rnd)] as const));
  const targets = new Map();
  const throws = new Map(kids.map((k) => [k, 0]));
  const onTarget = new Map(kids.map((k) => [k, 0]));
  const maxIdle = new Map(kids.map((k) => [k, 0]));
  const pressing = new Map(kids.map((k) => [k, 0]));
  const idle = new Map(kids.map((k) => [k, 0]));
  const wants = new Map<SimKid, { mx: number; my: number }>();
  let t = 0;
  for (let i = 0; i < seconds * 60; i += 1) {
    t += MS;
    const view: BrainView = { fighters: kids, pillows: [], room: world, heat: 0, warm: 1, playerSafeUntil: 0, targets, hider: null, special: opts.special ?? null };
    for (const k of kids) {
      const brain = brains.get(k)!;
      const out = brain.think(t, view);
      wants.set(k, { mx: out.mx, my: out.my });
      if (out.angle !== null && out.target) {
        k.readyAt = t + k.stats.cooldown;
        throws.set(k, throws.get(k)! + 1);
        const trace = traceShot(k.x + Math.cos(out.angle) * 34, k.y + 6, out.angle, world.boxes, world.bounds, { range: PILLOW.range });
        if (traceReaches(trace, out.target.x, out.target.y, BODY.rx * 1.6, BODY.ry * 1.6)) {
          onTarget.set(k, onTarget.get(k)! + 1);
          const victim = out.target as SimKid;
          if (rnd() < 0.45) {
            victim.hp = Math.max(1, victim.hp - 1);
            victim.lastHurtAt = t;
            victim.hurtBy = k;
          }
        }
      }
      if (k.hp < HP && t - k.lastHurtAt > 3500 && Math.floor(t / 2300) !== Math.floor((t - MS) / 2300)) k.hp += 1;
    }
    const before = kids.map((k) => ({ x: k.x, y: k.y }));
    const touched = stepKids(kids, world, wants, t, DT);
    kids.forEach((k, j) => {
      const w = wants.get(k)!;
      const moved = Math.hypot(k.x - before[j].x, k.y - before[j].y);
      const wanted = Math.hypot(w.mx, w.my) > 0.3;
      idle.set(k, wanted && moved < 0.5 ? idle.get(k)! + MS : 0);
      maxIdle.set(k, Math.max(maxIdle.get(k)!, idle.get(k)!));
      if (touched.has(k) && wanted) pressing.set(k, pressing.get(k)! + MS);
    });
  }
  return { kids, brains, throws, onTarget, maxIdle, pressing };
}

describe("Guerra do Pijama bot navigation", () => {
  it("walks around furniture to reach the other side", () => {
    for (const arena of ARENAS) {
      const world = simWorld(arena);
      const rnd = seeded(3);
      let tried = 0;
      for (let i = 0; i < 4000 && tried < 12; i += 1) {
        const a = world.nav.stands[Math.floor(rnd() * world.nav.stands.length)];
        const b = world.nav.stands[Math.floor(rnd() * world.nav.stands.length)];
        const from = { x: world.nav.centerX(a), y: world.nav.centerY(a) };
        const to = { x: world.nav.centerX(b), y: world.nav.centerY(b) };
        if (world.nav.segmentClear(from.x, from.y, to.x, to.y) || Math.hypot(to.x - from.x, to.y - from.y) < 220) continue;
        tried += 1;
        const kid = new SimKid("bia", false, from.x, from.y);
        const run = walk(world, kid, to, 12);
        expect(run.arrived, `${arena.id} ${from.x},${from.y} -> ${to.x},${to.y}`).toBe(true);
        expect(run.pressing, `${arena.id} ${from.x},${from.y} -> ${to.x},${to.y}`).toBeLessThan(0.25);
      }
      expect(tried, arena.id).toBeGreaterThan(5);
    }
  });

  it("never pushes against the yard fence, even when fleeing upwards", () => {
    const world = simWorld(ARENAS[2]);
    const bia = new SimKid("bia", false, 520, 470);
    const lia = new SimKid("lia", false, 520, 800);
    const nico = new SimKid("nico", false, 700, 760);
    const kids = [bia, lia, nico];
    bia.hp = 2;
    bia.lastHurtAt = 0;
    const rnd = seeded(5);
    const brain = new Brain(bia, 0.6, world, rnd);
    const targets = new Map();
    const wants = new Map<SimKid, { mx: number; my: number }>();
    let pressing = 0;
    let t = 0;
    for (let i = 0; i < 60 * 8; i += 1) {
      t += MS;
      bia.lastHurtAt = t;
      const out = brain.think(t, { fighters: kids, pillows: [], room: world, heat: 0, warm: 1, playerSafeUntil: 0, targets, hider: null, special: null });
      wants.set(bia, { mx: out.mx, my: out.my });
      wants.set(lia, { mx: (bia.x - lia.x) / 400, my: (bia.y - lia.y) / 400 });
      const touched = stepKids(kids, world, wants, t, DT);
      if (touched.has(bia) && bia.y <= world.bounds.y0 + 1 && out.my < -0.05) pressing += 1;
    }
    expect(brain.mode).toBe("cover");
    expect(pressing / 60).toBeLessThan(0.2);
  });

  it("re-plans the route when something it did not know about blocks the way", () => {
    for (const ghost of [
      { x0: 930, y0: 700, x1: 970, y1: 730 },
      { x0: 880, y0: 700, x1: 1020, y1: 760 },
    ]) {
      const world = simWorld(ARENAS[0], [ghost]);
      const kid = new SimKid("nico", false, 950, 520);
      const run = walk(world, kid, { x: 950, y: 960 }, 8);
      expect(run.stuck, JSON.stringify(ghost)).toBeGreaterThan(0);
      expect(run.arrived, JSON.stringify(ghost)).toBe(true);
      expect(run.seconds, JSON.stringify(ghost)).toBeLessThan(5);
    }
  });

  it("keeps every bot moving, chasing and throwing in every arena", () => {
    for (const arena of ARENAS) {
      for (const seed of [1, 2, 3]) {
        const world = simWorld(arena);
        const m = match(world, seed, 60);
        for (const k of m.kids) {
          const label = `${arena.id} seed ${seed} ${k.kid}`;
          expect(m.maxIdle.get(k)!, label).toBeLessThan(1200);
          expect(m.pressing.get(k)! / 1000, label).toBeLessThan(2.5);
          expect(m.throws.get(k)!, label).toBeGreaterThan(8);
          expect(m.onTarget.get(k)! / m.throws.get(k)!, label).toBeGreaterThan(0.35);
          expect(m.brains.get(k)!.stuckEvents, label).toBeLessThan(10);
        }
      }
    }
  });

  it("runs to the special pillow when it is the closest", () => {
    const arena = ARENAS[2];
    const world = simWorld(arena);
    for (const [sx, sy] of arena.specialSpots!) {
      for (const [x, y] of arena.spawns) {
        const kid = new SimKid("bia", false, x, y);
        const far1 = new SimKid("lia", false, 1780, 1010);
        const far2 = new SimKid("nico", false, 140, 1010);
        if (Math.hypot(far1.x - sx, far1.y - sy) < Math.hypot(x - sx, y - sy) || Math.hypot(far2.x - sx, far2.y - sy) < Math.hypot(x - sx, y - sy)) continue;
        const brain = new Brain(kid, 0.6, world, seeded(9));
        const kids = [kid, far1, far2];
        const targets = new Map();
        const wants = new Map<SimKid, { mx: number; my: number }>();
        let t = 0;
        let reached = false;
        for (let i = 0; i < 60 * 6 && !reached; i += 1) {
          t += MS;
          const out = brain.think(t, { fighters: kids, pillows: [], room: world, heat: 0, warm: 1, playerSafeUntil: 0, targets, hider: null, special: { x: sx, y: sy } });
          wants.set(kid, { mx: out.mx, my: out.my });
          stepKids(kids, world, wants, t, DT);
          reached = Math.hypot(kid.x - sx, kid.y - sy) < 60;
        }
        expect(reached, `${sx},${sy} from ${x},${y}`).toBe(true);
      }
    }
  });

  it("banks pillows off the sofa to reach someone hiding behind it", () => {
    const arena = ARENAS[1];
    const world = simWorld(arena);
    const me = new SimKid("nico", false, 560, 600);
    const hidden = new SimKid("lia", false, 1000, 480);
    const kids = [me, hidden];
    expect(lineBlocked(world.boxes, me.x, me.y + 6, hidden.x, hidden.y)).toBe(true);
    const brain = new Brain(me, 0.9, world, seeded(21));
    brain.target = hidden;
    const targets = new Map();
    let banked = 0;
    let t = 2000;
    for (let i = 0; i < 400; i += 1) {
      t += MS;
      me.x = 560;
      me.y = 600;
      me.vx = 0;
      me.vy = 0;
      const out = brain.think(t, { fighters: kids, pillows: [], room: world, heat: 0, warm: 1, playerSafeUntil: 0, targets, hider: null, special: null });
      if (out.angle !== null && out.target === hidden) {
        me.readyAt = t + me.stats.cooldown;
        const trace = traceShot(me.x + Math.cos(out.angle) * 34, me.y + 6, out.angle, world.boxes, world.bounds, { range: PILLOW.range });
        if (trace.bounce && traceReaches(trace, hidden.x, hidden.y, BODY.rx * 1.3, BODY.ry * 1.3, trace.bounce.at)) banked += 1;
      }
    }
    expect(brain.bankShots).toBeGreaterThan(0);
    expect(banked).toBeGreaterThan(0);
  });
});

export type { KidId };
