import { circle, DEG_TO_RAD, Matter, roundedRectangle } from "@/lib/physics/matter";
import { cos, sin } from "@/lib/physics/trig";
import {
  ANCHOR,
  ANGLE_MAX,
  ANGLE_MIN,
  BURST_RADIUS,
  GRAVITY_Y,
  GROUND_Y,
  H,
  MAX_PULL,
  MAX_SPEED,
  MIN_POWER,
  MIN_SPEED,
  PROJECTILE_ORDER,
  PROJECTILES,
  SCORE,
  SOAK_RADIUS,
  STEP_MS,
  W,
  type ProjectileDef,
  type ProjectileId,
} from "./config";
import { ammoTotal, phaseById, type GadgetDef, type PhaseDef, type PieceDef, type Point, type StaticDef, type TargetDef, type Zone } from "./phases";

export type StreetPhase = "attract" | "ready" | "flying" | "settling" | "over";

export type Launch = { at: number; angle: number; power: number; ammo: ProjectileId };

export type Pose = { x: number; y: number; angle: number };

export type SimPiece = { def: PieceDef; index: number; body: Matter.Body; rest: Pose; messy: boolean; offset: Point };

export type SimTarget = { def: TargetDef; index: number; body: Matter.Body; rest: Pose; hit: boolean; offset: Point };

export type SimRope = { def: Extract<GadgetDef, { type: "rope" }>; body: Matter.Body; constraint: Matter.Constraint | null; cut: boolean };

export type SimBucket = { def: Extract<GadgetDef, { type: "bucket" }>; body: Matter.Body; rest: Pose; dropped: number; landed: boolean; spilled: boolean };

export type SimFaucet = { def: Extract<GadgetDef, { type: "faucet" }>; body: Matter.Body; on: boolean };

export type SimBlower = { def: Extract<GadgetDef, { type: "blower" }>; body: Matter.Body; rest: Pose; on: boolean; dir: number };

export type SimTurnstile = { def: Extract<GadgetDef, { type: "turnstile" }>; body: Matter.Body; angle: number; from: number; to: number; turnAt: number; rest: number; arm: Point; turns: number };

export type GadgetEvent =
  | { type: "rope-cut"; rope: SimRope; x: number; y: number }
  | { type: "bucket-spill"; bucket: SimBucket; x: number; y: number }
  | { type: "faucet-on"; faucet: SimFaucet; x: number; y: number }
  | { type: "blower-off"; blower: SimBlower; x: number; y: number }
  | { type: "turnstile-turn"; turnstile: SimTurnstile; x: number; y: number };

export type SimImpact = {
  a: Matter.Body;
  b: Matter.Body;
  rel: number;
  x: number;
  y: number;
  flying: boolean;
  other: Matter.Body | null;
  firstOfShot: boolean;
};

export type StreetStats = { targets: number; targetPoints: number; mess: number; combos: number; gadgets: number; launches: number; ammoLeft: number };

export type StreetTally = {
  won: boolean;
  score: number;
  stars: number;
  targetScore: number;
  messScore: number;
  comboScore: number;
  gadgetScore: number;
  clearBonus: number;
  ammoBonus: number;
  stats: StreetStats;
};

export type StreetHandlers = {
  load?: (def: ProjectileDef) => void;
  select?: (def: ProjectileDef) => void;
  impact?: (impact: SimImpact) => void;
  hit?: (target: SimTarget, shotHits: number, combo: boolean) => void;
  mess?: (points: number, x: number, y: number) => void;
  score?: (score: number) => void;
  burst?: (x: number, y: number, balloon: Matter.Body) => void;
  gadget?: (event: GadgetEvent) => void;
  shotEnd?: (shot: { hits: number; mess: number; nearest: number; body: Matter.Body | null }) => void;
  vanish?: (body: Matter.Body) => void;
  outOfAmmo?: () => void;
  finish?: (tally: StreetTally) => void;
};

const ms = (value: number) => Math.round(value / STEP_MS);

export const SETTLE_STEPS = 90;
export const ANGLE_STEPS = { min: ANGLE_MIN * 100, max: ANGLE_MAX * 100 };
export const POWER_STEPS = { min: Math.round(MIN_POWER * 1000), max: 1000 };
export const MAX_STEPS = 20_000;

