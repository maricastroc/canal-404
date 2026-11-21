import { CART_RULES, type CartId, type CartRules } from "./carts";
import { atan2, clamp, DEG, TAU, wrapAngle } from "./math";
import type { Params } from "./params";
import { covers, heightAt, obstacleActive, obstacleX, segmentAt, type Obstacle, type ObstacleKind, type Surface, type Track } from "./track";

export const STEP_HZ = 120;
export const DT = 1 / STEP_HZ;
export const BODY_STAND = 125;
export const BODY_CROUCH = 80;

const LIP_WINDOW = 80;
const LIP_TAKEOFF = 30;
const CLEAR_MARGIN = 200;
const COYOTE_STEPS = 14;
const PADDLE_ACCEL = 900;
const START_PUSH = 320;
const LAND_EPS = 3;
const FINISH_BRAKE = 900;
const JUMP_RISE = 40;
const FULL_BONUS_AIR = 0.8;
const AIR_DRAG = 0.5;
const RHYTHM_PRE = 14;
const RHYTHM_GRACE = 9;
const BOUNCE_KEEP = 0.5;
const BOUNCE_MIN = 260;
const RHYTHM_BOOST = 45;
const ASSIST_MIN = 420;
const ASSIST_MAX = 1500;
const FLOCK_BONUS = 120;
const STAIR_RATTLE = 1.6;
const LOOP_BONUS = 160;
const MANHOLE_DROP = 46;
const JET_VX = 1250;
const JET_APEX = 280;
const FAN_ACCEL = 400;
const FAN_SLOPE = 0.035;
const BUMP_EVERY = 230;
const BUMP_MIN_SPEED = 380;
const BUMP_POP = 150;
const POTHOLE_POP = 330;
const POTHOLE_KEEP = 0.3;
const SEQ_WINDOW = 300;
const MULT_MAX = 5;
const POSE_HOLD = 24;
const POSE_LEVEL = 60;
const POSE_RATE = 250 / STEP_HZ;
const NEAR_MISS = 36;
const RAIL_EVERY = 100;
const RAIL_POINTS = 20;
const WHEELIE_EVERY = 60;
const WHEELIE_POINTS = 30;
const WHEELIE_PUSH = 8;
const WHEELIE_FALL = 6;
const WHEELIE_DAMP = 5;
const WHEELIE_BAL = 32 * DEG;
const WHEELIE_MAX = 66 * DEG;
const WHEELIE_LO = 10 * DEG;
const WHEELIE_HI = 44 * DEG;
const POINTS = { lip: 50, perfect: 100, nearMiss: 75, crate: 25 } as const;

export function flipPoints(flips: number) {
  return flips <= 0 ? 0 : flips === 1 ? 300 : flips === 2 ? 800 : 1500 + (flips - 3) * 800;
}

export type SimInput = { crouch: boolean; jump: boolean; spin: -1 | 0 | 1; hold?: boolean };

export const IDLE: SimInput = { crouch: false, jump: false, spin: 0, hold: false };

export type SimMode = "ground" | "air" | "crash";

export type LandQuality = "perfect" | "ok" | "touch";

export type CrashReason = "upside" | "tilted" | "barrier" | "truck" | "fence" | "loop" | "pose" | "wheelie";

export type TrickKind = "lip" | "flip" | "pose" | "perfect" | "rail" | "wheelie" | "nearMiss" | "crate";

export type ShowState = { total: number; seq: number; mult: number; tricks: number; timer: number };

export type SimEvent =
  | { type: "takeoff"; popped: boolean; lip: boolean; power: number }
  | { type: "pop"; lip: boolean; power: number }
  | { type: "land"; quality: LandQuality; delta: number; flips: number; before: number; after: number; air: number; rise: number; surface: number }
  | { type: "crash"; reason: CrashReason; delta: number; speed: number }
  | { type: "recover" }
  | { type: "hit"; index: number; kind: ObstacleKind; penalized: boolean; loss: number; bounced: boolean }
  | { type: "puddle"; on: boolean; boost: boolean }
  | { type: "surface"; cobbles: boolean }
  | { type: "shortcut" }
  | { type: "secret" }
  | { type: "interfered"; kind: "dust" | "kick"; loss: number }
  | { type: "bounce"; rhythm: boolean; combo: number; delta: number; surface: number; late: boolean }
  | { type: "flock"; index: number; clean: boolean }
  | { type: "loop"; index: number; done: boolean }
  | { type: "manhole"; index: number }
  | { type: "jet" }
  | { type: "trick"; kind: TrickKind; points: number; seq: number; mult: number }
  | { type: "bank"; points: number; mult: number; total: number }
  | { type: "drop"; points: number }
  | { type: "pose"; level: number }
  | { type: "wheelie"; on: boolean }
  | { type: "finish"; time: number };

export type SimStats = {
  perfect: number;
  ok: number;
  crashes: number;
  hits: number;
  flips: number;
  pops: number;
  lipPops: number;
  maxSpeed: number;
  airTime: number;
  shortcut: boolean;
  secret: boolean;
  interfered: number;
  bounces: number;
  combo: number;
  flock: boolean;
  loops: number;
  show: number;
  bestSeq: number;
  tricks: number;
};

export type Landing = { surface: number; x: number; y: number; slope: number; steps: number };

function findLanding(surfaces: Surface[], x0: number, y0: number, x1: number, y1: number) {
  let best = -1;
  let bestT = 2;
  let bestX = x1;
  for (let i = 0; i < surfaces.length; i += 1) {
    const s = surfaces[i];
    if (!covers(s, x1)) continue;
    const g0 = heightAt(s, x0 < s.x0 ? s.x0 : x0);
    const g1 = heightAt(s, x1);
    const f0 = y0 - g0;
    const f1 = y1 - g1;
    if (f0 > LAND_EPS || f1 < 0) continue;
    const t = f0 >= 0 ? 0 : f0 / (f0 - f1);
    if (t < bestT) {
      bestT = t;
      best = i;
      bestX = x0 + (x1 - x0) * t;
    }
  }
  return best < 0 ? null : { surface: best, x: bestX };
}

