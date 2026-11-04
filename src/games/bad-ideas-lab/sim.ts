import Matter from "matter-js";
import { BALL_BODY, BALL_R, BELT_SPEED, FAN_ACCEL, FAN_HALF, FAN_REACH, FLOOR_Y, GRAVITY_Y, H, PARTS, RUN_TIMEOUT, SPRING_SPEED, STEP_MS, SURFACE, W, partAngle, partFacing } from "./config";
import { ballInSensor, goalLayout, sceneBlocks, type PlacedPart, type Sensor } from "./geometry";
import type { LevelDef } from "./levels";
import { cos, sin } from "./trig";

export const MAX_STEPS = Math.round(RUN_TIMEOUT / STEP_MS);
export const REST_STEPS = 50;
export const REST_SPEED = 0.15;
export const DEG_TO_RAD = Math.PI / 180;

export type SimLevel = Pick<LevelDef, "pipe" | "blocks" | "goal">;

export type SimOutcome = "success" | "out" | "stopped" | "timeout";

export type SimTarget = { kind: "floor" } | { kind: "edge" } | { kind: "block"; index: number } | { kind: "part"; index: number };

export type SimHandlers = {
  touch?: (target: SimTarget, speed: number, launched: boolean) => void;
  launch?: (part: number, nx: number, ny: number) => void;
  belt?: (part: number) => void;
  wind?: (parts: number[]) => void;
};

export type SimResult = { outcome: SimOutcome; steps: number; end: { x: number; y: number } };

function rotateVertices(vertices: Matter.Vector[], angle: number, point: Matter.Vector) {
  if (angle === 0) return vertices;
  const c = cos(angle);
  const s = sin(angle);
  const px = point.x;
  const py = point.y;
  for (let i = 0; i < vertices.length; i += 1) {
    const v = vertices[i];
    const dx = v.x - px;
    const dy = v.y - py;
    v.x = px + (dx * c - dy * s);
    v.y = py + (dx * s + dy * c);
  }
  return vertices;
}

function rotateAxes(axes: Matter.Vector[], angle: number) {
  if (angle === 0) return;
  const c = cos(angle);
  const s = sin(angle);
  for (let i = 0; i < axes.length; i += 1) {
    const axis = axes[i];
    const x = axis.x * c - axis.y * s;
    axis.y = axis.x * s + axis.y * c;
    axis.x = x;
  }
}

Matter.Vertices.rotate = rotateVertices;
Matter.Axes.rotate = rotateAxes;
Object.assign(Matter.Resolver, { _restingThresh: 2, _restingThreshTangent: Math.sqrt(6) });

export function physicsIsDeterministic() {
  return Matter.Vertices.rotate === rotateVertices && Matter.Axes.rotate === rotateAxes;
}

export function springDirection(rot: number) {
  const a = partAngle("spring", rot) * DEG_TO_RAD;
  return { nx: sin(a), ny: -cos(a) };
}

export class LabSim {
  readonly engine: Matter.Engine;
  readonly ball: Matter.Body;
  private readonly parts: readonly PlacedPart[];
  private readonly targets = new Map<number, SimTarget>();
  private readonly sensor: Sensor;
  private readonly handlers: SimHandlers;
  private rest = 0;
  steps = 0;
  outcome: SimOutcome | null = null;

