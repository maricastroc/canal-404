import { createRequire } from "node:module";
import Matter from "matter-js";
import type MatterNamespace from "matter-js";
import { describe, expect, it } from "vitest";
import { BALL_BODY, BALL_R, BELT_SPEED, FAN_ACCEL, FAN_HALF, FAN_REACH, FLOOR_Y, GRAVITY_Y, H, PARTS, SPRING_SPEED, STEP_MS, SURFACE, W, partAngle, partFacing } from "./config";
import { ballInSensor, goalLayout, placementConflict, sceneBlocks, type PlacedPart } from "./geometry";
import { LEVELS, type LevelDef } from "./levels";
import { DEG_TO_RAD, LabSim, MAX_STEPS, REST_SPEED, REST_STEPS, physicsIsDeterministic, simulateLab, springDirection, type SimOutcome, type SimTarget } from "./sim";
import { SOLUTIONS, STEPS_BEFORE_EXTRACTION } from "./solutions";
import { cos, sin } from "./trig";

type Physics = Pick<typeof MatterNamespace, "Engine" | "Bodies" | "Body" | "Composite" | "Events" | "Resolver" | "Vertices">;

type Trace = { outcome: SimOutcome; steps: number; samples: number[] };

const require = createRequire(import.meta.url);

function phaserMatter(): Physics {
  const lib = "phaser/src/physics/matter-js/lib/";
  return {
    Engine: require(`${lib}core/Engine`),
    Bodies: require(`${lib}factory/Bodies`),
    Body: require(`${lib}body/Body`),
    Composite: require(`${lib}body/Composite`),
    Events: require(`${lib}core/Events`),
    Resolver: require(`${lib}collision/Resolver`),
    Vertices: require(`${lib}geometry/Vertices`),
  };
}

function untouchedMatter(): Physics {
  const id = require.resolve("matter-js");
  const shared = require.cache[id];
  delete require.cache[id];
  const fresh = require("matter-js") as typeof MatterNamespace;
  if (shared) require.cache[id] = shared;
  else delete require.cache[id];
  return fresh;
}

function legacyRun(M: Physics, level: LevelDef, parts: PlacedPart[]): Trace {
  Object.assign(M.Resolver, { _restingThresh: 2, _restingThreshTangent: Math.sqrt(6) });
  const engine = M.Engine.create({ gravity: { x: 0, y: GRAVITY_Y, scale: 0.001 }, enableSleeping: false });
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  const springs = new Map<number, PlacedPart>();
  const belts = new Map<number, PlacedPart>();
  const add = (x: number, y: number, w: number, h: number, deg: number, surface = true, extra = {}) => {
    const body = M.Bodies.rectangle(x, y, w, h, { isStatic: true, angle: deg * (Math.PI / 180), ...(surface ? SURFACE : {}), ...extra });
    M.Composite.add(engine.world, body);
    return body;
  };
  add(W / 2, FLOOR_Y + 60, W + 200, 120, 0, true, { friction: 0.02 });
  add(-30, H / 2, 60, H * 2, 0, false);
  add(W + 30, H / 2, 60, H * 2, 0, false);
  for (const b of sceneBlocks(level)) add(b.x, b.y, b.w, b.h, b.angle ?? 0);
  for (const p of parts) {
    const body = add(p.x, p.y, PARTS[p.type].w, PARTS[p.type].h, partAngle(p.type, p.rot));
    if (p.type === "spring") springs.set(body.id, p);
    if (p.type === "belt") belts.set(body.id, p);
  }
  const ball = M.Bodies.circle(level.pipe.x, level.pipe.y, BALL_R, { ...BALL_BODY, label: "ball" });
  M.Composite.add(engine.world, ball);
  M.Body.setVelocity(ball, { x: level.pipe.vx, y: level.pipe.vy });
  const otherOf = (pair: MatterNamespace.Pair) => (pair.bodyA === ball ? pair.bodyB : pair.bodyB === ball ? pair.bodyA : null);
  M.Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      const other = otherOf(pair);
      const spring = other && springs.get(other.id);
      if (!spring) continue;
      const a = partAngle(spring.type, spring.rot) * (Math.PI / 180);
      const nx = Math.sin(a);
      const ny = -Math.cos(a);
      if ((ball.position.x - spring.x) * nx + (ball.position.y - spring.y) * ny > 0) M.Body.setVelocity(ball, { x: nx * SPRING_SPEED, y: ny * SPRING_SPEED });
    }
  });
  M.Events.on(engine, "collisionActive", (event) => {
    for (const pair of event.pairs) {
      const other = otherOf(pair);
      const belt = other && belts.get(other.id);
      if (!belt || ball.position.y >= belt.y) continue;
      const target = partFacing(belt.type, belt.rot) * BELT_SPEED;
      M.Body.setVelocity(ball, { x: ball.velocity.x + (target - ball.velocity.x) * 0.25, y: ball.velocity.y });
    }
  });
  const sensor = goalLayout(level.goal).sensor;
  const samples: number[] = [];
  let steps = 0;
  let rest = 0;
  for (;;) {
    for (const p of parts) {
      if (p.type !== "fan") continue;
      const f = partFacing(p.type, p.rot);
      const dx = (ball.position.x - p.x) * f;
      const dy = Math.abs(ball.position.y - p.y);
      if (dx > 40 && dx < 48 + FAN_REACH && dy < FAN_HALF) {
        const k = 1 - 0.5 * ((dx - 48) / FAN_REACH);
        M.Body.applyForce(ball, ball.position, { x: f * ball.mass * FAN_ACCEL * k, y: 0 });
      }
    }
    M.Engine.update(engine, STEP_MS);
    steps += 1;
    const { x, y } = ball.position;
    samples.push(x, y, ball.angle);
    if (ballInSensor(x, y, BALL_R, sensor)) return { outcome: "success", steps, samples };
    if (y > H + 100 || x < -100 || x > W + 100) return { outcome: "out", steps, samples };
    rest = ball.speed < REST_SPEED ? rest + 1 : 0;
    if (rest > REST_STEPS) return { outcome: "stopped", steps, samples };
    if (steps >= MAX_STEPS) return { outcome: "timeout", steps, samples };
  }
}