export class DownhillSim {
  readonly track: Track;
  params: Params;
  readonly cart: CartId;
  rules: Readonly<CartRules>;
  fanning = false;
  fanArmed = false;
  inPuddle = false;
  private bumpDist = 0;
  readonly show: ShowState = { total: 0, seq: 0, mult: 1, tricks: 0, timer: 0 };
  posing = false;
  poseLevel = 0;
  poseSteps = 0;
  posePending = 0;
  private holdSteps = 0;
  private holdFresh = false;
  private prevHold = false;
  wheelie = 0;
  wheelieVel = 0;
  private wheelieBand = 0;
  private wheelieScored = false;
  private railDist = 0;
  private railScored = false;
  private readonly nearMissed = new Set<number>();
  private landedAt = -SEQ_WINDOW - 1;
  step = 0;
  mode: SimMode = "ground";
  surface = 0;
  seg = 0;
  segPos = 0;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  v = START_PUSH;
  angle = 0;
  spin = 0;
  spun = 0;
  crouch = false;
  charge = 0;
  airSteps = 0;
  popped = false;
  cleared = false;
  rise = 0;
  takeoffLip = false;
  tumbling = false;
  crashLeft = 0;
  crashTotal = 1;
  crashFrom = 0;
  paddling = false;
  onCobbles = false;
  finished = false;
  finishTime = 0;
  nextObstacle = 0;
  combo = 0;
  bounceBuffer = 0;
  bounceGrace = 0;
  private comboHold = 0;
  private lastAwning = -1;
  private readonly flockState: number[];
  private readonly loopUsed: boolean[];
  private readonly manholeUsed: boolean[];
  loopIndex = -1;
  loopTheta = 0;
  private loopC = 1;
  private loopS = 0;
  readonly stats: SimStats = { perfect: 0, ok: 0, crashes: 0, hits: 0, flips: 0, pops: 0, lipPops: 0, maxSpeed: 0, airTime: 0, shortcut: false, secret: false, interfered: 0, bounces: 0, combo: 0, flock: false, loops: 0, show: 0, bestSeq: 0, tricks: 0 };
  readonly events: SimEvent[] = [];
  readonly removed = new Set<number>();
  private readonly dynamic: number[];

  constructor(track: Track, params: Params, startX = track.start, cart: CartId = "deco", rules: Readonly<CartRules> = CART_RULES[cart]) {
    this.track = track;
    this.params = params;
    this.cart = cart;
    this.rules = rules;
    const road = track.surfaces[0];
    this.seg = segmentAt(road, startX);
    this.segPos = (startX - road.xs[this.seg]) / road.tx[this.seg];
    this.syncGround();
    this.dynamic = track.obstacles.map((o, i) => (o.motion || o.window || o.roll ? i : -1)).filter((i) => i >= 0);
    this.flockState = (track.flocks ?? []).map(() => 0);
    this.loopUsed = (track.loops ?? []).map(() => false);
    this.manholeUsed = (track.manholes ?? []).map(() => false);
    while (this.nextObstacle < track.obstacles.length && track.obstacles[this.nextObstacle].x <= this.x) this.nextObstacle += 1;
  }

  get speed() {
    return this.mode === "air" ? Math.sqrt(this.vx * this.vx + this.vy * this.vy) : this.v;
  }

  get chargeRatio() {
    return this.params.chargeTime > 0 ? clamp(this.charge / this.params.chargeTime, 0, 1) : 1;
  }

  interfere(loss: number, kind: "dust" | "kick") {
    if (this.finished || this.mode === "crash" || this.tumbling) return false;
    if (this.mode === "air") this.vx *= 1 - loss;
    else this.v *= 1 - loss;
    this.stats.interfered += 1;
    this.events.push({ type: "interfered", kind, loss });
    return true;
  }

  drain() {
    return this.events.splice(0, this.events.length);
  }

  advance(input: SimInput) {
    this.step += 1;
    const xPrev = this.x;
    const yPrev = this.y;
    const chargeBefore = this.charge;
    let popped = false;
    if (this.mode === "ground" && input.jump && !this.finished && this.loopIndex < 0) {
      this.pop(chargeBefore, false);
      popped = true;
    } else if (this.mode === "air" && input.jump && !this.popped && !this.tumbling && this.airSteps <= COYOTE_STEPS && !this.finished) {
      this.pop(chargeBefore, true);
      popped = true;
    } else if (this.mode === "air" && input.jump && !this.tumbling && !this.finished) {
      this.rhythmPress();
    }
    if (popped) this.charge = 0;
    else if (input.crouch) this.charge = Math.min(this.charge + DT, this.params.chargeTime);
    else this.charge = 0;
    this.crouch = input.crouch;
    this.holdInput(input.hold === true);
    if (this.mode === "ground" && this.loopIndex >= 0) this.loopStep(input);
    else if (this.mode === "ground") this.groundStep(input);
    else if (this.mode === "air") this.airStep(input);
    else this.crashStep();
    if (this.mode === "ground" && this.loopIndex < 0 && this.surface === 0) {
      this.checkLoops(xPrev);
      this.checkManholes(xPrev);
    }
    this.checkObstacles(xPrev, yPrev);
    this.checkFlocks();
    this.checkFinish(xPrev);
    this.tickShow();
    const sp = this.speed;
    if (sp > this.stats.maxSpeed && !this.finished) this.stats.maxSpeed = sp;
  }

  predictLanding(maxSteps = 480, path?: number[], every = 6): Landing | null {
    if (this.mode !== "air") return null;
    return this.flight(this.x, this.y, this.vx, this.vy, maxSteps, path, every);
  }

