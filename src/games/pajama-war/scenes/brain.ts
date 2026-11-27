import type { ArenaDef } from "../arenas";
import { BODY, FORT, HP, PILLOW, type KidId } from "../config";
import { firstTallHit, FLOOR_Y, lineBlocked, Navigator, SHOT_PAD, traceReaches, traceShot, type Box, type NavGrid, type Point, type SteerOut } from "../nav";

type Style = { near: number; far: number; dodge: number; retreatAt: number; strafe: number; lead: number; bank: number; greed: number; backoff: number; burst: number; hold: number };
type FortStyle = { wreck: number; streak: number; expose: number; aware: number; patience: number };
type Beat = "burst" | "steady" | "hold";

const STYLE: Record<KidId, Style> = {
  lia: { near: 280, far: 470, dodge: 0.62, retreatAt: 3, strafe: 0.9, lead: 0.5, bank: 0.3, greed: 1.3, backoff: 150, burst: 0.25, hold: 0.3 },
  nico: { near: 470, far: 690, dodge: 0.32, retreatAt: 3, strafe: 0.55, lead: 0.75, bank: 0.65, greed: 0.95, backoff: 40, burst: 0.38, hold: 0.22 },
  bia: { near: 360, far: 560, dodge: 0.38, retreatAt: 2, strafe: 0.65, lead: 0.6, bank: 0.4, greed: 1.1, backoff: 70, burst: 0.32, hold: 0.26 },
};

const FORT_STYLE: Record<KidId, FortStyle> = {
  lia: { wreck: 0.15, streak: 1, expose: -0.25, aware: 1, patience: 600 },
  nico: { wreck: 0.85, streak: 0.92, expose: 0.45, aware: 0.55, patience: 2200 },
  bia: { wreck: 0.5, streak: 0.45, expose: 0.15, aware: 0.8, patience: 1200 },
};

export type BrainBody = {
  readonly kid: KidId;
  readonly isPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  hp: number;
  regenScale: number;
  readyAt: number;
  stunUntil: number;
  lastHurtAt: number;
  special: boolean;
  hurtBy: BrainBody | null;
  readonly stats: { cooldown: number };
  canThrow(t: number): boolean;
};

export type BrainShot = { flying: boolean; owner: BrainBody; x: number; y: number; vx: number; vy: number };

export type BrainWorld = { def: ArenaDef; nav: NavGrid; boxes: readonly Box[] };

export type BrainView = {
  fighters: readonly BrainBody[];
  pillows: readonly BrainShot[];
  room: BrainWorld;
  heat: number;
  warm: number;
  windup: number;
  playerSafeUntil: number;
  targets: Map<BrainBody, BrainBody | null>;
  hider: BrainBody | null;
  special: Point | null;
};

export type BrainOut = { mx: number; my: number; angle: number | null; target: BrainBody | null };
export type BrainMode = "engage" | "cover" | "grab" | "hunt" | "roam";