const BALLOON_ARM = 4;
const SLOW_STEPS = 26;
const SETTLED_AFTER_IMPACT = ms(2600);
const MAX_FLIGHT = ms(7000);
const BURST_END = ms(450);
const SPENT_FADE = ms(250);
const RELOAD_HIT = ms(380);
const RELOAD_MISS = ms(650);
const LAST_SHOT_WAIT = ms(2400);
const LAST_SHOT_MAX = ms(10_000);
const FINALE = ms(1300);
const CALM_SPEED = 0.3;
const CALM_SPIN = 0.005;
const CALM_STEPS = 30;
const AIM_PHYSICS = ms(10_000);
const DIRECT_HIT = 8;
const STRUCK_HIT = 2.5;
const ROPE_CUT_SPEED = 3;
const FAUCET_TOUCH = 2.5;
const BUCKET_TIP = 0.8;
const BUCKET_SPILL: Zone = { x: -150, y: -70, w: 300, h: 300 };
const BLOWER_OFF_TURN = 0.5;
const BLOWER_OFF_SHIFT = 30;
const LIGHT_DENSITY = 0.0016;

const BASE_STATICS: (StaticDef & { label: string })[] = [
  { x: W / 2, y: GROUND_Y + 80, w: W + 800, h: 160, look: "none", label: "ground" },
  { x: -70, y: H / 2 - 600, w: 140, h: H + 1600, look: "none", label: "wall" },
  { x: W + 70, y: H / 2 - 600, w: 140, h: H + 1600, look: "none", label: "wall" },
  { x: 1750, y: 430, w: 104, h: 20, look: "none", label: "branch" },
  { x: 1818, y: 700, w: 62, h: 500, look: "none", label: "trunk" },
];

function wrapAngle(value: number) {
  const range = Math.PI * 2;
  return -Math.PI + ((((value + Math.PI) % range) + range) % range);
}