  predictPop(maxSteps = 480, path?: number[], every = 6): Landing | null {
    if (this.mode !== "ground" || this.loopIndex >= 0) return null;
    const s = this.track.surfaces[this.surface];
    const power = this.popPower(this.charge, this.nearLip(LIP_WINDOW, true));
    return this.flight(this.x, this.y, this.v * s.tx[this.seg], this.v * s.ty[this.seg] - power, maxSteps, path, every);
  }

  private flight(x0: number, y0: number, vx0: number, vy0: number, maxSteps: number, path: number[] | undefined, every: number): Landing | null {
    const surfaces = this.track.surfaces;
    const k = this.params.drag * this.rules.drag * 1e-5 * AIR_DRAG;
    const g = this.params.gravity;
    let x = x0;
    let y = y0;
    let vx = vx0;
    let vy = vy0;
    for (let i = 1; i <= maxSteps; i += 1) {
      const sp = Math.sqrt(vx * vx + vy * vy);
      vx -= k * sp * vx * DT;
      vy += g * DT - k * sp * vy * DT;
      const x1 = x + vx * DT;
      const y1 = y + vy * DT;
      if (path && i % every === 0) path.push(x1, y1);
      const hit = findLanding(surfaces, x, y, x1, y1);
      if (hit) {
        const s = surfaces[hit.surface];
        const seg = segmentAt(s, hit.x);
        return { surface: hit.surface, x: hit.x, y: heightAt(s, hit.x, seg), slope: s.ang[seg], steps: i };
      }
      x = x1;
      y = y1;
    }
    return null;
  }

  private nearLip(window: number, before: boolean) {
    for (const lip of this.track.lips) {
      if (lip.surface !== this.surface) continue;
      const d = lip.x - this.x;
      if (before ? d >= -6 && d <= window : d >= -window && d <= window) return true;
    }
    return false;
  }

  private popPower(charge: number, lip: boolean) {
    const p = this.params;
    const ratio = p.chargeTime > 0 ? clamp(charge / p.chargeTime, 0, 1) : 1;
    return (p.popBase + p.popCharge * ratio) * this.rules.pop + (lip ? p.lipBonus * this.speed : 0);
  }

  private pop(charge: number, late: boolean) {
    const p = this.params;
    const ratio = p.chargeTime > 0 ? clamp(charge / p.chargeTime, 0, 1) : 1;
    const lip = late ? this.takeoffLip : this.nearLip(LIP_WINDOW, true);
    const power = this.popPower(charge, lip);
    this.stats.pops += 1;
    if (lip) this.stats.lipPops += 1;
    if (lip && !this.finished) this.trick("lip", POINTS.lip);
    if (late) {
      this.vy -= power;
      this.popped = true;
      this.events.push({ type: "pop", lip, power: ratio });
      return;
    }
    const s = this.track.surfaces[this.surface];
    this.vx = this.v * s.tx[this.seg];
    this.vy = this.v * s.ty[this.seg] - power;
    this.enterAir(lip);
    this.popped = true;
    this.events.push({ type: "takeoff", popped: true, lip, power: ratio });
  }

  private enterAir(lip: boolean) {
    if (this.wheelie !== 0) {
      this.angle = wrapAngle(this.angle + this.wheelie);
      this.endWheelie();
    }
    this.railDist = 0;
    this.railScored = false;
    this.tumbling = this.mode === "crash";
    this.mode = "air";
    this.spin = 0;
    this.spun = 0;
    this.airSteps = 0;
    this.popped = false;
    this.takeoffLip = lip;
    this.cleared = false;
    this.rise = 0;
    this.paddling = false;
  }

  private takeoff() {
    const s = this.track.surfaces[this.surface];
    this.vx = this.v * s.tx[this.seg];
    this.vy = this.v * s.ty[this.seg];
    const wasCrash = this.mode === "crash";
    const lip = this.nearLip(LIP_TAKEOFF, false);
    this.enterAir(lip);
    if (!wasCrash) this.events.push({ type: "takeoff", popped: false, lip, power: 0 });
  }

  private syncGround() {
    const s = this.track.surfaces[this.surface];
    this.x = s.xs[this.seg] + s.tx[this.seg] * this.segPos;
    this.y = s.ys[this.seg] + s.ty[this.seg] * this.segPos;
    this.angle = s.ang[this.seg];
  }

  private inCobbles() {
    if (this.surface !== 0) return 0;
    for (const c of this.track.cobbles) if (this.x >= c.x0 && this.x <= c.x1) return c.stairs ? STAIR_RATTLE : 1;
    return 0;
  }