const HIDER_PULL = 3.4;
const CANDIDATES = 34;
const RING = 8;
const DUEL = { quick: 60, run: 800, floor: 500, three: 0.45, longest: 3, turn: 1.2, reach: 300, flip: 0.35, plant: 0.55 };

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export class Brain {
  target: BrainBody | null = null;
  mode: BrainMode = "roam";
  readonly nav: Navigator;
  bankShots = 0;
  fortShots = 0;
  fort: FortStyle;
  private fortArena: boolean;
  private wreckStreak = 0;
  private beat: Beat = "steady";
  private beatRun = 0;
  private shift = false;
  private rest = 0;
  private ready = true;
  private dangerSeen = 0;
  private retargetAt = 0;
  private planAt = 0;
  private holdUntil = 0;
  private strafe = 1;
  private strafeAt = 0;
  private hesitateUntil = 0;
  private dodgeUntil = 0;
  private dodge = { x: 0, y: 0 };
  private seen = new WeakSet<object>();
  private duel = false;
  private volley = 0;
  private shots = 0;
  private bank = 0;
  private owed = -1;
  private readySince = -1;
  private flank = false;
  private orbit = 1;
  private running = false;
  private retreating = false;
  private hiderSeen: BrainBody | null = null;
  private blindSince = -1;
  private steerOut: SteerOut = { x: 0, y: 0, arrived: false };
  private style: (typeof STYLE)[KidId];
  private out: BrainOut = { mx: 0, my: 0, angle: null, target: null };

  constructor(
    readonly me: BrainBody,
    private skill: number,
    world: BrainWorld,
    private rng: () => number = Math.random,
  ) {
    this.style = STYLE[me.kid];
    this.fort = FORT_STYLE[me.kid];
    this.fortArena = world.def.mechanic === "fort";
    this.nav = new Navigator(world.nav);
    this.hesitateUntil = 900 + rng() * 700;
    this.strafe = rng() < 0.5 ? -1 : 1;
  }

  get stuckEvents() {
    return this.nav.stuckEvents;
  }

  private clearShot(ax: number, ay: number, bx: number, by: number, v: BrainView) {
    return !lineBlocked(v.room.boxes, ax, ay + 6, bx, by);
  }

  private fortInWay(ax: number, ay: number, bx: number, by: number, v: BrainView) {
    const hit = firstTallHit(v.room.boxes, ax, ay + 6, bx, by);
    return hit?.box.fort && hit.box.fort.hp > 0 ? hit.box : null;
  }

  private fortDanger(x: number, y: number, v: BrainView) {
    let s = 0;
    if (!this.fortArena) return 0;
    for (const b of v.room.boxes) {
      if (!b.fort || b.fort.hp <= 0 || b.fort.hp > 2) continue;
      const dx = Math.max(b.x0 - x, 0, x - b.x1) / (FORT.reachX * 1.3);
      const dy = Math.max(b.y0 - y, 0, y - b.y1) / (FORT.reachY * 1.3);
      if (dx * dx + dy * dy < 1) s += (b.fort.hp === 1 ? 170 : 50) * this.fort.aware;
    }
    return s;
  }

  private pickTarget(t: number, v: BrainView) {
    const me = this.me;
    let best: BrainBody | null = null;
    let bestScore = -Infinity;
    for (const o of v.fighters) {
      if (o === me || !o.alive) continue;
      const dist = Math.hypot(o.x - me.x, o.y - me.y);
      let score = 900 / (dist + 250);
      if (o === me.hurtBy && t - me.lastHurtAt < 4000) score += o.isPlayer ? 0.55 : 0.9;
      if (o.hp > me.hp + 2) score += 0.2;
      if (o === v.hider) score += HIDER_PULL;
      if (this.clearShot(me.x, me.y, o.x, o.y, v)) score += 0.25;
      let piled = 0;
      for (const [who, tg] of v.targets) if (who !== me && tg === o) piled += 1;
      score -= piled * (o.isPlayer ? 1.7 : 1.25);
      if (this.fortArena) {
        const fort = this.fortInWay(me.x, me.y, o.x, o.y, v)?.fort;
        if (fort) score += fort.hp <= fort.max / 2 ? this.fort.expose : this.fort.expose * 0.4;
      }
      score += this.rng() * 0.7;
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }
    if (best !== this.target) this.planAt = 0;
    this.target = best;
    this.retargetAt = t + 1700 + this.rng() * 1600;
  }

  private decide(v: BrainView): BrainMode {
    const me = this.me;
    if (this.retreating) return "cover";
    if (v.special && !me.special && !v.fighters.some((f) => f.special && f.alive)) {
      const mine = Math.hypot(v.special.x - me.x, v.special.y - me.y);
      let rival = Infinity;
      for (const o of v.fighters) if (o !== me && o.alive) rival = Math.min(rival, Math.hypot(v.special.x - o.x, v.special.y - o.y));
      if (mine <= rival * this.style.greed + 60 && (me.hp > 2 || mine < 260)) return "grab";
    }
    if (!this.target) return "roam";
    if (v.hider && this.target === v.hider) return "hunt";
    return "engage";
  }

  private edgeCost(x: number, y: number, v: BrainView, reach: number, weight: number) {
    const b = v.room.def.bounds;
    const edge = Math.min(x - b.x0, b.x1 - x, y - b.y0, b.y1 - y);
    return edge < reach ? (reach - edge) * weight : 0;
  }

  private band(t: number, v: BrainView) {
    const me = this.me;
    const tg = this.target;
    let near = this.style.near * (1 - v.heat * 0.25);
    let far = this.style.far * (1 - v.heat * 0.2);
    if (this.mode === "hunt") {
      near *= 0.7;
      far *= 0.85;
    }
    if (tg && (tg.readyAt > t + 280 || tg.stunUntil > t)) {
      near *= 0.8;
      far *= 0.82;
    }
    if (me.readyAt > t + 200) {
      near += this.style.backoff;
      far += this.style.backoff * 0.6;
    }
    return { near, far };
  }

  private scoreEngage(x: number, y: number, v: BrainView, near: number, far: number) {
    const me = this.me;
    const tg = this.target!;
    const d = Math.hypot(x - tg.x, y - tg.y);
    let s = d < near ? (near - d) * 2.2 : d > far ? (d - far) * 1.6 : 0;
    if (!me.special && !this.clearShot(x, y, tg.x, tg.y, v)) s += this.fortArena && this.fortInWay(x, y, tg.x, tg.y, v) ? 420 * (1 - this.fort.wreck * 0.55) : 420;
    s += Math.hypot(x - me.x, y - me.y) * 0.55;
    s += this.fortDanger(x, y, v);
    for (const o of v.fighters) {
      if (o === me || o === tg || !o.alive) continue;
      const od = Math.hypot(x - o.x, y - o.y);
      if (od < 240) s += (240 - od) * 1.1;
    }
    s += this.edgeCost(x, y, v, 90, 1.8);
    return s + this.rng() * 70;
  }

  private scoreFlank(x: number, y: number, v: BrainView, near: number, far: number) {
    const me = this.me;
    const tg = this.target!;
    const d = Math.hypot(x - tg.x, y - tg.y);
    let s = d < near ? (near - d) * 2.2 : d > far ? (d - far) * 1.6 : 0;
    const turn = wrap(Math.atan2((y - tg.y) / FLOOR_Y, x - tg.x) - Math.atan2((me.y - tg.y) / FLOOR_Y, me.x - tg.x));
    s += Math.abs(Math.abs(turn) - DUEL.turn) * 260;
    if (Math.sign(turn) !== this.orbit) s += 90;
    s += Math.abs(Math.hypot(x - me.x, y - me.y) - DUEL.reach) * 0.45;
    if (!me.special && !this.clearShot(x, y, tg.x, tg.y, v)) s += this.fortArena && this.fortInWay(x, y, tg.x, tg.y, v) ? 420 * (1 - this.fort.wreck * 0.55) : 420;
    s += this.fortDanger(x, y, v);
    s += this.edgeCost(x, y, v, 90, 1.8);
    return s + this.rng() * 60;
  }

  private scoreCover(x: number, y: number, v: BrainView) {
    const me = this.me;
    let s = 0;
    for (const o of v.fighters) {
      if (o === me || !o.alive) continue;
      const od = Math.hypot(x - o.x, y - o.y);
      if (od < 560) s += (560 - od) * 1.6;
      if (this.clearShot(o.x, o.y, x, y, v)) s += 140;
      else if (this.fortArena) {
        const fort = this.fortInWay(o.x, o.y, x, y, v)?.fort;
        if (fort && fort.hp <= 2) s += 60 * (3 - fort.hp);
      }
    }
    s += this.fortDanger(x, y, v);
    s += this.edgeCost(x, y, v, 120, 2.6);
    s += Math.hypot(x - me.x, y - me.y) * 0.3;
    return s + this.rng() * 40;
  }

  private plan(t: number, v: BrainView) {
    const me = this.me;
    const grid = v.room.nav;
    const shift = this.shift;
    this.shift = false;
    const flank = this.flank && this.mode === "engage" && this.target !== null;
    if (this.mode === "engage") this.flank = false;
    this.holdUntil = 0;
    if (this.mode === "grab" && v.special) {
      this.nav.setGoal(v.special.x, v.special.y, t, 6);
      this.planAt = t + 280;
      return;
    }
    const stands = grid.stands;
    const goal = this.nav.goal;
    const { near, far } = this.band(t, v);
    const best = { x: 0, y: 0, score: Infinity };
    const consider = (x: number, y: number, bonus = 0) => {
      let s = (flank ? this.scoreFlank(x, y, v, near, far) : this.mode === "cover" ? this.scoreCover(x, y, v) : this.mode === "roam" ? this.scoreRoam(x, y, v) : this.scoreEngage(x, y, v, near, far)) + bonus;
      if (shift && Math.hypot(x - me.x, y - me.y) < 100) s += 220;
      if (s < best.score) {
        best.score = s;
        best.x = x;
        best.y = y;
      }
    };
    for (let i = 0; i < CANDIDATES; i += 1) {
      const c = stands[Math.floor(this.rng() * stands.length)];
      consider(grid.centerX(c), grid.centerY(c));
    }
    const tg = this.target;
    if (tg && (this.mode === "engage" || this.mode === "hunt")) {
      const r = (near + far) / 2;
      const off = this.rng() * Math.PI * 2;
      for (let i = 0; i < RING; i += 1) {
        const a = off + (i / RING) * Math.PI * 2;
        const c = grid.nearest(tg.x + Math.cos(a) * r, tg.y + Math.sin(a) * r);
        if (c >= 0) consider(grid.centerX(c), grid.centerY(c));
      }
      if (flank) {
        const from = Math.atan2((me.y - tg.y) / FLOOR_Y, me.x - tg.x);
        for (const side of [-1, 1]) {
          for (const j of [-0.35, 0, 0.35]) {
            const a = from + side * (DUEL.turn + j);
            const c = grid.nearest(tg.x + Math.cos(a) * r, tg.y + Math.sin(a) * r * FLOOR_Y);
            if (c >= 0) consider(grid.centerX(c), grid.centerY(c));
          }
        }
      }
    }
    if (goal && !this.nav.blocked && !shift) consider(goal.x, goal.y, -70);
    consider(me.x, me.y, this.nav.blocked ? 300 : 30);
    if (best.score < Infinity) {
      if (Math.hypot(best.x - me.x, best.y - me.y) < 26) this.nav.clear();
      else this.nav.setGoal(best.x, best.y, t);
    }
    this.planAt = t + (flank ? 1100 : this.mode === "cover" ? 700 : 650) + this.rng() * 450;
  }

  private scoreRoam(x: number, y: number, v: BrainView) {
    const me = this.me;
    const d = Math.hypot(x - me.x, y - me.y);
    return Math.abs(d - 320) + this.edgeCost(x, y, v, 110, 2) + this.rng() * 120;
  }

  private freeAhead(ux: number, uy: number, v: BrainView) {
    const me = this.me;
    return v.room.nav.clearAt(me.x + ux * 28, me.y + uy * 28 * FLOOR_Y, 0);
  }

  private validate(mx: number, my: number, v: BrainView) {
    const len = Math.hypot(mx, my);
    if (len < 0.05) {
      this.out.mx = 0;
      this.out.my = 0;
      return;
    }
    const ux = mx / len;
    const uy = my / len;
    if (this.freeAhead(ux, uy, v)) {
      this.out.mx = mx;
      this.out.my = my;
      return;
    }
    for (const a of [0.6, -0.6, 1.2, -1.2, 1.7, -1.7]) {
      const r = a * this.strafe;
      const c = Math.cos(r);
      const s = Math.sin(r);
      const rx = ux * c - uy * s;
      const ry = ux * s + uy * c;
      if (this.freeAhead(rx, ry, v)) {
        this.out.mx = rx * len;
        this.out.my = ry * len;
        return;
      }
    }
    this.out.mx = 0;
    this.out.my = 0;
  }

  think(t: number, v: BrainView): BrainOut {
    const me = this.me;
    const rng = this.rng;
    const out = this.out;
    out.angle = null;
    out.target = null;
    if (v.hider !== this.hiderSeen) {
      this.hiderSeen = v.hider;
      this.retargetAt = 0;
    }
    if (!this.target || !this.target.alive || t >= this.retargetAt) this.pickTarget(t, v);
    v.targets.set(me, this.target);
    const skill = Math.min(1, Math.max(0, this.skill + v.heat * 0.22));
    const duel = this.inDuel(v);
    if (duel !== this.duel) {
      this.duel = duel;
      this.volley = duel ? 2 + (rng() < DUEL.three ? 1 : 0) : 0;
      this.shots = 0;
      this.bank = 0;
      this.owed = -1;
      this.flank = false;
      this.running = false;
    }

    const hp = me.hp;
    if (!this.retreating && hp <= this.style.retreatAt && v.heat < 0.9 && me.regenScale > 0) this.retreating = true;
    if (this.retreating && (hp >= Math.min(HP, this.style.retreatAt + 4) || v.heat >= 0.9)) this.retreating = false;

    const tg = this.target;
    if (tg && !v.hider) {
      if (!me.special && !this.clearShot(me.x, me.y, tg.x, tg.y, v)) {
        const behindFort = this.fortArena && this.fortInWay(me.x, me.y, tg.x, tg.y, v) !== null;
        if (this.blindSince < 0) {
          this.blindSince = t;
          if (behindFort && this.fort.patience < 1000) this.planAt = Math.min(this.planAt, t + 150);
        }
        if (t - this.blindSince > (behindFort ? this.fort.patience : 1400)) {
          const alt = v.fighters.find((o) => o !== me && o !== tg && o.alive && Math.hypot(o.x - me.x, o.y - me.y) < PILLOW.range * 0.85 && this.clearShot(me.x, me.y, o.x, o.y, v));
          if (alt) {
            this.target = alt;
            v.targets.set(me, alt);
            this.retargetAt = t + 1500 + rng() * 1000;
            this.planAt = 0;
          }
          this.blindSince = -1;
        }
      } else this.blindSince = -1;
    }

    const mode = this.decide(v);
    if (mode !== this.mode) {
      this.mode = mode;
      this.planAt = 0;
    }
    if (t >= this.strafeAt) {
      this.strafe = rng() < 0.5 ? -1 : 1;
      this.strafeAt = t + 1100 + rng() * 1500;
    }
    if (this.fortArena) {
      let near = 0;
      for (const b of v.room.boxes) {
        if (!b.fort || b.fort.hp !== 1) continue;
        const dx = Math.max(b.x0 - me.x, 0, me.x - b.x1) / (FORT.reachX * 1.3);
        const dy = Math.max(b.y0 - me.y, 0, me.y - b.y1) / (FORT.reachY * 1.3);
        if (dx * dx + dy * dy < 1) near += 1;
      }
      if (near > this.dangerSeen && rng() < this.fort.aware) this.planAt = 0;
      this.dangerSeen = near;
    }
    if (t >= this.planAt || this.nav.blocked || this.nav.failed || (!this.nav.goal && t >= this.holdUntil)) this.plan(t, v);

    let mx = 0;
    let my = 0;
    const mag = this.nav.steer(me, t, this.steerOut);
    if (mag > 0) {
      mx = this.steerOut.x * mag;
      my = this.steerOut.y * mag;
    } else {
      this.nav.hold();
      if (this.steerOut.arrived) {
        this.nav.clear();
        this.holdUntil = t + 500 + rng() * 700;
        this.planAt = Math.max(this.planAt, this.holdUntil);
      }
      if (this.target && this.mode !== "grab") {
        const dx = this.target.x - me.x;
        const dy = this.target.y - me.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const { near, far } = this.band(t, v);
        const s = this.style.strafe * (this.retreating ? 0.4 : 0.7) * (this.duel && !this.running ? DUEL.plant : 1);
        mx = -uy * this.strafe * s;
        my = ux * this.strafe * s;
        if (dist > far) {
          mx += ux * 0.6;
          my += uy * 0.6;
        } else if (dist < near) {
          mx -= ux * 0.6;
          my -= uy * 0.6;
        }
        if (!this.freeAhead(-uy * this.strafe, ux * this.strafe, v)) this.strafe = -this.strafe;
      }
    }

    for (const o of v.fighters) {
      if (o === me || !o.alive) continue;
      const ox = me.x - o.x;
      const oy = me.y - o.y;
      const d = Math.hypot(ox, oy);
      if (d < 170 && d > 0) {
        const k = ((170 - d) / 170) * 0.8;
        mx += (ox / d) * k;
        my += (oy / d) * k;
      }
    }

    for (const p of v.pillows) {
      if (!p.flying || p.owner === me || this.seen.has(p)) continue;
      const rx = me.x - p.x;
      const ry = me.y - p.y;
      const vv = p.vx * p.vx + p.vy * p.vy;
      if (vv < 1) continue;
      const ts = (rx * p.vx + ry * p.vy) / vv;
      if (ts <= 0 || ts > 0.5) continue;
      const missX = rx - p.vx * ts;
      const missY = (ry - p.vy * ts) * 1.4;
      if (Math.hypot(missX, missY) > 80) continue;
      this.seen.add(p);
      const chance = this.style.dodge * (0.45 + skill * 0.6);
      if (rng() > chance) continue;
      const len = Math.sqrt(vv);
      let px = -p.vy / len;
      let py = p.vx / len;
      if (px * missX + py * missY < 0) {
        px = -px;
        py = -py;
      }
      const grid = v.room.nav;
      const okA = grid.clearAt(me.x + px * 70, me.y + py * 70 * FLOOR_Y, 0);
      const okB = grid.clearAt(me.x - px * 70, me.y - py * 70 * FLOOR_Y, 0);
      if (!okA && okB) {
        px = -px;
        py = -py;
      } else if (!okA) continue;
      this.dodge = { x: px, y: py };
      this.dodgeUntil = t + 260 + rng() * 120;
    }
    if (t < this.dodgeUntil) {
      mx = this.dodge.x * 2;
      my = this.dodge.y * 2;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    const pace = this.running ? 1 : 0.82 + skill * 0.18;
    this.validate(mx * pace, my * pace, v);

    const ready = me.canThrow(t);
    if (ready && !this.ready) {
      this.hesitateUntil = Math.max(this.hesitateUntil, t + this.rest);
      this.rest = 0;
      this.readySince = t;
    }
    this.ready = ready;
    if (this.running && ready && t >= this.hesitateUntil) this.running = false;
    if (tg && ready && t >= this.hesitateUntil) this.aim(t, v, skill);
    return out;
  }

  private aim(t: number, v: BrainView, skill: number) {
    const me = this.me;
    const rng = this.rng;
    const tg = this.target!;
    let victim: BrainBody | null = tg;
    if (tg.isPlayer && t < v.playerSafeUntil) {
      victim = v.hider ? null : (v.fighters.find((o) => o !== me && o.alive && !o.isPlayer && Math.hypot(o.x - me.x, o.y - me.y) < PILLOW.range * 0.8) ?? null);
    }
    const keen = this.retreating ? 0.35 : 1;
    if (!victim || rng() >= keen) {
      this.hesitateUntil = t + 160;
      return;
    }
    const dist = Math.hypot(victim.x - me.x, victim.y - me.y);
    if (dist >= PILLOW.range * 0.92) {
      this.hesitateUntil = t + 160;
      return;
    }
    const flight = dist / PILLOW.speed;
    const lead = this.style.lead * (0.35 + skill * 0.65);
    const px = victim.x + victim.vx * flight * lead;
    const py = victim.y + victim.vy * flight * lead;
    let angle: number | null = null;
    let banked = false;
    if (me.special || this.clearShot(me.x, me.y, px, py, v)) angle = Math.atan2((py - me.y) / FLOOR_Y, px - me.x);
    else if (v.room.boxes.some((b) => b.bouncy) && rng() < this.style.bank * (0.4 + skill * 0.8)) {
      angle = this.bankShot(px, py, v);
      banked = angle !== null;
    }
    let wrecking = false;
    if (angle === null && this.fortArena && this.fortInWay(me.x, me.y, px, py, v) && rng() < this.fort.wreck * (0.45 + skill * 0.6) * this.fort.streak ** this.wreckStreak) {
      angle = Math.atan2((py - me.y) / FLOOR_Y, px - me.x);
      wrecking = true;
    }
    if (angle === null) {
      this.hesitateUntil = t + 160;
      return;
    }
    const ease = 1 - v.warm;
    const spread = victim.isPlayer ? ((1 - skill) * 0.44 + 0.06) * (1 + ease * 0.35) : (1 - skill) * 0.24 + 0.035;
    this.out.angle = angle + (rng() * 2 - 1) * spread * (banked || wrecking ? 0.5 : 1);
    this.out.target = victim;
    if (banked) this.bankShots += 1;
    if (wrecking) this.fortShots += 1;
    if (this.fortArena) this.wreckStreak = wrecking ? this.wreckStreak + 1 : 0;
    const opening = victim.readyAt > t + 280 || victim.stunUntil > t ? 0.6 : 1;
    const press = (1.25 - skill * 0.6 - v.heat * 0.35) * (victim.isPlayer ? 1.15 + ease * 0.6 : 1) * opening * (me.special ? 0.6 : 1);
    const pause = this.nextPause(press, v, !this.duel);
    this.rest = this.duel ? this.duelPause(t, pause) : pause;
  }

  private inDuel(v: BrainView) {
    let rival: BrainBody | null = null;
    for (const o of v.fighters) {
      if (o === this.me || !o.alive) continue;
      if (rival) return false;
      rival = o;
    }
    return rival !== null && rival.isPlayer;
  }

  private duelPause(t: number, pause: number) {
    const rng = this.rng;
    if (this.owed >= 0 && this.readySince >= 0) this.bank += this.owed - (t - this.readySince);
    this.owed = pause;
    this.shots += 1;
    if (this.shots < this.volley || (this.bank + pause < DUEL.run && this.shots < DUEL.longest)) return rng() * DUEL.quick;
    this.shots = 0;
    this.volley = 2 + (rng() < DUEL.three ? 1 : 0);
    if (rng() < DUEL.flip) this.orbit = -this.orbit;
    this.flank = true;
    this.planAt = 0;
    this.running = true;
    return Math.max(DUEL.floor, this.bank + pause);
  }

  private nextPause(press: number, v: BrainView, move = true) {
    const rng = this.rng;
    const burst = this.style.burst + v.heat * 0.2;
    const hold = this.style.hold * (1 - v.heat * 0.3);
    const roll = rng();
    let beat: Beat = roll < burst ? "burst" : roll < burst + hold ? "hold" : "steady";
    if (beat === this.beat && this.beatRun >= (beat === "hold" ? 1 : 2)) beat = beat !== "steady" ? "steady" : rng() < burst / (burst + hold) ? "burst" : "hold";
    this.beatRun = beat === this.beat ? this.beatRun + 1 : 1;
    this.beat = beat;
    const base = Math.max(0, 690 * press - v.windup) / (burst * 0.12 + hold * 2 + (1 - burst - hold));
    if (beat === "burst") return base * rng() * 0.24;
    if (beat === "steady") return Math.max(0, base * (0.6 + rng() * 0.8) - 50) + rng() * 140;
    if (rng() < 0.5 && move) {
      this.shift = true;
      this.planAt = 0;
    }
    return Math.max(200 + rng() * 160, base * (1.6 + rng() * 0.8));
  }

  private bankShot(px: number, py: number, v: BrainView) {
    const me = this.me;
    const boxes = v.room.boxes;
    const bounds = v.room.def.bounds;
    const oy = me.y + 6;
    let best: number | null = null;
    let bestLen = Infinity;
    for (const box of boxes) {
      if (!box.bouncy) continue;
      const faces: [number, number][] = [
        [0, box.x0 - SHOT_PAD],
        [1, box.x1 + SHOT_PAD],
        [2, box.y0 - SHOT_PAD],
        [3, box.y1 + SHOT_PAD],
      ];
      for (const [side, c] of faces) {
        const tx = side < 2 ? 2 * c - px : px;
        const ty = side < 2 ? py : 2 * c - py;
        const a = Math.atan2((ty - oy) / FLOOR_Y, tx - me.x);
        const trace = traceShot(me.x + Math.cos(a) * 34, oy, a, boxes, bounds, { range: PILLOW.range });
        if (!trace.bounce || trace.bounce.box !== box) continue;
        if (!traceReaches(trace, px, py, BODY.rx * 0.8, BODY.ry * 0.8, trace.bounce.at)) continue;
        if (trace.length < bestLen) {
          bestLen = trace.length;
          best = a;
        }
      }
    }
    return best;
  }
}
