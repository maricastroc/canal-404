import * as Phaser from "phaser";
import { FLOOR_Y, JUMP_V, GRAVITY } from "../config";
import type { Frame } from "../layout";

export type Focus = { x: number; pad: number; always?: boolean; fight?: boolean };
export type High = { x0: number; x1: number; y: number };
export type CamHero = { x: number; top: number; feet: number; facing: number; vy: number; grounded: boolean; scale: number };
export type CamBounds = { left: number; right: number };

const JUMP_RISE = (JUMP_V * JUMP_V) / (2 * GRAVITY);

export const FRAME_CAM = {
  look: 0.2,
  edge: 0.22,
  heroBack: 120,
  heroFront: 250,
  fightMargin: 24,
  grow: { tall: 1.06, band: 1, full: 1 },
  fightGrow: { tall: 1.2, band: 1, full: 1 },
  arenaBase: { tall: 1.12, band: 1, full: 1 },
  arenaGrow: { tall: 1.3, band: 1, full: 1 },
  ahead: 1000,
  behind: 620,
  highAhead: 560,
  highBehind: 160,
  highReach: JUMP_RISE + 140,
  follow: 9,
  pan: 2.4,
  fightPan: 3.2,
  zoomOut: 1.3,
  zoomIn: 0.7,
  zoomHold: 0.9,
  headroom: 0.56,
  headMargin: 46,
  feetMargin: 34,
  highMargin: 34,
  ceilingMin: -900,
};

const ease = (rate: number, dt: number) => 1 - Math.exp(-dt * rate);

export class FrameCamera {
  private followX = 0;
  private offset = 0;
  private viewW = 0;
  private lift = 0;
  private top = 0;
  private ground = FLOOR_Y;
  private hold = 0;
  private ready = false;
  private fighting = false;

  constructor(private cam: Phaser.Cameras.Scene2D.Camera) {}

  reset() {
    this.ready = false;
  }

  get width() {
    return this.viewW;
  }

  playTop(frame: Frame) {
    return this.top + frame.hud / this.zoom(frame);
  }

  private zoom(frame: Frame) {
    return frame.width / this.viewW;
  }

  private target(frame: Frame, hero: CamHero, focus: Focus[], bounds: CamBounds, arena: boolean) {
    const base = frame.width / frame.zoom;
    const span = bounds.right - bounds.left;
    const kind = frame.kind;
    const w0 = Math.min(span, arena ? base * FRAME_CAM.arenaBase[kind] : base);
    const p = FRAME_CAM.edge;
    const back = FRAME_CAM.heroBack * hero.scale;
    const front = FRAME_CAM.heroFront * hero.scale;
    const heroLo = hero.x - (hero.facing > 0 ? back : front);
    const heroHi = hero.x + (hero.facing > 0 ? front : back);
    const fights = focus.filter((f) => f.fight);
    this.fighting = fights.length > 0;
    if (fights.length && !arena) {
      const lo = Math.min(heroLo, ...fights.map((f) => f.x - f.pad)) - FRAME_CAM.fightMargin;
      const hi = Math.max(heroHi, ...fights.map((f) => f.x + f.pad)) + FRAME_CAM.fightMargin;
      const w = Phaser.Math.Clamp(hi - lo, w0, Math.min(span, base * FRAME_CAM.fightGrow[kind]));
      const mid = (lo + hi) / 2;
      const c = hi - lo <= w ? Phaser.Math.Clamp(mid, hi - w / 2, lo + w / 2) : Phaser.Math.Clamp(mid, heroHi - w / 2, heroLo + w / 2);
      return { w, c };
    }
    const wMax = Math.min(span, base * (arena ? FRAME_CAM.arenaGrow[kind] : FRAME_CAM.grow[kind]));
    let ahead = 0;
    let behind = 0;
    for (const f of focus) {
      const dx = f.x - hero.x;
      const reach = Math.sign(dx) === hero.facing ? FRAME_CAM.ahead : FRAME_CAM.behind;
      if (!f.always && Math.abs(dx) > reach) continue;
      ahead = Math.max(ahead, dx + f.pad);
      behind = Math.max(behind, -dx + f.pad);
    }
    const w = Phaser.Math.Clamp(Math.max(w0, ahead / (1 - p), behind / (1 - p), ahead + behind), w0, wMax);
    const keep = Math.max(hero.facing > 0 ? back : front, p * w);
    const keepFront = Math.max(hero.facing > 0 ? front : back, p * w);
    const right = Math.max(hero.facing > 0 ? keepFront : keep, ahead);
    const left = Math.max(hero.facing > 0 ? keep : keepFront, behind);
    const preferred = hero.x + hero.facing * FRAME_CAM.look * w;
    const lo = hero.x + right - w / 2;
    const hi = hero.x - left + w / 2;
    const c = lo <= hi ? Phaser.Math.Clamp(preferred, lo, hi) : Phaser.Math.Clamp(hero.x + (right - left) / 2, heroHi - w / 2, heroLo + w / 2);
    return { w, c };
  }