  private groundStep(input: SimInput) {
    const p = this.params;
    const r = this.rules;
    const s = this.track.surfaces[this.surface];
    const ty = s.ty[this.seg];
    const tipped = this.wheelieStep(input);
    if (this.mode !== "ground") return;
    const crouch = input.crouch && !tipped;
    let a = p.gravity * ty * p.slopeGain * (crouch && ty > 0 ? 1 + p.crouchBoost : 1);
    const k = p.drag * r.drag * 1e-5 * (crouch ? 1 - p.crouchDrag : 1);
    a -= k * this.v * this.v + p.rolling * r.rolling;
    const rattle = this.inCobbles();
    const cobbles = rattle > 0;
    if (cobbles !== this.onCobbles) {
      this.onCobbles = cobbles;
      this.bumpDist = 0;
      this.events.push({ type: "surface", cobbles });
    }
    if (cobbles) a -= (crouch ? p.cobbleCrouch : p.cobbleStand) * rattle;
    const puddle = this.inPuddleAt();
    if (puddle !== this.inPuddle) {
      this.inPuddle = puddle;
      this.events.push({ type: "puddle", on: puddle, boost: r.puddle > 0 });
    }
    if (puddle && !this.finished) a += r.puddle;
    this.fanning = false;
    if (r.fanPush > 0 && ty < FAN_SLOPE && !this.finished) {
      a += r.fanPush;
      this.fanning = true;
    }
    if (this.finished) a -= FINISH_BRAKE;
    this.v += a * DT;
    this.paddling = false;
    if (this.finished) {
      if (this.v < 0) this.v = 0;
    } else if (r.floor > 0 && this.fanArmed && this.v < r.floor) {
      this.fanning = true;
      this.v = Math.min(r.floor, this.v + FAN_ACCEL * DT);
      if (this.v < p.minSpeed * 0.5) this.v = p.minSpeed * 0.5;
    } else if (this.v < p.minSpeed) {
      this.paddling = true;
      this.v = Math.min(p.minSpeed, this.v + PADDLE_ACCEL * DT);
      if (this.v < p.minSpeed * 0.5) this.v = p.minSpeed * 0.5;
    }
    if (r.floor > 0 && this.v >= r.floor) this.fanArmed = true;
    const railBefore = s.kind === "rail";
    this.moveAlong(this.v * DT, crouch ? 1 + p.crouchStick : 1, true);
    if (railBefore && this.mode === "ground" && !this.finished && this.track.surfaces[this.surface].kind === "rail") this.grind(this.v * DT);
    if (r.bumpy && cobbles && this.mode === "ground" && !this.finished && this.surface === 0) {
      this.bumpDist += this.v * DT * rattle;
      if (this.bumpDist >= BUMP_EVERY && this.v > BUMP_MIN_SPEED) {
        this.bumpDist = 0;
        this.hop(BUMP_POP + this.v * 0.05);
      }
    }
  }

  private inPuddleAt() {
    const puddles = this.track.puddles;
    if (!puddles) return false;
    for (const q of puddles) if (q.surface === this.surface && this.x >= q.x0 && this.x <= q.x1) return true;
    return false;
  }

  private hop(power: number) {
    const s = this.track.surfaces[this.surface];
    this.vx = this.v * s.tx[this.seg];
    this.vy = this.v * s.ty[this.seg] - power;
    this.enterAir(false);
    this.events.push({ type: "takeoff", popped: false, lip: false, power: 0 });
  }

  private moveAlong(distance: number, stick: number, canFly: boolean) {
    let d = distance;
    while (d > 0) {
      const s = this.track.surfaces[this.surface];
      const remain = s.len[this.seg] - this.segPos;
      if (d < remain) {
        this.segPos += d;
        break;
      }
      d -= remain;
      if (this.seg + 1 >= s.len.length) {
        this.segPos = s.len[this.seg];
        this.syncGround();
        if (this.finished && this.surface === 0) {
          this.v = 0;
          return;
        }
        this.takeoff();
        return;
      }
      const t1x = s.tx[this.seg];
      const t1y = s.ty[this.seg];
      const t2x = s.tx[this.seg + 1];
      const t2y = s.ty[this.seg + 1];
      const cross = t1x * t2y - t1y * t2x;
      if (cross > 0 && canFly) {
        const kappa = cross / ((s.len[this.seg] + s.len[this.seg + 1]) / 2);
        if (this.v * this.v * kappa > this.params.gravity * t1x * stick) {
          this.segPos = s.len[this.seg];
          this.syncGround();
          this.takeoff();
          return;
        }
      } else if (cross < 0) {
        this.v *= t1x * t2x + t1y * t2y;
      }
      this.seg += 1;
      this.segPos = 0;
    }
    this.syncGround();
  }

  private airStep(input: SimInput) {
    const p = this.params;
    this.airSteps += 1;
    if (this.bounceBuffer > 0) this.bounceBuffer -= 1;
    if (this.bounceGrace > 0) this.bounceGrace -= 1;
    if (this.tumbling) {
      this.angle = wrapAngle(this.angle + 11 * DT);
    } else {
      if (this.posing) this.poseStep();
      const spinInput = this.posing ? 0 : input.spin;
      const accel = p.spinAccel * this.rules.spin * DEG * DT;
      const max = p.spinMax * this.rules.spin * DEG;
      if (spinInput !== 0) {
        this.spin = clamp(this.spin + spinInput * accel, -max, max);
      } else if (this.spin > accel) {
        this.spin -= accel;
      } else if (this.spin < -accel) {
        this.spin += accel;
      } else {
        this.spin = 0;
        if (this.rules.rightSelf > 0) {
          const road = this.track.surfaces[0];
          const diff = wrapAngle((covers(road, this.x) ? road.ang[segmentAt(road, this.x)] : 0) - this.angle);
          const lim = this.rules.rightSelf * DEG * DT;
          this.angle += clamp(diff, -lim, lim);
        } else if (p.autoAlign > 0 && !this.posing) {
          const diff = wrapAngle(atan2(this.vy, this.vx) - this.angle);
          const lim = p.autoAlign * DEG * DT;
          this.angle += clamp(diff, -lim, lim);
        }
      }
      this.angle = wrapAngle(this.angle + this.spin * DT);
      this.spun += this.spin * DT;
    }
    const k = p.drag * this.rules.drag * 1e-5 * AIR_DRAG;
    const sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.vx -= k * sp * this.vx * DT;
    this.vy += p.gravity * DT - k * sp * this.vy * DT;
    const x1 = this.x + this.vx * DT;
    const y1 = this.y + this.vy * DT;
    const hit = findLanding(this.track.surfaces, this.x, this.y, x1, y1);
    if (hit) {
      this.land(hit.surface, hit.x);
      return;
    }
    const road = this.track.surfaces[0];
    if (covers(road, x1) && y1 > heightAt(road, x1) + 1 && !this.underground(x1) && this.track.surfaces[this.surface].kind === "sewer") {
      if (this.vx < JET_VX) this.vx = JET_VX;
      const depth = y1 - heightAt(road, x1);
      this.vy = -Math.sqrt(2 * this.params.gravity * (depth + JET_APEX));
      this.surface = 0;
      this.events.push({ type: "jet" });
      return;
    }
    if (covers(road, x1) && y1 > heightAt(road, x1) + 1 && !this.underground(x1) && this.vy >= 0) {
      this.land(0, x1);
      return;
    }
    this.x = x1;
    this.y = y1;
    let below = Infinity;
    for (const surface of this.track.surfaces) {
      if (!covers(surface, x1)) continue;
      const gap = heightAt(surface, x1) - y1;
      if (gap >= 0 && gap < below) below = gap;
    }
    if (below < Infinity && below > this.rise) this.rise = below;
  }

