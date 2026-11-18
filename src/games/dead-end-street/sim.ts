import { circle, DEG_TO_RAD, Matter, roundedRectangle } from "@/lib/physics/matter";
import { cos, sin } from "@/lib/physics/trig";
import {
  AMMO,
  ANCHOR,
  ANGLE_MAX,
  ANGLE_MIN,
  GRAVITY_Y,
  H,
  MAX_PULL,
  MAX_SPEED,
  MIN_POWER,
  MIN_SPEED,
  PROJECTILES,
  PROPS,
  SCORE,
  STATICS,
  STEP_MS,
  TARGETS,
  W,
  WAVES,
  type BodyDef,
  type ProjectileDef,
  type TargetDef,
} from "./config";

export type StreetPhase = "attract" | "ready" | "flying" | "settling" | "interlude" | "over";

export type Launch = { at: number; angle: number; power: number };

export type Pose = { x: number; y: number; angle: number };

export type SimTargetState = { def: TargetDef; index: number; body: Matter.Body | null; rest: Pose | null; hit: boolean; armAt: number };

export type SimPropState = { def: BodyDef; index: number; body: Matter.Body; rest: Pose; messy: boolean };

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

export type StreetTally = {
  won: boolean;
  score: number;
  stars: number;
  targetScore: number;
  waveScore: number;
  messScore: number;
  comboScore: number;
  ammoBonus: number;
  shots: number;
  stats: { targets: number; targetPoints: number; waves: number; mess: number; combos: number; launches: number; ammoLeft: number };
};