  private widen(w: number, dt: number) {
    if (w > this.viewW + 0.5) {
      this.hold = FRAME_CAM.zoomHold;
      this.viewW += (w - this.viewW) * ease(FRAME_CAM.zoomOut, dt);
      return;
    }
    if (w < this.viewW - 0.5) {
      if (this.hold > 0) {
        this.hold -= dt;
        return;
      }
      this.viewW += (w - this.viewW) * ease(FRAME_CAM.zoomIn, dt);
    }
  }

  private wantTop(hero: CamHero, highs: High[], below: number | null, viewH: number, hud: number, maxTop: number) {
    if (hero.grounded || hero.feet > this.ground + 30) this.ground = hero.feet;
    const jumpTop = this.ground - (hero.top < hero.feet ? hero.feet - hero.top : 220) - JUMP_RISE * FRAME_CAM.headroom - hud;
    let t = Math.min(maxTop, jumpTop);
    const reach = this.ground - FRAME_CAM.highReach;
    for (const h of highs) {
      const ahead = hero.facing > 0 ? h.x0 - hero.x : hero.x - h.x1;
      const behind = hero.facing > 0 ? hero.x - h.x1 : h.x0 - hero.x;
      if (ahead > FRAME_CAM.highAhead || behind > FRAME_CAM.highBehind) continue;
      if (h.y < reach || h.y > this.ground) continue;
      t = Math.min(t, h.y - FRAME_CAM.highMargin - hud);
    }
    if (below !== null) t = Math.max(t, below + FRAME_CAM.feetMargin - viewH);
    const headMax = hero.top - FRAME_CAM.headMargin - hud;
    const feetMin = hero.feet + FRAME_CAM.feetMargin - viewH;
    t = Math.max(t, Math.min(feetMin, headMax));
    t = Math.min(t, headMax);
    t = Phaser.Math.Clamp(t, FRAME_CAM.ceilingMin, maxTop);
    return { t, urgentUp: hero.top - hud - this.top < FRAME_CAM.headMargin + 20, urgentDown: this.top + viewH - hero.feet < FRAME_CAM.feetMargin + 30 };
  }

  update(dt: number, frame: Frame, hero: CamHero, focus: Focus[], highs: High[], bounds: CamBounds, arena: boolean, below: number | null) {
    const { w, c } = this.target(frame, hero, focus, bounds, arena);
    const first = !this.ready;
    if (first) {
      this.ready = true;
      this.followX = hero.x;
      this.offset = c - hero.x;
      this.viewW = w;
      this.lift = 0;
      this.hold = 0;
      this.ground = hero.grounded ? hero.feet : FLOOR_Y;
    } else {
      this.followX += (hero.x - this.followX) * ease(FRAME_CAM.follow, dt);
      this.offset += (c - hero.x - this.offset) * ease(this.fighting ? FRAME_CAM.fightPan : FRAME_CAM.pan, dt);
      this.widen(w, dt);
    }
    const z = this.zoom(frame);
    const viewH = (frame.height - frame.deck) / z;
    const hud = frame.hud / z;
    const maxTop = this.restTop(frame);
    const want = this.wantTop(hero, highs, below, viewH, hud, maxTop);
    const lift = maxTop - want.t;
    const up = lift > this.lift;
    const rate = up ? (want.urgentUp ? 12 : 3.4) : want.urgentDown ? 10 : hero.vy > 0 ? 4 : 2.6;
    if (first || dt === 0) this.lift = Math.max(0, lift);
    else this.lift = Math.max(0, this.lift + (lift - this.lift) * ease(rate, dt));
    this.top = maxTop - this.lift;
    const half = this.viewW / 2;
    let cx = this.followX + this.offset;
    cx = bounds.right - bounds.left <= this.viewW ? (bounds.left + bounds.right) / 2 : Phaser.Math.Clamp(cx, bounds.left + half, bounds.right - half);
    this.cam.setZoom(z);
    this.cam.centerOn(cx, this.top + viewH / 2);
  }

  private restTop(frame: Frame) {
    const z = this.zoom(frame);
    return FLOOR_Y + frame.floor - (frame.height - frame.deck) / z;
  }
}