  private land(surfaceIndex: number, x: number) {
    const p = this.params;
    const s = this.track.surfaces[surfaceIndex];
    const seg = segmentAt(s, x);
    this.surface = surfaceIndex;
    this.seg = seg;
    this.segPos = (x - s.xs[seg]) / s.tx[seg];
    const slope = s.ang[seg];
    const vt = Math.max(0, this.vx * s.tx[seg] + this.vy * s.ty[seg]);
    const before = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const airTime = this.airSteps * DT;
    this.stats.airTime += airTime;
    const delta = Math.abs(wrapAngle(this.angle - slope)) / DEG;
    if (surfaceIndex !== 0 && !this.stats.shortcut) {
      this.stats.shortcut = true;
      this.events.push({ type: "shortcut" });
    }
    if (this.tumbling) {
      this.tumbling = false;
      this.mode = "crash";
      this.crashFrom = vt;
      this.syncGround();
      return;
    }
    if (s.kind === "awning") {
      this.bounce(surfaceIndex, x, delta);
      return;
    }
    this.combo = 0;
    this.bounceGrace = 0;
    if (this.finished) {
      if (this.posing) this.endPose(false);
      this.mode = "ground";
      this.v = vt;
      this.syncGround();
      return;
    }
    if (this.posing) {
      this.endPose(false);
      this.crash("pose", vt, delta);
      this.syncGround();
      return;
    }
    if ((this.rise < JUMP_RISE || !(this.takeoffLip || this.cleared)) && delta <= p.okTol) {
      this.v = vt;
      this.mode = "ground";
      this.events.push({ type: "land", quality: "touch", delta, flips: 0, before, after: this.v, air: airTime, rise: this.rise, surface: surfaceIndex });
    } else if (delta <= p.perfectTol + this.rules.perfectTol) {
      const flips = Math.floor((Math.abs(this.spun) / DEG + 40) / 360);
      const share = airTime < FULL_BONUS_AIR ? airTime / FULL_BONUS_AIR : 1;
      this.v = vt + (before - vt) * p.perfectKeep + (p.perfectBonus + flips * p.flipBonus) * share;
      this.mode = "ground";
      this.stats.perfect += 1;
      this.stats.flips += flips;
      this.events.push({ type: "land", quality: "perfect", delta, flips, before, after: this.v, air: airTime, rise: this.rise, surface: surfaceIndex });
      this.landedAt = this.step;
      if (flips > 0) this.trick("flip", flipPoints(flips));
      this.trick("perfect", POINTS.perfect);
    } else if (delta <= p.okTol) {
      const flips = Math.floor((Math.abs(this.spun) / DEG + 40) / 360);
      this.v = vt * (1 - p.okLoss);
      this.mode = "ground";
      this.stats.ok += 1;
      this.stats.flips += flips;
      this.events.push({ type: "land", quality: "ok", delta, flips, before, after: this.v, air: airTime, rise: this.rise, surface: surfaceIndex });
      if (flips > 0) this.trick("flip", flipPoints(flips), false);
      this.bank();
    } else {
      this.crash(delta > 100 ? "upside" : "tilted", vt, delta);
    }
    this.syncGround();
  }

  private underground(x: number) {
    for (const s of this.track.surfaces) if (s.kind === "sewer" && covers(s, x)) return true;
    return false;
  }

  private checkLoops(xPrev: number) {
    const loops = this.track.loops;
    if (!loops || this.finished) return;
    for (let i = 0; i < loops.length; i += 1) {
      if (this.loopUsed[i] || xPrev >= loops[i].x || this.x < loops[i].x) continue;
      this.loopUsed[i] = true;
      this.loopIndex = i;
      this.loopTheta = 0;
      this.loopC = 1;
      this.loopS = 0;
      this.events.push({ type: "loop", index: i, done: false });
      return;
    }
  }

  private loopStep(input: SimInput) {
    const p = this.params;
    const loop = this.track.loops![this.loopIndex];
    const r = loop.r;
    const g = p.gravity;
    const k = p.drag * this.rules.drag * 1e-5 * (input.crouch ? 1 - p.crouchDrag : 1);
    this.paddling = false;
    this.fanning = false;
    this.v += (-g * this.loopS * p.slopeGain - k * this.v * this.v - p.rolling * this.rules.rolling) * DT;
    if (this.v <= 0 || (this.v * this.v) / r + g * this.loopC < 0) {
      const v = this.v > 0 ? this.v : 0;
      this.vx = v * this.loopC;
      this.vy = -v * this.loopS;
      this.loopIndex = -1;
      this.enterAir(false);
      this.tumbling = true;
      this.crashTotal = Math.max(1, Math.round(p.crashTime * this.rules.crashTime * STEP_HZ));
      this.crashLeft = this.crashTotal;
      this.stats.crashes += 1;
      this.events.push({ type: "crash", reason: "loop", delta: 0, speed: v });
      this.dropSeq();
      return;
    }
    const d = (this.v * DT) / r;
    const d2 = d * d;
    const sd = d * (1 - (d2 / 6) * (1 - d2 / 20));
    const cd = 1 - (d2 / 2) * (1 - (d2 / 12) * (1 - d2 / 30));
    let c = this.loopC * cd - this.loopS * sd;
    let s = this.loopS * cd + this.loopC * sd;
    const n = Math.sqrt(c * c + s * s);
    c /= n;
    s /= n;
    this.loopC = c;
    this.loopS = s;
    this.loopTheta += d;
    if (this.loopTheta >= TAU) {
      this.loopIndex = -1;
      this.v += LOOP_BONUS;
      this.stats.loops += 1;
      this.syncGround();
      this.events.push({ type: "loop", index: this.track.loops!.indexOf(loop), done: true });
      return;
    }
    const road = this.track.surfaces[0];
    const cy = heightAt(road, loop.x) - r;
    this.x = loop.x + r * s;
    this.y = cy + r * c;
    this.angle = wrapAngle(-this.loopTheta);
  }