export type StreetHandlers = {
  load?: (def: ProjectileDef, shot: number) => void;
  impact?: (impact: SimImpact) => void;
  hit?: (target: SimTargetState, shotHits: number, combo: boolean) => void;
  mess?: (points: number, x: number, y: number) => void;
  score?: (score: number) => void;
  burst?: (x: number, y: number, balloon: Matter.Body) => void;
  waveCleared?: (wave: number, last: boolean) => void;
  interlude?: (wave: number, spent: Matter.Body[]) => void;
  spawn?: (target: SimTargetState) => void;
  shotEnd?: (shot: { hits: number; mess: number; nearest: number; body: Matter.Body | null }) => void;
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
const WAVE_BREAK = ms(450);
const RELOAD_HIT = ms(380);
const RELOAD_MISS = ms(650);
const LAST_SHOT_WAIT = ms(2400);
const CLEAR_TO_INTERLUDE = ms(700);
const FINALE = ms(1300);
const SPAWN_ARM = ms(900);
const INTERLUDE = ms(1450);
const CALM_SPEED = 0.3;
const CALM_SPIN = 0.005;
const CALM_STEPS = 30;
const AIM_PHYSICS = ms(10_000);

const spawnAt = (i: number) => ms(420 + i * 260);

function wrapAngle(value: number) {
  const range = Math.PI * 2;
  return -Math.PI + ((((value + Math.PI) % range) + range) % range);
}

function distance(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
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

type Timer = { at: number; seq: number; run: () => void };

export class StreetSim {
  readonly engine: Matter.Engine;
  readonly targets: SimTargetState[] = [];
  readonly props: SimPropState[] = [];
  readonly launches: Launch[] = [];
  phase: StreetPhase = "attract";
  steps = 0;
  wave = 0;
  shot = 0;
  score = 0;
  current: ProjectileDef | null = null;
  loaded = false;
  flying: Matter.Body | null = null;
  flyingDef: ProjectileDef | null = null;
  pendingWave: number | null = null;
  finishing = false;
  tally: StreetTally | null = null;
  private readonly handlers: StreetHandlers;
  private readonly targetByBody = new Map<number, SimTargetState>();
  private spent: Matter.Body[] = [];
  private timers: Timer[] = [];
  private seq = 0;
  private launchedAt = 0;
  private slowSteps = 0;
  private pendingBurst = false;
  private pendingHits = new Set<SimTargetState>();
  private impacts: Omit<SimImpact, "firstOfShot">[] = [];
  private shotHits = 0;
  private shotMess = 0;
  private shotNearest = Infinity;
  private shotImpacts = 0;
  private firstImpactAt = -1;
  private targetScore = 0;
  private messScore = 0;
  private comboScore = 0;
  private waveScore = 0;
  private calmSteps = 0;
  private aimSteps = 0;

  constructor(handlers: StreetHandlers = {}) {
    this.handlers = handlers;
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY_Y, scale: 0.001 },
      enableSleeping: false,
      positionIterations: 10,
      velocityIterations: 8,
    });
    for (const s of STATICS) {
      this.add(roundedRectangle(s.x, s.y, s.w, s.h, 0, { isStatic: true, label: s.label, friction: 0.9, restitution: 0.1 }));
    }
    PROPS.forEach((def, index) => {
      const body = this.addBody(def, `prop:${def.id}`);
      this.props.push({ def, index, body, rest: { x: 0, y: 0, angle: 0 }, messy: false });
    });
    TARGETS.forEach((def, index) => {
      const state: SimTargetState = { def, index, body: null, rest: null, hit: false, armAt: 0 };
      this.targets.push(state);
      if (def.wave === 1) this.placeTarget(state, false);
    });
    Matter.Events.on(this.engine, "collisionStart", (event) => this.onCollision(event));
    for (let i = 0; i < SETTLE_STEPS; i += 1) Matter.Engine.update(this.engine, STEP_MS);
    for (const t of this.targets) if (t.body) t.rest = this.poseOf(t.body);
    for (const p of this.props) p.rest = this.poseOf(p.body);
  }

  get idle() {
    return this.phase === "ready" && this.timers.length === 0 && (this.calmSteps >= CALM_STEPS || this.aimSteps >= AIM_PHYSICS);
  }

  get canLaunch() {
    return this.phase === "ready" && this.loaded && this.current !== null && this.pendingWave === null && !this.finishing;
  }

  get ammoLeft() {
    return AMMO.slice(this.shot);
  }

  start() {
    if (this.phase !== "attract") return;
    this.loadNext();
  }

  launch(angle: number, power: number): Matter.Body | null {
    if (!this.canLaunch || !validLaunchValues(angle, power)) return null;
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
    Matter.Body.setVelocity(body, { x: pose.vx, y: pose.vy });
    Matter.Body.setAngularVelocity(body, def.id === "shoe" ? 0.12 : def.id === "duck" ? -0.06 : 0.03);
    this.launches.push({ at: this.steps, angle, power });
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
    Matter.Engine.update(this.engine, STEP_MS);
    this.steps += 1;
    if (this.pendingBurst) this.burstBalloon();
    if (this.phase !== "over") this.checkWorld();
    this.processImpacts();
    this.runTimers();
    this.trackCalm();
    return true;
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

  private addBody(def: BodyDef, label: string, yOffset = 0) {
    return this.add(
      roundedRectangle(def.x, def.y + yOffset, def.w, def.h, def.chamfer ?? 0, {
        density: def.density,
        friction: def.friction ?? 0.7,
        frictionStatic: 1,
        restitution: def.restitution ?? 0.08,
        frictionAir: 0.008,
        label,
      }),
    );
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

  private trackCalm() {
    if (this.phase !== "ready") {
      this.calmSteps = 0;
      this.aimSteps = 0;
      return;
    }
    this.aimSteps += 1;
    const calm = Matter.Composite.allBodies(this.engine.world).every((b) => b.isStatic || (b.speed < CALM_SPEED && Math.abs(b.angularVelocity) < CALM_SPIN));
    this.calmSteps = calm ? this.calmSteps + 1 : 0;
  }

  private placeTarget(t: SimTargetState, animate: boolean) {
    const body = this.addBody(t.def, `target:${t.def.id}`, animate ? -36 : 0);
    t.body = body;
    t.rest = null;
    t.armAt = animate ? this.steps + SPAWN_ARM : 0;
    this.targetByBody.set(body.id, t);
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
      if (other && rel > 8 && this.phase === "flying") {
        const target = this.targetByBody.get(other.id);
        if (target && !target.hit && target.rest) this.pendingHits.add(target);
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

  private loadNext() {
    if (this.shot >= AMMO.length) return;
    const def = PROJECTILES[AMMO[this.shot]];
    this.shot += 1;
    this.current = def;
    this.loaded = true;
    this.phase = "ready";
    this.calmSteps = 0;
    this.aimSteps = 0;
    this.handlers.load?.(def, this.shot);
  }

  private burstBalloon() {
    this.pendingBurst = false;
    const balloon = this.flying;
    if (!balloon) return;
    const { x, y } = balloon.position;
    const radius = 250;
    const bodies = [...this.targets.filter((t) => t.body).map((t) => t.body!), ...this.props.map((p) => p.body), ...this.spent];
    for (const b of bodies) {
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > radius || d < 1) continue;
      const strength = 0.032 * (1 - d / radius) * b.mass;
      Matter.Body.applyForce(b, b.position, { x: (dx / d) * strength, y: (dy / d - 0.45) * strength });
    }
    Matter.Composite.remove(this.engine.world, balloon);
    this.flying = null;
    this.handlers.burst?.(x, y, balloon);
    this.after(BURST_END, () => this.endShot());
  }

  private endShot() {
    if (this.phase !== "flying") return;
    const body = this.flying;
    if (body) this.spent.push(body);
    this.flying = null;
    this.flyingDef = null;
    this.phase = "settling";
    this.handlers.shotEnd?.({ hits: this.shotHits, mess: this.shotMess, nearest: this.shotNearest, body });
    if (this.finishing) return;
    if (this.pendingWave !== null) {
      this.after(WAVE_BREAK, () => this.startInterlude());
      return;
    }
    this.queueNextOrEnd(this.shotHits === 0 ? RELOAD_MISS : RELOAD_HIT);
  }

  private queueNextOrEnd(delay: number) {
    if (this.shot < AMMO.length) {
      this.after(delay, () => {
        if (this.phase === "settling" && !this.finishing) this.loadNext();
      });
      return;
    }
    this.handlers.outOfAmmo?.();
    this.after(LAST_SHOT_WAIT, () => {
      if (!this.finishing) this.finish(false);
    });
  }

  private hitTarget(t: SimTargetState) {
    if (!t.body) return;
    t.hit = true;
    this.shotHits += 1;
    this.targetScore += t.def.points;
    this.addScore(t.def.points);
    const combo = this.shotHits >= 2 && this.phase === "flying";
    if (combo) {
      this.comboScore += SCORE.comboBonus;
      this.addScore(SCORE.comboBonus);
    }
    this.handlers.hit?.(t, this.shotHits, combo);
    if (this.targets.filter((tt) => tt.def.wave === this.wave + 1).every((tt) => tt.hit)) this.onWaveCleared();
  }

  private onWaveCleared() {
    const next = this.wave + 1;
    this.waveScore += SCORE.waveBonus;
    this.addScore(SCORE.waveBonus);
    const last = next >= WAVES.length;
    this.handlers.waveCleared?.(this.wave, last);
    if (last) {
      if (!this.finishing) {
        this.finishing = true;
        this.after(FINALE, () => this.finish(true));
      }
      return;
    }
    this.pendingWave = next;
    if (this.phase !== "flying") this.after(CLEAR_TO_INTERLUDE, () => this.startInterlude());
  }

  private startInterlude() {
    if (this.pendingWave === null || this.finishing || this.phase === "over") return;
    const w = this.pendingWave;
    this.pendingWave = null;
    this.wave = w;
    this.phase = "interlude";
    const spent = this.spent;
    this.spent = [];
    for (const body of spent) Matter.Composite.remove(this.engine.world, body);
    this.handlers.interlude?.(w, spent);
    this.targets
      .filter((t) => t.def.wave === w + 1)
      .forEach((t, i) =>
        this.after(spawnAt(i), () => {
          this.placeTarget(t, true);
          this.handlers.spawn?.(t);
        }),
      );
    this.after(INTERLUDE, () => {
      if (this.phase !== "interlude") return;
      if (this.loaded) {
        this.phase = "ready";
        this.calmSteps = 0;
        this.aimSteps = 0;
      } else {
        this.phase = "settling";
        this.queueNextOrEnd(0);
      }
    });
  }

  private checkWorld() {
    if (this.pendingHits.size) {
      for (const t of this.pendingHits) if (!t.hit) this.hitTarget(t);
      this.pendingHits.clear();
    }
    for (const t of this.targets) {
      if (t.hit || !t.body) continue;
      const b = t.body;
      if (!t.rest) {
        if (this.steps >= t.armAt) t.rest = this.poseOf(b);
        continue;
      }
      const dist = distance(b.position.x, b.position.y, t.rest.x, t.rest.y);
      const turn = Math.abs(wrapAngle(b.angle - t.rest.angle));
      if (turn > 0.7 || dist > 44 || b.position.y > H + 80) this.hitTarget(t);
    }
    let messPoints = 0;
    let mx = 0;
    let my = 0;
    for (const p of this.props) {
      if (p.messy) continue;
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
        if (t.hit || !t.body) continue;
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
    const unused = won ? AMMO.length - this.shot + (this.loaded ? 1 : 0) : 0;
    const ammoBonus = unused * SCORE.ammoBonus;
    if (ammoBonus > 0) this.addScore(ammoBonus);
    const stars = won ? (this.score >= SCORE.threeStars ? 3 : this.score >= SCORE.twoStars ? 2 : 1) : 0;
    this.tally = {
      won,
      score: this.score,
      stars,
      targetScore: this.targetScore,
      waveScore: this.waveScore,
      messScore: this.messScore,
      comboScore: this.comboScore,
      ammoBonus,
      shots: this.shot,
      stats: {
        targets: this.targets.filter((t) => t.hit).length,
        targetPoints: this.targetScore,
        waves: Math.round(this.waveScore / SCORE.waveBonus),
        mess: this.props.filter((p) => p.messy).length,
        combos: Math.round(this.comboScore / SCORE.comboBonus),
        launches: this.launches.length,
        ammoLeft: unused,
      },
    };
    this.handlers.finish?.(this.tally);
  }
}

export type StreetReplay = { ok: true; tally: StreetTally; steps: number } | { ok: false; problem: "bad_log" | "illegal_launch" | "unfinished" };

export function replayStreet(launches: readonly Launch[]): StreetReplay {
  if (launches.length > AMMO.length) return { ok: false, problem: "bad_log" };
  let previous = -1;
  for (const l of launches) {
    if (!Number.isInteger(l.at) || l.at <= previous || l.at > MAX_STEPS || !validLaunchValues(l.angle, l.power)) return { ok: false, problem: "bad_log" };
    previous = l.at;
  }
  const sim = new StreetSim();
  try {
    sim.start();
    for (const l of launches) {
      while (sim.steps < l.at) if (!sim.step()) return { ok: false, problem: "illegal_launch" };
      if (!sim.launch(l.angle, l.power)) return { ok: false, problem: "illegal_launch" };
    }
    while (sim.phase !== "over" && sim.steps < MAX_STEPS) if (!sim.step()) break;
    if (!sim.tally) return { ok: false, problem: "unfinished" };
    return { ok: true, tally: sim.tally, steps: sim.steps };
  } finally {
    sim.destroy();
  }
}