function traced(level: LevelDef, parts: PlacedPart[]): Trace {
  const sim = new LabSim(level, parts);
  const samples: number[] = [];
  let outcome: SimOutcome | null = null;
  while (!outcome) {
    outcome = sim.step();
    samples.push(sim.x, sim.y, sim.angle);
  }
  sim.destroy();
  return { outcome, steps: sim.steps, samples };
}

function sameBits(a: Trace, b: Trace) {
  return a.outcome === b.outcome && a.steps === b.steps && a.samples.length === b.samples.length && a.samples.every((v, i) => Object.is(v, b.samples[i]));
}

function variants(level: LevelDef, reach: number) {
  const golden = SOLUTIONS[level.id];
  const out: PlacedPart[][] = [golden];
  golden.forEach((part, k) => {
    for (let dx = -reach; dx <= reach; dx += 1) {
      for (let dy = -reach; dy <= reach; dy += 1) {
        for (let rot = 0; rot < PARTS[part.type].rotations.length; rot += 1) {
          const machine = golden.map((p, j) => (j === k ? { ...p, x: p.x + dx * 20, y: p.y + dy * 20, rot } : p));
          if (machine.every((p, j) => !placementConflict(level, machine.slice(0, j), p))) out.push(machine);
        }
      }
    }
  });
  return out;
}

describe("Laboratório simulation", () => {
  it("solves every level with the known machine in the same number of steps as the game before the extraction", () => {
    for (const level of LEVELS) {
      expect(simulateLab(level, SOLUTIONS[level.id]), level.id).toMatchObject({ outcome: "success", steps: STEPS_BEFORE_EXTRACTION[level.id] });
    }
  });

  it("matches the physics the scene ran before the extraction on hundreds of machines", { timeout: 120_000 }, () => {
    const phaser = phaserMatter();
    const plain = untouchedMatter();
    expect(plain.Vertices.rotate).not.toBe(Matter.Vertices.rotate);
    expect(phaser.Vertices.rotate).not.toBe(Matter.Vertices.rotate);
    let machines = 0;
    let identical = 0;
    const outcomes = new Set<SimOutcome>();
    for (const level of LEVELS) {
      for (const parts of variants(level, 3)) {
        const before = legacyRun(phaser, level, parts);
        expect(sameBits(legacyRun(plain, level, parts), before), `${level.id} engine ${JSON.stringify(parts)}`).toBe(true);
        const after = traced(level, parts);
        expect({ outcome: after.outcome, steps: after.steps }, `${level.id} ${JSON.stringify(parts)}`).toEqual({ outcome: before.outcome, steps: before.steps });
        machines += 1;
        if (sameBits(after, before)) identical += 1;
        outcomes.add(before.outcome);
      }
    }
    expect(machines).toBeGreaterThan(1000);
    expect(identical / machines).toBeGreaterThan(0.99);
    expect([...outcomes].sort()).toEqual(expect.arrayContaining(["stopped", "success", "timeout"]));
  });

  it("gives the same trajectory every time, whatever ran before", () => {
    const pixel = LEVELS.find((l) => l.id === "pixel")!;
    const first = traced(pixel, SOLUTIONS.pixel);
    simulateLab(LEVELS.find((l) => l.id === "finale")!, SOLUTIONS.finale);
    const again = traced(pixel, SOLUTIONS.pixel.map((p) => ({ ...p })));
    expect(sameBits(first, again)).toBe(true);
  });

  it("rotates bodies with the deterministic trigonometry", () => {
    expect(physicsIsDeterministic()).toBe(true);
    const a = partAngle("spring", 3) * DEG_TO_RAD;
    expect(springDirection(3)).toEqual({ nx: sin(a), ny: -cos(a) });
  });

  it("tells the scene about touches, spring launches, belts and wind", () => {
    const seen: string[] = [];
    const describe = (target: SimTarget) => (target.kind === "floor" || target.kind === "edge" ? target.kind : `${target.kind}-${target.index}`);
    const handlers = {
      touch: (target: SimTarget, _speed: number, launched: boolean) => seen.push(`touch:${describe(target)}${launched ? ":launch" : ""}`),
      launch: (part: number) => seen.push(`launch:${part}`),
      belt: (part: number) => seen.push(`belt:${part}`),
      wind: (parts: number[]) => {
        if (parts.length) seen.push(`wind:${parts.join(",")}`);
      },
    };
    for (const id of ["toast", "juice", "remote"]) {
      const sim = new LabSim(LEVELS.find((l) => l.id === id)!, SOLUTIONS[id], handlers);
      expect(sim.run().outcome).toBe("success");
      sim.destroy();
    }
    expect(seen).toContain("touch:part-0:launch");
    expect(seen).toContain("launch:0");
    expect(seen).toContain("wind:0");
    expect(seen).toContain("belt:0");
    expect(seen).toContain("belt:1");
    expect(seen.some((s) => s.startsWith("touch:block-"))).toBe(true);
  });

  it("stops a machine that does not reach the goal", () => {
    const pixel = LEVELS.find((l) => l.id === "pixel")!;
    expect(simulateLab(pixel, [{ type: "ramp", x: 620, y: 420, rot: 0 }]).outcome).toBe("stopped");
    expect(simulateLab(pixel, []).outcome).not.toBe("success");
  });
});