  private checkManholes(xPrev: number) {
    const holes = this.track.manholes;
    if (!holes || !this.crouch || this.finished) return;
    for (let i = 0; i < holes.length; i += 1) {
      const m = holes[i];
      if (this.manholeUsed[i] || this.x < m.x - m.w / 2 || xPrev > m.x + m.w / 2) continue;
      this.manholeUsed[i] = true;
      const s = this.track.surfaces[0];
      this.vx = this.v * s.tx[this.seg];
      this.vy = this.v * s.ty[this.seg] + 120;
      this.y = heightAt(s, this.x) + MANHOLE_DROP;
      this.enterAir(false);
      this.surface = m.surface;
      this.events.push({ type: "manhole", index: i });
      return;
    }
  }

  private rhythmPress() {
    if (this.bounceGrace > 0 && this.lastAwning >= 0) {
      this.bounceGrace = 0;
      this.combo = this.comboHold;
      this.assist(this.lastAwning, 0, true);
      return;
    }
    this.bounceBuffer = RHYTHM_PRE;
  }

  private bounce(surfaceIndex: number, x: number, delta: number) {
    const s = this.track.surfaces[surfaceIndex];
    const seg = segmentAt(s, x);
    const tx = s.tx[seg];
    const ty = s.ty[seg];
    this.x = x;
    this.y = heightAt(s, x, seg);
    this.surface = surfaceIndex;
    this.seg = seg;
    this.segPos = (x - s.xs[seg]) / tx;
    const vn = this.vx * ty - this.vy * tx;
    const vt = this.vx * tx + this.vy * ty;
    const aligned = delta <= this.params.okTol;
    if (!aligned) this.angle = s.ang[seg];
    this.airSteps = 0;
    this.spun = 0;
    this.popped = true;
    this.takeoffLip = true;
    this.cleared = false;
    this.rise = 0;
    this.paddling = false;
    this.lastAwning = surfaceIndex;
    if (this.posing) {
      this.posePending = 0;
      this.endPose(false);
    }
    const out = Math.max(BOUNCE_MIN, -vn * BOUNCE_KEEP);
    this.vx = vt * tx + out * ty;
    this.vy = vt * ty - out * tx;
    if (aligned && this.bounceBuffer > 0) {
      this.bounceBuffer = 0;
      this.bounceGrace = 0;
      this.assist(surfaceIndex, delta, false);
      return;
    }
    this.comboHold = aligned ? this.combo : 0;
    this.combo = 0;
    this.bounceBuffer = 0;
    this.bounceGrace = aligned ? RHYTHM_GRACE : 0;
    this.events.push({ type: "bounce", rhythm: false, combo: 0, delta, surface: surfaceIndex, late: false });
  }

  private assist(from: number, delta: number, late: boolean) {
    const surfaces = this.track.surfaces;
    const edge = surfaces[from].x1;
    let target = -1;
    for (let i = 0; i < surfaces.length; i += 1) {
      const s = surfaces[i];
      if (s.kind !== "awning" || s.x0 <= edge) continue;
      if (target < 0 || s.x0 < surfaces[target].x0) target = i;
    }
    let aimX: number;
    let aimY: number;
    if (target >= 0) {
      const s = surfaces[target];
      aimX = s.x0 + (s.x1 - s.x0) * 0.5;
      aimY = heightAt(s, aimX);
    } else if (this.track.awningExit !== undefined) {
      aimX = this.track.awningExit;
      aimY = heightAt(surfaces[0], aimX);
    } else return;
    const g = this.params.gravity;
    const hv = (this.vx > 700 ? this.vx : 700) + RHYTHM_BOOST;
    const d = aimX - this.x;
    const a = this.params.drag * 1e-5 * AIR_DRAG * hv * hv;
    const disc = hv * hv - 2 * a * d;
    let t = disc > 0 && a > 0 ? (hv - Math.sqrt(disc)) / a : d / hv;
    if (t < 0.25) t = 0.25;
    let vy = (aimY - this.y - 0.5 * g * t * t) / t;
    if (vy > -ASSIST_MIN) vy = -ASSIST_MIN;
    if (vy < -ASSIST_MAX) vy = -ASSIST_MAX;
    this.vx = hv;
    this.vy = vy;
    this.combo += 1;
    this.stats.bounces += 1;
    if (this.combo > this.stats.combo) this.stats.combo = this.combo;
    this.events.push({ type: "bounce", rhythm: true, combo: this.combo, delta, surface: from, late });
  }