  constructor(level: SimLevel, parts: readonly PlacedPart[], handlers: SimHandlers = {}) {
    this.parts = parts.map((p) => ({ type: p.type, x: p.x, y: p.y, rot: p.rot }));
    this.handlers = handlers;
    this.sensor = goalLayout(level.goal).sensor;
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY_Y, scale: 0.001 },
      enableSleeping: false,
      positionIterations: 10,
      velocityIterations: 8,
    });
    this.addStatic(W / 2, FLOOR_Y + 60, W + 200, 120, 0, { kind: "floor" }, true, { friction: 0.02 });
    this.addStatic(-30, H / 2, 60, H * 2, 0, { kind: "edge" }, false);
    this.addStatic(W + 30, H / 2, 60, H * 2, 0, { kind: "edge" }, false);
    sceneBlocks(level).forEach((b, index) => this.addStatic(b.x, b.y, b.w, b.h, b.angle ?? 0, { kind: "block", index }));
    this.parts.forEach((p, index) => {
      const def = PARTS[p.type];
      this.addStatic(p.x, p.y, def.w, def.h, partAngle(p.type, p.rot), { kind: "part", index });
    });
    this.ball = Matter.Bodies.circle(level.pipe.x, level.pipe.y, BALL_R, { ...BALL_BODY, label: "ball" });
    Matter.Composite.add(this.engine.world, this.ball);
    Matter.Body.setVelocity(this.ball, { x: level.pipe.vx, y: level.pipe.vy });
    Matter.Events.on(this.engine, "collisionStart", (event) => this.onStart(event));
    Matter.Events.on(this.engine, "collisionActive", (event) => this.onActive(event));
  }

  get x() {
    return this.ball.position.x;
  }

  get y() {
    return this.ball.position.y;
  }

  get angle() {
    return this.ball.angle;
  }

  get speed() {
    return this.ball.speed;
  }

  step(): SimOutcome | null {
    if (this.outcome) return this.outcome;
    this.applyFans();
    Matter.Engine.update(this.engine, STEP_MS);
    this.steps += 1;
    const { x, y } = this.ball.position;
    if (ballInSensor(x, y, BALL_R, this.sensor)) this.outcome = "success";
    else if (y > H + 100 || x < -100 || x > W + 100) this.outcome = "out";
    else {
      this.rest = this.ball.speed < REST_SPEED ? this.rest + 1 : 0;
      if (this.rest > REST_STEPS) this.outcome = "stopped";
      else if (this.steps >= MAX_STEPS) this.outcome = "timeout";
    }
    return this.outcome;
  }

  run(): SimResult {
    while (!this.step());
    return { outcome: this.outcome!, steps: this.steps, end: { x: this.ball.position.x, y: this.ball.position.y } };
  }

  destroy() {
    Matter.Events.off(this.engine, "collisionStart");
    Matter.Events.off(this.engine, "collisionActive");
    Matter.Composite.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
  }

  private addStatic(x: number, y: number, w: number, h: number, angleDeg: number, target: SimTarget, surface = true, extra: Matter.IChamferableBodyDefinition = {}) {
    const body = Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, angle: angleDeg * DEG_TO_RAD, ...(surface ? SURFACE : {}), ...extra });
    Matter.Composite.add(this.engine.world, body);
    this.targets.set(body.id, target);
    return body;
  }

  private other(pair: Matter.Pair) {
    const ball = this.ball;
    const body = pair.bodyA === ball ? pair.bodyB : pair.bodyB === ball ? pair.bodyA : null;
    return body ? (this.targets.get(body.id) ?? null) : null;
  }

  private onStart(event: Matter.IEventCollision<Matter.Engine>) {
    const ball = this.ball;
    for (const pair of event.pairs) {
      const target = this.other(pair);
      if (!target) continue;
      const part = target.kind === "part" ? this.parts[target.index] : null;
      if (part?.type === "spring") {
        const { nx, ny } = springDirection(part.rot);
        if ((ball.position.x - part.x) * nx + (ball.position.y - part.y) * ny > 0) {
          Matter.Body.setVelocity(ball, { x: nx * SPRING_SPEED, y: ny * SPRING_SPEED });
          this.handlers.touch?.(target, Matter.Vector.magnitude(ball.velocity), true);
          this.handlers.launch?.((target as { index: number }).index, nx, ny);
          continue;
        }
      }
      this.handlers.touch?.(target, Matter.Vector.magnitude(ball.velocity), false);
    }
  }

  private onActive(event: Matter.IEventCollision<Matter.Engine>) {
    const ball = this.ball;
    for (const pair of event.pairs) {
      const target = this.other(pair);
      if (!target || target.kind !== "part") continue;
      const part = this.parts[target.index];
      if (part.type !== "belt" || ball.position.y >= part.y) continue;
      const goal = partFacing(part.type, part.rot) * BELT_SPEED;
      Matter.Body.setVelocity(ball, { x: ball.velocity.x + (goal - ball.velocity.x) * 0.25, y: ball.velocity.y });
      this.handlers.belt?.(target.index);
    }
  }

  private applyFans() {
    const ball = this.ball;
    const blowing: number[] = [];
    this.parts.forEach((p, index) => {
      if (p.type !== "fan") return;
      const f = partFacing(p.type, p.rot);
      const dx = (ball.position.x - p.x) * f;
      const dy = Math.abs(ball.position.y - p.y);
      if (dx > 40 && dx < 48 + FAN_REACH && dy < FAN_HALF) {
        const k = 1 - 0.5 * ((dx - 48) / FAN_REACH);
        Matter.Body.applyForce(ball, ball.position, { x: f * ball.mass * FAN_ACCEL * k, y: 0 });
        blowing.push(index);
      }
    });
    this.handlers.wind?.(blowing);
  }
}

export function simulateLab(level: SimLevel, parts: readonly PlacedPart[]): SimResult {
  const sim = new LabSim(level, parts);
  const result = sim.run();
  sim.destroy();
  return result;
}

export function traceLab(level: SimLevel, parts: readonly PlacedPart[]): SimResult & { touched: number[] } {
  const touched = new Set<number>();
  const sim = new LabSim(level, parts, {
    touch: (target) => {
      if (target.kind === "part") touched.add(target.index);
    },
    belt: (index) => touched.add(index),
    wind: (indexes) => indexes.forEach((index) => touched.add(index)),
  });
  const result = sim.run();
  sim.destroy();
  return { ...result, touched: [...touched].sort((a, b) => a - b) };
}