function distance(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function inZone(zone: Zone, x: number, y: number) {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number, from: number, to: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(from, Math.min(to, t));
  return distance(px, py, ax + dx * t, ay + dy * t);
}

function crosses(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function rotatePoint(p: Point, angle: number): Point {
  if (angle === 0) return { x: p.x, y: p.y };
  const c = cos(angle);
  const s = sin(angle);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

export function launchPose(angle: number, power: number) {
  const rad = (angle / 100) * DEG_TO_RAD;
  const c = cos(rad);
  const s = sin(rad);
  const p = power / 1000;
  const pull = p * MAX_PULL;
  const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * p;
  return { x: ANCHOR.x - c * pull, y: ANCHOR.y + s * pull, vx: c * speed, vy: -s * speed };
}

export function validLaunchValues(angle: number, power: number) {
  return (
    Number.isInteger(angle) &&
    Number.isInteger(power) &&
    angle >= ANGLE_STEPS.min &&
    angle <= ANGLE_STEPS.max &&
    power >= POWER_STEPS.min &&
    power <= POWER_STEPS.max
  );
}

export function isProjectileId(value: unknown): value is ProjectileId {
  return typeof value === "string" && (PROJECTILE_ORDER as readonly string[]).includes(value);
}

export function phaseStars(phase: PhaseDef, won: boolean, launches: number) {
  if (!won) return 0;
  return launches <= phase.par[0] ? 3 : launches <= phase.par[1] ? 2 : 1;
}

type Timer = { at: number; seq: number; run: () => void };

export class StreetSim {
  readonly engine: Matter.Engine;
  readonly phaseDef: PhaseDef;
  readonly statics: { def: StaticDef; body: Matter.Body }[] = [];
  readonly pieces: SimPiece[] = [];
  readonly targets: SimTarget[] = [];
  readonly ropes: SimRope[] = [];
  readonly buckets: SimBucket[] = [];
  readonly faucets: SimFaucet[] = [];
  readonly blowers: SimBlower[] = [];
  readonly turnstiles: SimTurnstile[] = [];
  readonly pivots: { def: Extract<GadgetDef, { type: "pivot" }>; body: Matter.Body }[] = [];
  readonly launches: Launch[] = [];
  readonly stock: Record<ProjectileId, number> = { shoe: 0, balloon: 0, tire: 0, duck: 0 };
  readonly spent: Matter.Body[] = [];
  phase: StreetPhase = "attract";
  steps = 0;
  score = 0;
  current: ProjectileDef | null = null;
  loaded = false;
  flying: Matter.Body | null = null;
  flyingDef: ProjectileDef | null = null;
  finishing = false;
  tally: StreetTally | null = null;
  private readonly handlers: StreetHandlers;
  private readonly targetByBody = new Map<number, SimTarget>();
  private readonly bodyById = new Map<string, Matter.Body>();
  private readonly radius = new Map<number, number>();
  private readonly projectileIds = new Set<number>();
  private timers: Timer[] = [];
  private seq = 0;
  private launchedAt = 0;
  private slowSteps = 0;
  private pendingBurst = false;
  private pendingHits = new Set<SimTarget>();
  private pendingFaucets = new Set<SimFaucet>();
  private pendingLandings = new Set<SimBucket>();
  private impacts: Omit<SimImpact, "firstOfShot">[] = [];
  private shotHits = 0;
  private shotMess = 0;
  private shotNearest = Infinity;
  private shotImpacts = 0;
  private firstImpactAt = -1;
  private targetScore = 0;
  private messScore = 0;
  private comboScore = 0;
  private gadgetScore = 0;
  private calmSteps = 0;
  private aimSteps = 0;
  private waitingSince = -1;

  constructor(phase: PhaseDef | string, handlers: StreetHandlers = {}) {
    const def = typeof phase === "string" ? phaseById(phase) : phase;
    if (!def) throw new Error(`unknown phase ${String(phase)}`);
    this.phaseDef = def;
    this.handlers = handlers;
    for (const id of PROJECTILE_ORDER) this.stock[id] = def.ammo[id] ?? 0;
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY_Y, scale: 0.001 },
      enableSleeping: false,
      positionIterations: 10,
      velocityIterations: 8,
    });
    for (const s of BASE_STATICS) this.addStatic(s, s.label);
    for (const s of def.statics) this.statics.push({ def: s, body: this.addStatic(s, `static:${s.look}`) });
    def.pieces.forEach((p, index) => {
      const { body, offset } = this.addPiece(p, `piece:${p.id}`);
      this.pieces.push({ def: p, index, body, rest: this.poseOf(body), messy: false, offset });
    });
    def.targets.forEach((t, index) => {
      const { body, offset } = this.addPiece(t, `target:${t.id}`);
      const state: SimTarget = { def: t, index, body, rest: this.poseOf(body), hit: false, offset };
      this.targets.push(state);
      this.targetByBody.set(body.id, state);
    });
    for (const g of def.gadgets) this.addGadget(g);
    Matter.Events.on(this.engine, "collisionStart", (event) => this.onCollision(event));
    for (let i = 0; i < SETTLE_STEPS; i += 1) {
      this.applyDevices();
      Matter.Engine.update(this.engine, STEP_MS);
    }
    for (const t of this.targets) t.rest = this.poseOf(t.body);
    for (const p of this.pieces) p.rest = this.poseOf(p.body);
    for (const b of this.buckets) b.rest = this.poseOf(b.body);
    for (const b of this.blowers) b.rest = this.poseOf(b.body);
  }

  get idle() {
    return (
      this.phase === "ready" &&
      this.timers.length === 0 &&
      !this.turnstiles.some((t) => t.turnAt >= 0) &&
      (this.calmSteps >= CALM_STEPS || this.aimSteps >= AIM_PHYSICS)
    );
  }

  get canLaunch() {
    return this.phase === "ready" && this.loaded && this.current !== null && this.stock[this.current.id] > 0 && !this.finishing;
  }

  get ammoLeft() {
    return PROJECTILE_ORDER.reduce((sum, id) => sum + this.stock[id], 0);
  }

  get ammoTotal() {
    return ammoTotal(this.phaseDef);
  }

  body(id: string) {
    return this.bodyById.get(id) ?? null;
  }

  isProjectile(body: Matter.Body) {
    return this.projectileIds.has(body.id);
  }

  start() {
    if (this.phase !== "attract") return;
    this.loadNext();
  }

  select(id: ProjectileId) {
    if (this.phase !== "ready" || !this.loaded || this.finishing || this.stock[id] <= 0) return false;
    if (this.current?.id === id) return true;
    this.current = PROJECTILES[id];
    this.handlers.select?.(this.current);
    return true;
  }

  launch(angle: number, power: number, ammo: ProjectileId): Matter.Body | null {
    if (!validLaunchValues(angle, power) || !isProjectileId(ammo) || this.stock[ammo] <= 0) return null;
    if (this.current?.id !== ammo && !this.select(ammo)) return null;
    if (!this.canLaunch) return null;
    const def = this.current!;
    const pose = launchPose(angle, power);
    const options: Matter.IBodyDefinition = {
      density: def.density,
      restitution: def.restitution,
      friction: def.friction,
      frictionAir: def.frictionAir,
      label: `projectile:${def.id}`,
    };
    const body =
      def.shape.type === "rectangle"
        ? roundedRectangle(pose.x, pose.y, def.shape.width, def.shape.height, 12, options)
        : circle(pose.x, pose.y, def.shape.radius, options);
    this.add(body);
    this.projectileIds.add(body.id);
    this.radius.set(body.id, def.shape.type === "rectangle" ? def.shape.height / 2 + 4 : def.shape.radius);
    Matter.Body.setVelocity(body, { x: pose.vx, y: pose.vy });
    Matter.Body.setAngularVelocity(body, def.spin);
    this.stock[def.id] -= 1;
    this.launches.push({ at: this.steps, angle, power, ammo: def.id });
    this.flying = body;
    this.flyingDef = def;
    this.launchedAt = this.steps;
    this.loaded = false;
    this.slowSteps = 0;
    this.shotHits = 0;
    this.shotMess = 0;
    this.shotNearest = Infinity;
    this.shotImpacts = 0;
    this.firstImpactAt = -1;
    this.pendingBurst = false;
    this.calmSteps = 0;
    this.aimSteps = 0;
    this.phase = "flying";
    return body;
  }

  step(): boolean {
    if (this.phase === "attract" || this.idle) return false;
    this.applyDevices();
    Matter.Engine.update(this.engine, STEP_MS);
    this.steps += 1;
    if (this.pendingBurst) this.burstBalloon();
    if (this.phase !== "over") this.checkWorld();
    this.processImpacts();
    this.runTimers();
    this.trackCalm();
    return true;
  }

  ropeEnds(rope: SimRope) {
    const b = rope.body;
    const local = rotatePoint({ x: rope.def.attach.x, y: rope.def.attach.y }, b.angle);
    return { ax: rope.def.anchor.x, ay: rope.def.anchor.y, bx: b.position.x + local.x, by: b.position.y + local.y };
  }

  destroy() {
    Matter.Events.off(this.engine, "collisionStart");
    Matter.Composite.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
  }

  private add(body: Matter.Body) {
    Matter.Composite.add(this.engine.world, body);
    return body;
  }

  private addStatic(s: StaticDef, label: string) {
    const body = roundedRectangle(s.x, s.y, s.w, s.h, 0, { isStatic: true, label, friction: 0.9, restitution: 0.1 });
    if (s.angle) Matter.Body.setAngle(body, s.angle * DEG_TO_RAD);
    return this.add(body);
  }

  private addPiece(def: PieceDef, label: string) {
    const options: Matter.IBodyDefinition = {
      density: def.density,
      friction: def.friction ?? 0.7,
      frictionStatic: 1,
      restitution: def.restitution ?? 0.08,
      frictionAir: def.frictionAir ?? 0.008,
      isStatic: Boolean(def.fixed),
      label,
    };
    const shape = def.shape;
    let body: Matter.Body;
    if (shape.type === "ball") {
      body = circle(def.x, def.y, shape.r, options);
      this.radius.set(body.id, shape.r);
    } else if (shape.type === "box") {
      body = roundedRectangle(def.x, def.y, shape.w, shape.h, shape.chamfer ?? 0, options);
      this.radius.set(body.id, Math.min(shape.w, shape.h) / 2);
    } else {
      const parts = shape.parts.map((part) =>
        roundedRectangle(def.x + part.x, def.y + part.y, part.w, part.h, part.chamfer ?? 0, { density: part.density ?? def.density, isStatic: Boolean(def.fixed) }),
      );
      body = Matter.Body.create({ ...options, parts });
      this.radius.set(body.id, Math.min(...shape.parts.map((part) => Math.min(part.w, part.h) / 2)));
    }
    const offset = { x: body.position.x - def.x, y: body.position.y - def.y };
    if (def.angle) Matter.Body.setAngle(body, def.angle * DEG_TO_RAD);
    this.bodyById.set(def.id, body);
    this.add(body);
    return { body, offset };
  }

  private addGadget(g: GadgetDef) {
    const body = this.bodyById.get(g.piece);
    if (!body) throw new Error(`gadget without piece ${g.piece}`);
    switch (g.type) {
      case "pivot": {
        const constraint = Matter.Constraint.create({
          pointA: { x: g.at.x, y: g.at.y },
          bodyB: body,
          pointB: { x: g.at.x - body.position.x, y: g.at.y - body.position.y },
          length: 0,
          stiffness: 1,
        });
        Matter.Composite.add(this.engine.world, constraint);
        this.pivots.push({ def: g, body });
        break;
      }
      case "rope": {
        const constraint = Matter.Constraint.create({
          pointA: { x: g.anchor.x, y: g.anchor.y },
          bodyB: body,
          pointB: { x: g.attach.x, y: g.attach.y },
          stiffness: 1,
        });
        Matter.Composite.add(this.engine.world, constraint);
        this.ropes.push({ def: g, body, constraint, cut: false });
        break;
      }
      case "bucket":
        this.buckets.push({ def: g, body, rest: this.poseOf(body), dropped: -1, landed: false, spilled: false });
        break;
      case "faucet":
        this.faucets.push({ def: g, body, on: false });
        break;
      case "blower": {
        const cx = g.zone.x + g.zone.w / 2;
        this.blowers.push({ def: g, body, rest: this.poseOf(body), on: true, dir: cx < body.position.x ? -1 : 1 });
        break;
      }
      case "turnstile": {
        const arm = g.hinge ? rotatePoint({ x: body.position.x - g.hinge.x, y: body.position.y - g.hinge.y }, -body.angle) : { x: 0, y: 0 };
        this.turnstiles.push({ def: g, body, angle: body.angle, from: body.angle, to: body.angle, turnAt: -1, rest: body.angle, arm, turns: 0 });
        break;
      }
    }
  }

  private poseOf(body: Matter.Body): Pose {
    return { x: body.position.x, y: body.position.y, angle: body.angle };
  }

  private after(steps: number, run: () => void) {
    this.timers.push({ at: this.steps + steps, seq: this.seq, run });
    this.seq += 1;
  }

  private runTimers() {
    for (;;) {
      let next = -1;
      for (let i = 0; i < this.timers.length; i += 1) {
        const t = this.timers[i];
        if (t.at > this.steps) continue;
        if (next < 0 || t.at < this.timers[next].at || (t.at === this.timers[next].at && t.seq < this.timers[next].seq)) next = i;
      }
      if (next < 0) return;
      const [timer] = this.timers.splice(next, 1);
      timer.run();
    }
  }

  private calmWorld() {
    return Matter.Composite.allBodies(this.engine.world).every((b) => b.isStatic || (b.speed < CALM_SPEED && Math.abs(b.angularVelocity) < CALM_SPIN));
  }

  private trackCalm() {
    if (this.phase !== "ready") {
      this.calmSteps = 0;
      this.aimSteps = 0;
      return;
    }
    this.aimSteps += 1;
    this.calmSteps = this.calmWorld() ? this.calmSteps + 1 : 0;
  }

  private applyDevices() {
    for (const t of this.turnstiles) {
      if (t.turnAt < 0) continue;
      const k = Math.min(1, (this.steps - t.turnAt + 1) / t.def.turnSteps);
      t.angle = t.from + (t.to - t.from) * k;
      Matter.Body.setAngle(t.body, t.angle);
      if (t.def.hinge) {
        const offset = rotatePoint(t.arm, t.angle);
        Matter.Body.setPosition(t.body, { x: t.def.hinge.x + offset.x, y: t.def.hinge.y + offset.y });
      }
      if (k >= 1) t.turnAt = -1;
    }
    const bodies = this.blowers.some((b) => b.on) || this.faucets.some((f) => f.on) ? Matter.Composite.allBodies(this.engine.world) : null;
    if (!bodies) return;
    const scale = 1 / (STEP_MS * STEP_MS);
    for (const blower of this.blowers) {
      if (!blower.on) continue;
      for (const b of bodies) {
        if (b.isStatic || !this.projectileIds.has(b.id) || !inZone(blower.def.zone, b.position.x, b.position.y)) continue;
        const ratio = LIGHT_DENSITY / b.density;
        const acc = blower.def.strength * ratio * ratio;
        Matter.Body.applyForce(b, b.position, { x: blower.dir * acc * b.mass * scale, y: -acc * 0.25 * b.mass * scale });
      }
    }
    for (const faucet of this.faucets) {
      if (!faucet.on) continue;
      for (const b of bodies) {
        if (b.isStatic || !inZone(faucet.def.stream, b.position.x, b.position.y)) continue;
        const ratio = LIGHT_DENSITY / b.density;
        Matter.Body.applyForce(b, b.position, { x: faucet.def.push.x * ratio * b.mass * scale, y: faucet.def.push.y * ratio * b.mass * scale });
      }
    }
  }

  private onCollision(event: Matter.IEventCollision<Matter.Engine>) {
    const flying = this.flying;
    for (const pair of event.pairs) {
      const a = pair.bodyA.parent ?? pair.bodyA;
      const b = pair.bodyB.parent ?? pair.bodyB;
      const rel = distance(a.velocity.x, a.velocity.y, b.velocity.x, b.velocity.y);
      const involvesFlying = Boolean(flying && (a.id === flying.id || b.id === flying.id));
      const other = involvesFlying ? (a.id === flying!.id ? b : a) : null;
      if (involvesFlying && this.flyingDef?.id === "balloon" && this.steps - this.launchedAt + 1 >= BALLOON_ARM) this.pendingBurst = true;
      if (other && rel > DIRECT_HIT && this.phase === "flying") {
        const target = this.targetByBody.get(other.id);
        if (target && !target.hit && target.def.kind === "knock" && target.def.direct !== false) this.pendingHits.add(target);
      }
      if (rel > STRUCK_HIT) {
        const ta = this.targetByBody.get(a.id);
        const tb = this.targetByBody.get(b.id);
        if (ta && !ta.hit && ta.def.kind === "knock" && !b.isStatic && !this.projectileIds.has(b.id)) this.pendingHits.add(ta);
        if (tb && !tb.hit && tb.def.kind === "knock" && !a.isStatic && !this.projectileIds.has(a.id)) this.pendingHits.add(tb);
      }
      if (rel > FAUCET_TOUCH) {
        for (const f of this.faucets) {
          if (f.on) continue;
          if ((a.id === f.body.id && !b.isStatic) || (b.id === f.body.id && !a.isStatic)) this.pendingFaucets.add(f);
        }
      }
      if (rel > 2) {
        for (const bucket of this.buckets) {
          if (bucket.dropped < 0 || bucket.landed || bucket.spilled) continue;
          if (a.id === bucket.body.id || b.id === bucket.body.id) this.pendingLandings.add(bucket);
        }
      }
      if (rel < 2.2) continue;
      const support = pair.collision.supports?.[0];
      this.impacts.push({
        a,
        b,
        rel,
        x: support?.x ?? (a.position.x + b.position.x) / 2,
        y: support?.y ?? (a.position.y + b.position.y) / 2,
        flying: involvesFlying,
        other,
      });
    }
  }

  private processImpacts() {
    if (!this.impacts.length) return;
    const list = this.impacts;
    this.impacts = [];
    for (const imp of list) {
      let firstOfShot = false;
      if (imp.flying) {
        this.shotImpacts += 1;
        firstOfShot = this.shotImpacts === 1;
        if (this.firstImpactAt < 0) this.firstImpactAt = this.steps;
      }
      this.handlers.impact?.({ ...imp, firstOfShot });
    }
  }

  private addScore(points: number) {
    this.score += points;
    this.handlers.score?.(this.score);
  }

  private pickAmmo() {
    if (this.current && this.stock[this.current.id] > 0) return this.current;
    const id = PROJECTILE_ORDER.find((p) => this.stock[p] > 0);
    return id ? PROJECTILES[id] : null;
  }

  private loadNext() {
    const def = this.pickAmmo();
    if (!def) return;
    this.current = def;
    this.loaded = true;
    this.phase = "ready";
    this.calmSteps = 0;
    this.aimSteps = 0;
    this.handlers.load?.(def);
  }

  private gadget(event: GadgetEvent, scored = true) {
    if (scored) {
      this.gadgetScore += SCORE.gadgetBonus;
      this.addScore(SCORE.gadgetBonus);
    }
    this.handlers.gadget?.(event);
  }

  private soak(t: SimTarget) {
    if (t.hit || t.def.kind !== "soak") return;
    this.hitTarget(t);
  }

  private soakZone(zone: Zone) {
    for (const t of this.targets) if (!t.hit && t.def.kind === "soak" && inZone(zone, t.body.position.x, t.body.position.y)) this.soak(t);
  }

  private walled(ax: number, ay: number, bx: number, by: number, skip: number) {
    for (const body of Matter.Composite.allBodies(this.engine.world)) {
      if (!body.isStatic || body.id === skip) continue;
      for (const part of body.parts.length > 1 ? body.parts.slice(1) : [body]) {
        const v = part.vertices;
        for (let i = 0; i < v.length; i += 1) {
          const w = v[(i + 1) % v.length];
          if (crosses(ax, ay, bx, by, v[i].x, v[i].y, w.x, w.y)) return true;
        }
      }
    }
    return false;
  }

  private burstBalloon() {
    this.pendingBurst = false;
    const balloon = this.flying;
    if (!balloon) return;
    const { x, y } = balloon.position;
    const bodies = [...this.targets.filter((t) => !t.def.sturdy).map((t) => t.body), ...this.pieces.filter((p) => !p.def.sturdy).map((p) => p.body), ...this.spent];
    for (const b of bodies) {
      if (b.isStatic) continue;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > BURST_RADIUS || d < 1 || this.walled(x, y, b.position.x, b.position.y, b.id)) continue;
      const strength = 0.032 * (1 - d / BURST_RADIUS) * b.mass;
      Matter.Body.applyForce(b, b.position, { x: (dx / d) * strength, y: (dy / d - 0.45) * strength });
    }
    Matter.Composite.remove(this.engine.world, balloon);
    this.flying = null;
    this.handlers.burst?.(x, y, balloon);
    for (const t of this.targets) {
      if (t.hit || t.def.kind !== "soak") continue;
      if (distance(t.body.position.x, t.body.position.y, x, y) <= SOAK_RADIUS && !this.walled(x, y, t.body.position.x, t.body.position.y, t.body.id)) this.soak(t);
    }
    this.after(BURST_END, () => this.endShot());
  }

  private endShot() {
    if (this.phase !== "flying") return;
    const body = this.flying;
    if (body) {
      this.spent.push(body);
      this.after(SPENT_FADE, () => this.removeSpent(body));
    }
    this.flying = null;
    this.flyingDef = null;
    this.phase = "settling";
    for (const t of this.turnstiles) {
      t.turns += 1;
      t.from = t.angle;
      t.to = t.def.toggle ? t.rest + (t.turns % 2 === 1 ? t.def.step * DEG_TO_RAD : 0) : t.angle + t.def.step * DEG_TO_RAD;
      t.turnAt = this.steps;
      this.gadget({ type: "turnstile-turn", turnstile: t, x: t.body.position.x, y: t.body.position.y }, false);
    }
    this.handlers.shotEnd?.({ hits: this.shotHits, mess: this.shotMess, nearest: this.shotNearest, body });
    if (this.finishing) return;
    this.queueNextOrEnd(this.shotHits === 0 ? RELOAD_MISS : RELOAD_HIT);
  }

  private removeSpent(body: Matter.Body) {
    const i = this.spent.indexOf(body);
    if (i < 0) return;
    this.spent.splice(i, 1);
    Matter.Composite.remove(this.engine.world, body);
    this.handlers.vanish?.(body);
  }

  private queueNextOrEnd(delay: number) {
    if (this.ammoLeft > 0) {
      this.after(delay, () => {
        if (this.phase === "settling" && !this.finishing) this.loadNext();
      });
      return;
    }
    this.handlers.outOfAmmo?.();
    this.waitingSince = this.steps;
    this.after(LAST_SHOT_WAIT, () => this.waitForCalm());
  }

  private waitForCalm() {
    if (this.finishing || this.phase === "over") return;
    if (this.calmWorld() || this.steps - this.waitingSince >= LAST_SHOT_MAX) {
      this.finish(false);
      return;
    }
    this.after(15, () => this.waitForCalm());
  }

  private hitTarget(t: SimTarget) {
    if (t.hit) return;
    t.hit = true;
    if (t.def.wobble && !t.body.isStatic) Matter.Body.setAngularVelocity(t.body, t.body.angularVelocity + t.def.wobble);
    this.shotHits += 1;
    this.targetScore += t.def.points;
    this.addScore(t.def.points);
    const combo = this.shotHits >= 2 && this.launches.length > 0;
    if (combo) {
      this.comboScore += SCORE.comboBonus;
      this.addScore(SCORE.comboBonus);
    }
    this.handlers.hit?.(t, this.shotHits, combo);
    if (this.targets.every((tt) => tt.hit) && !this.finishing) {
      this.finishing = true;
      this.after(FINALE, () => this.finish(true));
    }
  }

  private checkGadgets() {
    for (const f of this.pendingFaucets) {
      if (f.on) continue;
      f.on = true;
      this.gadget({ type: "faucet-on", faucet: f, x: f.body.position.x, y: f.body.position.y });
    }
    this.pendingFaucets.clear();
    for (const f of this.faucets) if (f.on) this.soakZone(f.def.stream);
    for (const rope of this.ropes) {
      if (rope.cut) continue;
      const { ax, ay, bx, by } = this.ropeEnds(rope);
      const [from, to] = rope.def.cut ?? [0, 1];
      for (const b of Matter.Composite.allBodies(this.engine.world)) {
        if (b.isStatic || b.id === rope.body.id || b.speed < ROPE_CUT_SPEED) continue;
        const r = this.radius.get(b.id) ?? 20;
        if (segmentDistance(b.position.x, b.position.y, ax, ay, bx, by, from, to) > r + 4) continue;
        rope.cut = true;
        if (rope.constraint) Matter.Composite.remove(this.engine.world, rope.constraint);
        rope.constraint = null;
        for (const bucket of this.buckets) if (bucket.body.id === rope.body.id) bucket.dropped = this.steps;
        this.gadget({ type: "rope-cut", rope, x: b.position.x, y: b.position.y });
        break;
      }
    }
    for (const bucket of this.pendingLandings) if (this.steps - bucket.dropped > 4) bucket.landed = true;
    this.pendingLandings.clear();
    for (const bucket of this.buckets) {
      if (bucket.spilled) continue;
      const b = bucket.body;
      const tipped = Math.abs(wrapAngle(b.angle - bucket.rest.angle)) > BUCKET_TIP;
      if (!tipped && !bucket.landed) continue;
      bucket.spilled = true;
      const zone = { x: b.position.x + BUCKET_SPILL.x, y: b.position.y + BUCKET_SPILL.y, w: BUCKET_SPILL.w, h: BUCKET_SPILL.h };
      this.gadget({ type: "bucket-spill", bucket, x: b.position.x, y: b.position.y });
      this.soakZone(zone);
    }
    for (const blower of this.blowers) {
      if (!blower.on) continue;
      const b = blower.body;
      const turn = Math.abs(wrapAngle(b.angle - blower.rest.angle));
      if (turn > BLOWER_OFF_TURN || distance(b.position.x, b.position.y, blower.rest.x, blower.rest.y) > BLOWER_OFF_SHIFT) {
        blower.on = false;
        this.gadget({ type: "blower-off", blower, x: b.position.x, y: b.position.y });
      }
    }
  }

  private checkWorld() {
    if (this.pendingHits.size) {
      for (const t of this.pendingHits) if (!t.hit) this.hitTarget(t);
      this.pendingHits.clear();
    }
    this.checkGadgets();
    for (const t of this.targets) {
      if (t.hit || t.def.kind !== "knock") continue;
      const b = t.body;
      const dist = distance(b.position.x, b.position.y, t.rest.x, t.rest.y);
      const turn = Math.abs(wrapAngle(b.angle - t.rest.angle));
      if (turn > 0.7 || dist > 44 || b.position.y > H + 80) this.hitTarget(t);
    }
    let messPoints = 0;
    let mx = 0;
    let my = 0;
    for (const p of this.pieces) {
      if (p.messy || p.def.mess === false || p.def.fixed) continue;
      const b = p.body;
      const dist = distance(b.position.x, b.position.y, p.rest.x, p.rest.y);
      const turn = Math.abs(wrapAngle(b.angle - p.rest.angle));
      if (turn > 0.35 || dist > 26) {
        p.messy = true;
        messPoints += SCORE.messBonus;
        mx += b.position.x;
        my += b.position.y;
      }
    }
    if (messPoints > 0) {
      const n = messPoints / SCORE.messBonus;
      this.messScore += messPoints;
      this.shotMess += messPoints;
      this.addScore(messPoints);
      this.handlers.mess?.(messPoints, mx / n, my / n);
    }
    if (this.phase === "flying" && this.flying) {
      const b = this.flying;
      for (const t of this.targets) {
        if (t.hit) continue;
        const d = distance(t.body.position.x, t.body.position.y, b.position.x, b.position.y);
        if (d < this.shotNearest) this.shotNearest = d;
      }
      const out = b.position.x < -160 || b.position.x > W + 160 || b.position.y > H + 160;
      this.slowSteps = b.speed < 0.6 ? this.slowSteps + 1 : 0;
      const settled = this.firstImpactAt >= 0 && this.steps - this.firstImpactAt > SETTLED_AFTER_IMPACT;
      if (out || this.slowSteps > SLOW_STEPS || settled || this.steps - this.launchedAt > MAX_FLIGHT) this.endShot();
    }
  }

  private finish(won: boolean) {
    if (this.phase === "over") return;
    this.finishing = true;
    this.phase = "over";
    this.loaded = false;
    const unused = won ? this.ammoLeft : 0;
    const ammoBonus = unused * SCORE.ammoBonus;
    const clearBonus = won ? SCORE.clearBonus : 0;
    if (ammoBonus + clearBonus > 0) this.addScore(ammoBonus + clearBonus);
    const launches = this.launches.length;
    this.tally = {
      won,
      score: this.score,
      stars: phaseStars(this.phaseDef, won, launches),
      targetScore: this.targetScore,
      messScore: this.messScore,
      comboScore: this.comboScore,
      gadgetScore: this.gadgetScore,
      clearBonus,
      ammoBonus,
      stats: {
        targets: this.targets.filter((t) => t.hit).length,
        targetPoints: this.targetScore,
        mess: this.pieces.filter((p) => p.messy).length,
        combos: Math.round(this.comboScore / SCORE.comboBonus),
        gadgets: Math.round(this.gadgetScore / SCORE.gadgetBonus),
        launches,
        ammoLeft: unused,
      },
    };
    this.handlers.finish?.(this.tally);
  }
}