  private checkFlocks() {
    const flocks = this.track.flocks;
    if (!flocks) return;
    for (let i = 0; i < flocks.length; i += 1) {
      const f = flocks[i];
      const state = this.flockState[i];
      if (state === 3 || state === 2 || this.x < f.x0) continue;
      if (state === 0) {
        if (this.mode === "air" && !this.tumbling) this.flockState[i] = 1;
        else {
          this.flockState[i] = 2;
          this.events.push({ type: "flock", index: i, clean: false });
          continue;
        }
      }
      if (this.mode !== "air" || this.tumbling) {
        this.flockState[i] = 2;
        this.events.push({ type: "flock", index: i, clean: false });
        continue;
      }
      if (this.x >= f.x1) {
        this.flockState[i] = 3;
        this.vx += FLOCK_BONUS;
        this.stats.flock = true;
        this.events.push({ type: "flock", index: i, clean: true });
      }
    }
  }

  private crash(reason: CrashReason, speed: number, delta = 0) {
    this.mode = "crash";
    this.crashTotal = Math.max(1, Math.round(this.params.crashTime * this.rules.crashTime * STEP_HZ));
    this.crashLeft = this.crashTotal;
    this.crashFrom = speed;
    this.stats.crashes += 1;
    this.paddling = false;
    this.events.push({ type: "crash", reason, delta, speed });
    if (this.wheelie !== 0) this.endWheelie();
    this.dropSeq();
  }

  private crashStep() {
    const p = this.params;
    const u = 1 - this.crashLeft / this.crashTotal;
    const fade = u * 1.6 < 1 ? u * 1.6 : 1;
    this.v = this.crashFrom * (1 - (1 - p.crashKeep) * fade);
    if (this.v < 60) this.v = 60;
    this.moveAlong(this.v * DT, 1, false);
    if (this.mode !== "crash") return;
    this.crashLeft -= 1;
    if (this.crashLeft <= 0) {
      this.mode = "ground";
      if (this.v < p.minSpeed) this.v = p.minSpeed;
      this.events.push({ type: "recover" });
    }
  }

  private checkObstacles(xPrev: number, yPrev: number) {
    const obstacles = this.track.obstacles;
    while (this.nextObstacle < obstacles.length && obstacles[this.nextObstacle].x <= this.x) {
      const index = this.nextObstacle;
      const o = obstacles[index];
      this.nextObstacle += 1;
      if (o.motion || o.window || o.roll) continue;
      if (o.x <= xPrev || this.removed.has(index)) continue;
      this.testObstacle(o, index, o.x, xPrev, yPrev);
    }
    for (const index of this.dynamic) {
      const o = obstacles[index];
      if (this.removed.has(index) || !obstacleActive(o, this.step)) continue;
      const ox = obstacleX(o, this.step);
      const before = obstacleX(o, this.step - 1);
      if (o.roll && ox < before) continue;
      if (xPrev - before < 0 && this.x - ox >= 0) this.testObstacle(o, index, ox, xPrev, yPrev);
    }
  }

  private testObstacle(o: Obstacle, index: number, ox: number, xPrev: number, yPrev: number) {
    if (o.surface !== 0 && o.surface !== this.surface) return;
    const t = this.x > xPrev ? clamp((ox - xPrev) / (this.x - xPrev), 0, 1) : 1;
    const cy = yPrev + (this.y - yPrev) * t;
    const h = heightAt(this.track.surfaces[o.surface], ox) - cy;
    const body = this.crouch ? BODY_CROUCH : BODY_STAND;
    if (!(h < o.high && h + body > o.low)) {
      if (this.mode === "air" && o.low === 0 && h < o.high + CLEAR_MARGIN) this.cleared = true;
      if (o.kind !== "pothole" && o.kind !== "gold" && !this.finished && !this.tumbling && this.mode !== "crash" && !this.nearMissed.has(index)) {
        const gap = o.low > 0 ? o.low - (h + body) : h - o.high;
        if (gap >= 0 && gap < NEAR_MISS && (o.low > 0 || this.mode === "air")) {
          this.nearMissed.add(index);
          this.trick("nearMiss", POINTS.nearMiss);
        }
      }
      return;
    }
    if (o.kind === "gold") {
      if (this.finished) return;
      this.removed.add(index);
      this.stats.secret = true;
      this.events.push({ type: "secret" });
      return;
    }
    const penalized = this.mode !== "crash" && !this.tumbling && !this.finished;
    const bounced = penalized && o.kind === "pothole" && this.rules.bumpy && this.mode === "ground";
    const loss = o.heavy ? 0 : this.params.hitLoss * this.rules.hitLoss * o.loss * (bounced ? POTHOLE_KEEP : 1);
    this.events.push({ type: "hit", index, kind: o.kind, penalized, loss: penalized ? loss : 0, bounced });
    if (!penalized) return;
    this.stats.hits += 1;
    if (o.kind === "crate") this.trick("crate", POINTS.crate, false);
    if (bounced) {
      this.v *= 1 - loss;
      this.hop(POTHOLE_POP);
      return;
    }
    if (o.heavy) {
      const reason = o.kind === "truck" ? "truck" : o.kind === "fence" ? "fence" : "barrier";
      if (this.mode === "air") {
        this.vx *= 0.35;
        this.tumbling = true;
        this.crashTotal = Math.max(1, Math.round(this.params.crashTime * this.rules.crashTime * STEP_HZ));
        this.crashLeft = this.crashTotal;
        this.stats.crashes += 1;
        this.events.push({ type: "crash", reason, delta: 0, speed: this.speed });
        if (this.posing) this.endPose(false);
        this.dropSeq();
      } else {
        this.crash(reason, this.v * 0.6);
      }
    } else if (this.mode === "air") {
      this.vx *= 1 - this.params.hitLoss * this.rules.hitLoss * o.loss;
    } else {
      this.v *= 1 - this.params.hitLoss * this.rules.hitLoss * o.loss;
    }
  }

  private checkFinish(xPrev: number) {
    if (this.finished) return;
    const f = this.track.finish;
    if (this.x < f) return;
    const t = this.x > xPrev ? (f - xPrev) / (this.x - xPrev) : 1;
    this.finished = true;
    this.finishTime = (this.step - 1 + t) * DT;
    this.events.push({ type: "finish", time: this.finishTime });
    if (this.posing) this.endPose(false);
    this.bank();
  }

