import * as Phaser from "phaser";
import { HP, PILLOW, type KidId } from "../config";
import type { Fighter } from "./fighter";
import type { Pillow } from "./pillows";
import type { Room } from "./room";

const STYLE: Record<KidId, { near: number; far: number; dodge: number; retreatAt: number; strafe: number; lead: number }> = {
  lia: { near: 280, far: 470, dodge: 0.62, retreatAt: 3, strafe: 0.9, lead: 0.5 },
  nico: { near: 470, far: 690, dodge: 0.32, retreatAt: 3, strafe: 0.55, lead: 0.75 },
  bia: { near: 360, far: 560, dodge: 0.38, retreatAt: 2, strafe: 0.65, lead: 0.6 },
};

export type BrainView = { fighters: Fighter[]; pillows: Pillow[]; room: Room; heat: number; warm: number; playerSafeUntil: number; targets: Map<Fighter, Fighter | null> };

export class Brain {
  target: Fighter | null = null;
  private retargetAt = 0;
  private strafe = 1;
  private strafeAt = 0;
  private hesitateUntil = 0;
  private dodgeUntil = 0;
  private dodge = { x: 0, y: 0 };
  private seen = new WeakSet<Pillow>();
  private retreating = false;
  private wander = { x: 0, y: 0, until: 0 };
  private last = { x: 0, y: 0, at: 0 };
  private style: (typeof STYLE)[KidId];

  constructor(
    readonly me: Fighter,
    private skill: number,
  ) {
    this.style = STYLE[me.kid];
    this.hesitateUntil = 900 + Math.random() * 700;
  }

  private pickTarget(t: number, v: BrainView) {
    const me = this.me;
    let best: Fighter | null = null;
    let bestScore = -Infinity;
    for (const o of v.fighters) {
      if (o === me || !o.alive) continue;
      const dist = Math.hypot(o.x - me.x, o.y - me.y);
      let score = 900 / (dist + 250);
      if (o === me.hurtBy && t - me.lastHurtAt < 4000) score += o.isPlayer ? 0.55 : 0.9;
      if (o.hp > me.hp + 2) score += 0.2;
      let piled = 0;
      for (const [who, tg] of v.targets) if (who !== me && tg === o) piled += 1;
      score -= piled * (o.isPlayer ? 1.7 : 1.25);
      score += Math.random() * 0.7;
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }
    this.target = best;
    this.retargetAt = t + 1700 + Math.random() * 1600;
  }