export type StreetReplay = { ok: true; tally: StreetTally; steps: number } | { ok: false; problem: "bad_log" | "illegal_launch" | "unfinished" };

export function validLaunchLog(phase: PhaseDef, launches: readonly Launch[]) {
  if (launches.length > ammoTotal(phase)) return false;
  const used: Record<ProjectileId, number> = { shoe: 0, balloon: 0, tire: 0, duck: 0 };
  let previous = -1;
  for (const l of launches) {
    if (!Number.isInteger(l.at) || l.at <= previous || l.at > MAX_STEPS || !validLaunchValues(l.angle, l.power) || !isProjectileId(l.ammo)) return false;
    used[l.ammo] += 1;
    if (used[l.ammo] > (phase.ammo[l.ammo] ?? 0)) return false;
    previous = l.at;
  }
  return true;
}

export function replayStreet(phaseId: string, launches: readonly Launch[]): StreetReplay {
  const phase = phaseById(phaseId);
  if (!phase || !validLaunchLog(phase, launches)) return { ok: false, problem: "bad_log" };
  const sim = new StreetSim(phase);
  try {
    sim.start();
    for (const l of launches) {
      while (sim.steps < l.at) if (!sim.step()) return { ok: false, problem: "illegal_launch" };
      if (!sim.launch(l.angle, l.power, l.ammo)) return { ok: false, problem: "illegal_launch" };
    }
    while (sim.phase !== "over" && sim.steps < MAX_STEPS) if (!sim.step()) break;
    if (!sim.tally) return { ok: false, problem: "unfinished" };
    return { ok: true, tally: sim.tally, steps: sim.steps };
  } finally {
    sim.destroy();
  }
}