  private trick(kind: TrickKind, points: number, raise = true) {
    const sh = this.show;
    if (sh.tricks === 0) sh.mult = 1;
    else if (raise && sh.mult < MULT_MAX && (this.mode === "air" || this.step - this.landedAt <= SEQ_WINDOW)) sh.mult += 1;
    sh.tricks += 1;
    sh.seq += points;
    sh.timer = SEQ_WINDOW;
    this.stats.tricks += 1;
    this.events.push({ type: "trick", kind, points, seq: sh.seq, mult: sh.mult });
  }

  private accrue(points: number) {
    this.show.seq += points;
    this.show.timer = SEQ_WINDOW;
  }

  private bank() {
    const sh = this.show;
    if (sh.seq > 0) {
      const points = sh.seq * sh.mult;
      sh.total += points;
      this.stats.show = sh.total;
      if (points > this.stats.bestSeq) this.stats.bestSeq = points;
      this.events.push({ type: "bank", points, mult: sh.mult, total: sh.total });
    }
    sh.seq = 0;
    sh.mult = 1;
    sh.tricks = 0;
    sh.timer = 0;
  }

  private dropSeq() {
    const sh = this.show;
    if (sh.seq > 0) this.events.push({ type: "drop", points: sh.seq * sh.mult });
    sh.seq = 0;
    sh.mult = 1;
    sh.tricks = 0;
    sh.timer = 0;
    this.railScored = false;
    this.railDist = 0;
    this.wheelieScored = false;
    this.wheelieBand = 0;
  }

  private tickShow() {
    const sh = this.show;
    if (this.finished || sh.tricks === 0 || this.mode !== "ground") return;
    if (this.track.surfaces[this.surface].kind === "rail") return;
    const m = this.wheelie < 0 ? -this.wheelie : this.wheelie;
    if (m >= WHEELIE_LO && m <= WHEELIE_HI) return;
    sh.timer -= 1;
    if (sh.timer <= 0) this.bank();
  }

  private grind(distance: number) {
    this.railDist += distance;
    while (this.railDist >= RAIL_EVERY) {
      this.railDist -= RAIL_EVERY;
      if (this.railScored) this.accrue(RAIL_POINTS);
      else {
        this.railScored = true;
        this.trick("rail", RAIL_POINTS);
      }
    }
  }

  private holdInput(hold: boolean) {
    if (hold && !this.prevHold) {
      this.holdFresh = this.mode === "air" && !this.tumbling && !this.finished;
      this.holdSteps = 0;
    }
    this.prevHold = hold;
    if (!hold) {
      this.holdFresh = false;
      if (this.posing) this.endPose(true);
      return;
    }
    this.holdSteps += 1;
    if (this.holdFresh && !this.posing && this.mode === "air" && !this.tumbling && !this.finished && this.holdSteps >= POSE_HOLD) {
      this.posing = true;
      this.poseLevel = 1;
      this.poseSteps = 0;
      this.posePending = 0;
      this.events.push({ type: "pose", level: 1 });
    }
  }

  private poseStep() {
    this.poseSteps += 1;
    const level = this.poseSteps >= POSE_LEVEL * 2 ? 3 : this.poseSteps >= POSE_LEVEL ? 2 : 1;
    if (level !== this.poseLevel) {
      this.poseLevel = level;
      this.events.push({ type: "pose", level });
    }
    this.posePending += level >= 3 ? POSE_RATE * 2 : POSE_RATE;
  }

  private endPose(scored: boolean) {
    const points = Math.round(this.posePending);
    this.posing = false;
    this.poseLevel = 0;
    this.poseSteps = 0;
    this.posePending = 0;
    this.holdFresh = false;
    this.events.push({ type: "pose", level: 0 });
    if (scored && points > 0) this.trick("pose", points);
  }

  private wheelieStep(input: SimInput) {
    if (this.loopIndex >= 0 || this.finished || this.surface < 0) {
      if (this.wheelie !== 0) this.endWheelie();
      return false;
    }
    const s = input.spin;
    const p = this.wheelie;
    if (p === 0 && this.wheelieVel === 0 && s === 0) return false;
    const k = 0.5 + 0.5 * this.rules.spin;
    const m = p < 0 ? -p : p;
    const side = p < 0 ? -1 : p > 0 ? 1 : s;
    const restore = (WHEELIE_FALL * (WHEELIE_BAL - m)) / WHEELIE_BAL;
    this.wheelieVel += (s * WHEELIE_PUSH * k - side * restore - WHEELIE_DAMP * this.wheelieVel) * DT;
    const next = p + this.wheelieVel * DT;
    if ((p < 0 && next >= 0) || (p > 0 && next <= 0)) {
      this.endWheelie();
      return false;
    }
    if (p === 0) this.events.push({ type: "wheelie", on: true });
    this.wheelie = next;
    const nm = next < 0 ? -next : next;
    if (nm > WHEELIE_MAX) {
      this.crash("wheelie", this.v, nm / DEG);
      return true;
    }
    if (nm >= WHEELIE_LO && nm <= WHEELIE_HI) {
      this.wheelieBand += 1;
      if (this.wheelieBand >= WHEELIE_EVERY) {
        this.wheelieBand -= WHEELIE_EVERY;
        if (this.wheelieScored) this.accrue(WHEELIE_POINTS);
        else {
          this.wheelieScored = true;
          this.trick("wheelie", WHEELIE_POINTS);
        }
      }
    }
    return true;
  }

  private endWheelie() {
    const was = this.wheelie !== 0;
    this.wheelie = 0;
    this.wheelieVel = 0;
    this.wheelieBand = 0;
    this.wheelieScored = false;
    if (was) this.events.push({ type: "wheelie", on: false });
  }
}