  think(t: number, dt: number, v: BrainView): { mx: number; my: number; angle: number | null; target: Fighter | null } {
    const me = this.me;
    const b = v.room.def.bounds;
    if (!this.target || !this.target.alive || t >= this.retargetAt) this.pickTarget(t, v);
    v.targets.set(me, this.target);
    const tg = this.target;
    let mx = 0;
    let my = 0;
    const skill = Phaser.Math.Clamp(this.skill + v.heat * 0.22, 0, 1);

    const hp = me.hp;
    if (!this.retreating && hp <= this.style.retreatAt && v.heat < 0.9 && me.regenScale > 0) this.retreating = true;
    if (this.retreating && (hp >= Math.min(HP, this.style.retreatAt + 4) || v.heat >= 0.9)) this.retreating = false;

    if (tg) {
      const dx = tg.x - me.x;
      const dy = tg.y - me.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;
      const near = this.style.near * (1 - v.heat * 0.25);
      const far = this.style.far * (1 - v.heat * 0.2);
      if (this.retreating) {
        let rx = 0;
        let ry = 0;
        for (const o of v.fighters) {
          if (o === me || !o.alive) continue;
          const ox = me.x - o.x;
          const oy = me.y - o.y;
          const d = Math.hypot(ox, oy) || 1;
          rx += (ox / d) * (900 / (d + 200));
          ry += (oy / d) * (900 / (d + 200));
        }
        mx += rx;
        my += ry;
      } else if (dist > far) {
        mx += ux;
        my += uy;
      } else if (dist < near) {
        mx -= ux;
        my -= uy;
      }
      if (t >= this.strafeAt) {
        this.strafe = Math.random() < 0.5 ? -1 : 1;
        this.strafeAt = t + 1100 + Math.random() * 1500;
      }
      const s = this.style.strafe * (this.retreating ? 0.5 : 1);
      mx += -uy * this.strafe * s;
      my += ux * this.strafe * s;
      if (v.room.lineBlocked(me.x, me.y - 60, tg.x, tg.y - 60)) {
        mx += -uy * this.strafe * 0.8;
        my += ux * this.strafe * 0.8;
      }
    }

    for (const o of v.fighters) {
      if (o === me || !o.alive || o === tg) continue;
      const ox = me.x - o.x;
      const oy = me.y - o.y;
      const d = Math.hypot(ox, oy);
      if (d < 260 && d > 0) {
        mx += (ox / d) * 0.6;
        my += (oy / d) * 0.6;
      }
    }
    const edge = 110;
    if (me.x < b.x0 + edge) mx += 1;
    if (me.x > b.x1 - edge) mx -= 1;
    if (me.y < b.y0 + edge * 0.6) my += 1;
    if (me.y > b.y1 - edge * 0.6) my -= 1;
    for (const blk of v.room.blocks) {
      const cx = Phaser.Math.Clamp(me.x, blk.x0, blk.x1);
      const cy = Phaser.Math.Clamp(me.y, blk.y0, blk.y1);
      const ox = me.x - cx;
      const oy = (me.y - cy) * 1.4;
      const d = Math.hypot(ox, oy);
      if (d < 90 && d > 0) {
        mx += (ox / d) * 0.7;
        my += (oy / d) * 0.7;
      }
    }

    for (const p of v.pillows) {
      if (!p.flying || p.owner === me || this.seen.has(p)) continue;
      const rx = me.x - p.x;
      const ry = me.y - p.y;
      const vv = p.vx * p.vx + p.vy * p.vy;
      const ts = (rx * p.vx + ry * p.vy) / vv;
      if (ts <= 0 || ts > 0.5) continue;
      const missX = rx - p.vx * ts;
      const missY = (ry - p.vy * ts) * 1.4;
      if (Math.hypot(missX, missY) > 80) continue;
      this.seen.add(p);
      const chance = this.style.dodge * (0.45 + skill * 0.6);
      if (Math.random() > chance) continue;
      const len = Math.sqrt(vv);
      let px = -p.vy / len;
      let py = p.vx / len;
      if (px * missX + py * missY < 0) {
        px = -px;
        py = -py;
      }
      this.dodge = { x: px, y: py };
      this.dodgeUntil = t + 260 + Math.random() * 120;
    }
    if (t < this.dodgeUntil) {
      mx = this.dodge.x * 2;
      my = this.dodge.y * 2;
    }

    if (t - this.last.at > 700) {
      const moved = Math.hypot(me.x - this.last.x, me.y - this.last.y);
      if (moved < 18 && Math.hypot(mx, my) > 0.4) this.wander = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, until: t + 600 };
      this.last = { x: me.x, y: me.y, at: t };
    }
    if (t < this.wander.until) {
      mx += this.wander.x * 1.5;
      my += this.wander.y * 1.5;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    const pace = 0.82 + skill * 0.18;
    mx *= pace;
    my *= pace;

    let angle: number | null = null;
    let aimed: Fighter | null = null;
    if (tg && me.canThrow(t) && t >= this.hesitateUntil) {
      let victim: Fighter | null = tg;
      if (tg.isPlayer && t < v.playerSafeUntil) {
        victim = v.fighters.find((o) => o !== me && o.alive && !o.isPlayer && Math.hypot(o.x - me.x, o.y - me.y) < PILLOW.range * 0.8) ?? null;
      }
      const dist = victim ? Math.hypot(victim.x - me.x, victim.y - me.y) : Infinity;
      const reach = PILLOW.range * 0.92;
      const clear = victim ? !v.room.lineBlocked(me.x, me.y - 60, victim.x, victim.y - 60) : false;
      const keen = this.retreating ? 0.35 : 1;
      if (victim && dist < reach && clear && Math.random() < keen) {
        const flight = dist / PILLOW.speed;
        const lead = this.style.lead * (0.35 + skill * 0.65);
        const px = victim.x + victim.vx * flight * lead;
        const py = victim.y + victim.vy * flight * lead;
        const ease = 1 - v.warm;
        const spread = victim.isPlayer ? ((1 - skill) * 0.3 + 0.05) * (1 + ease * 0.35) : (1 - skill) * 0.24 + 0.035;
        angle = Math.atan2((py - me.y) / 0.86, px - me.x) + Phaser.Math.FloatBetween(-spread, spread);
        aimed = victim;
        const pause = Phaser.Math.Between(380, 1000) * (1.25 - skill * 0.6 - v.heat * 0.35) * (victim.isPlayer ? 1 + ease * 0.6 : 1);
        this.hesitateUntil = t + me.stats.cooldown + Math.max(60, pause);
      } else {
        this.hesitateUntil = t + 160;
      }
    }
    void dt;
    return { mx, my, angle, target: aimed };
  }
}
