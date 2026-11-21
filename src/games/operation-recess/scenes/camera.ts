import * as Phaser from "phaser";
import { FLOOR_Y } from "../config";
import type { Frame } from "../layout";

export type Focus = { x: number; pad: number; always?: boolean };
export type CamHero = { x: number; top: number; facing: number; vy: number; scale: number };
export type CamBounds = { left: number; right: number };

export const FRAME_CAM = {
  look: 0.2,
  edge: 0.24,
  heroPad: 200,
  grow: { tall: 1.12, band: 1, full: 1 },
  arenaBase: { tall: 1.1, band: 1, full: 1 },
  arenaGrow: { tall: 1.3, band: 1, full: 1 },
  ahead: 1000,
  behind: 620,
  follow: 9,
  pan: 2.4,
  zoomOut: 1.6,
  zoomIn: 0.9,
  ceilingMin: -900,
};

const ease = (rate: number, dt: number) => 1 - Math.exp(-dt * rate);

export class FrameCamera {
  private followX = 0;
  private offset = 0;
  private viewW = 0;
  private lift = 0;
  private top = 0;
  private ready = false;

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
    const w0 = Math.min(span, arena ? base * FRAME_CAM.arenaBase[frame.kind] : base);
    const wMax = Math.min(span, base * (arena ? FRAME_CAM.arenaGrow[frame.kind] : FRAME_CAM.grow[frame.kind]));
    const p = FRAME_CAM.edge;
    const pad = FRAME_CAM.heroPad * hero.scale;
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
    const keep = Math.max(pad, p * w);
    const right = Math.max(keep, ahead);
    const left = Math.max(keep, behind);
    const preferred = hero.x + hero.facing * FRAME_CAM.look * w;
    const lo = hero.x + right - w / 2;
    const hi = hero.x - left + w / 2;
    const c = lo <= hi ? Phaser.Math.Clamp(preferred, lo, hi) : Phaser.Math.Clamp(hero.x + (right - left) / 2, hero.x + keep - w / 2, hero.x - keep + w / 2);
    return { w, c };
  }

  update(dt: number, frame: Frame, hero: CamHero, focus: Focus[], bounds: CamBounds, arena: boolean, below: boolean) {
    const { w, c } = this.target(frame, hero, focus, bounds, arena);
    if (!this.ready) {
      this.ready = true;
      this.followX = hero.x;
      this.offset = c - hero.x;
      this.viewW = w;
      this.lift = 0;
    } else {
      this.followX += (hero.x - this.followX) * ease(FRAME_CAM.follow, dt);
      this.offset += (c - hero.x - this.offset) * ease(FRAME_CAM.pan, dt);
      this.viewW += (w - this.viewW) * ease(w > this.viewW ? FRAME_CAM.zoomOut : FRAME_CAM.zoomIn, dt);
    }
    const z = this.zoom(frame);
    const viewH = (frame.height - frame.deck) / z;
    const hud = frame.hud / z;
    const maxTop = this.restTop(frame);
    const want = Phaser.Math.Clamp(Math.min(maxTop, hero.top - (below ? 60 : 130) - hud), FRAME_CAM.ceilingMin, maxTop);
    const lift = maxTop - want;
    const rate = lift > this.lift ? (hero.top - hud - (maxTop - this.lift) < 50 ? 14 : 6) : hero.vy > 0 ? 4.5 : 3;
    this.lift = Math.max(0, this.lift + (lift - this.lift) * ease(rate, dt));
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
