import * as Phaser from "phaser";
import { H, W } from "../config";
import type { Vec } from "../geometry";
import { FULL_FRAME, type Frame } from "../layout";
import type { Rect } from "../levels";

export type Pose = { x: number; y: number; zoom: number };

export const CAMERA = { followMs: 180, edge: 44, edgeSpeed: 0.6, friction: 220, minFling: 0.05, settle: 0.5, center: 0.24 };

type Anim = { from: Pose; to: Pose; t: number; ms: number };

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export class LabCamera {
  private frame: Frame = FULL_FRAME;
  private anim: Anim | null = null;
  private fling: { vx: number; vy: number } | null = null;
  private quietUntil = 0;
  base: Pose = { x: W / 2, y: H / 2, zoom: 1 };

  constructor(
    private cam: Phaser.Cameras.Scene2D.Camera,
    private reduced: boolean,
  ) {}

  get free() {
    return this.frame.kind === "tall";
  }

  get zoom() {
    return this.cam.zoom;
  }

  get pose(): Pose {
    const c = this.cam;
    return { x: c.scrollX + c.width / 2, y: c.scrollY + c.height / 2, zoom: c.zoom };
  }

  apply(frame: Frame, keep: boolean) {
    const before = this.pose;
    const wasFree = this.free;
    this.frame = frame;
    this.anim = null;
    this.fling = null;
    const c = this.cam;
    if (!this.free) {
      c.setViewport(0, 0, frame.width, frame.height);
      c.setZoom(1);
      c.setScroll(frame.scrollX, frame.scrollY);
      this.base = this.pose;
      return;
    }
    const st = frame.stage;
    c.setViewport(st.x, st.y, st.w, st.h);
    this.base = this.clamp({ x: frame.view.focus.x, y: frame.view.focus.y, zoom: frame.view.zoom });
    this.set(keep && wasFree ? { x: before.x, y: before.y, zoom: frame.view.zoom } : this.base);
  }

  overviewPose(): Pose {
    const v = this.frame.view.content;
    return this.clamp({ x: v.x + v.w / 2, y: v.y + v.h / 2, zoom: this.frame.view.min });
  }

  isOverview() {
    return this.free && this.cam.zoom <= this.frame.view.min * 1.03;
  }

  isAway() {
    if (!this.free) return false;
    const p = this.pose;
    const b = this.base;
    return Math.abs(p.zoom - b.zoom) / b.zoom > 0.04 || Math.abs(p.x - b.x) > 60 || Math.abs(p.y - b.y) > 60;
  }

  visible(): Rect {
    const c = this.cam;
    const w = c.width / c.zoom;
    const h = c.height / c.zoom;
    const p = this.pose;
    return { x: p.x - w / 2, y: p.y - h / 2, w, h };
  }

  toWorld(sx: number, sy: number): Vec {
    const c = this.cam;
    return { x: c.scrollX + c.width / 2 + (sx - c.x - c.width / 2) / c.zoom, y: c.scrollY + c.height / 2 + (sy - c.y - c.height / 2) / c.zoom };
  }

  toScreen(wx: number, wy: number): Vec {
    const c = this.cam;
    return { x: c.x + c.width / 2 + (wx - c.scrollX - c.width / 2) * c.zoom, y: c.y + c.height / 2 + (wy - c.scrollY - c.height / 2) * c.zoom };
  }

  inStage(sx: number, sy: number) {
    const st = this.frame.stage;
    return sx >= st.x && sx <= st.x + st.w && sy >= st.y && sy <= st.y + st.h;
  }

  clamp(p: Pose): Pose {
    const v = this.frame.view;
    const zoom = Phaser.Math.Clamp(p.zoom, v.min, v.max);
    const c = this.cam;
    const hw = c.width / zoom / 2;
    const hh = c.height / zoom / 2;
    const x = hw * 2 >= W ? W / 2 : Phaser.Math.Clamp(p.x, hw, W - hw);
    const y = hh * 2 >= H ? Math.min(H / 2, v.content.y + v.content.h / 2) : Phaser.Math.Clamp(p.y, hh, H - hh);
    return { x, y, zoom };
  }

  set(p: Pose) {
    const q = this.free ? this.clamp(p) : p;
    const c = this.cam;
    c.setZoom(q.zoom);
    c.setScroll(q.x - c.width / 2, q.y - c.height / 2);
  }

  stop() {
    this.anim = null;
    this.fling = null;
  }

  touched(now: number) {
    this.stop();
    this.quietUntil = now + 1500;
  }

  animateTo(p: Pose, ms = 520) {
    this.fling = null;
    const to = this.clamp(p);
    if (this.reduced || ms <= 0) {
      this.anim = null;
      this.set(to);
      return;
    }
    this.anim = { from: this.pose, to, t: 0, ms };
  }

  panBy(dx: number, dy: number) {
    const p = this.pose;
    this.set({ x: p.x - dx / p.zoom, y: p.y - dy / p.zoom, zoom: p.zoom });
  }

  zoomAt(zoom: number, sx: number, sy: number, anchor = this.toWorld(sx, sy)) {
    const c = this.cam;
    const z = Phaser.Math.Clamp(zoom, this.frame.view.min, this.frame.view.max);
    this.set({ x: anchor.x - (sx - c.x - c.width / 2) / z, y: anchor.y - (sy - c.y - c.height / 2) / z, zoom: z });
  }

  flingWith(vx: number, vy: number) {
    if (this.reduced || Math.hypot(vx, vy) < CAMERA.minFling * this.frame.unit) return;
    this.fling = { vx, vy };
  }

  edgeScroll(sx: number, delta: number) {
    if (!this.free) return false;
    const st = this.frame.stage;
    const edge = CAMERA.edge * this.frame.unit;
    let dir = 0;
    if (sx < st.x + edge) dir = (st.x + edge - sx) / edge;
    else if (sx > st.x + st.w - edge) dir = -(sx - (st.x + st.w - edge)) / edge;
    if (!dir) return false;
    const before = this.pose.x;
    this.panBy(Phaser.Math.Clamp(dir, -1, 1) * CAMERA.edgeSpeed * this.frame.unit * delta, 0);
    return this.pose.x !== before;
  }

  update(delta: number, now: number, follow: Vec | null, hold: boolean) {
    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + delta / a.ms);
      const e = ease(a.t);
      this.set({ x: a.from.x + (a.to.x - a.from.x) * e, y: a.from.y + (a.to.y - a.from.y) * e, zoom: a.from.zoom + (a.to.zoom - a.from.zoom) * e });
      if (a.t >= 1) this.anim = null;
      return true;
    }
    if (this.fling) {
      const f = this.fling;
      this.panBy(f.vx * delta, f.vy * delta);
      const decay = Math.exp(-delta / CAMERA.friction);
      f.vx *= decay;
      f.vy *= decay;
      if (Math.hypot(f.vx, f.vy) < CAMERA.minFling * 0.2 * this.frame.unit) this.fling = null;
      return true;
    }
    if (hold) return false;
    return this.free ? this.followFree(delta, now, follow) : this.followFixed(delta, follow);
  }

  private followFree(delta: number, now: number, follow: Vec | null) {
    if (!follow || now < this.quietUntil || this.reduced) return false;
    const view = this.visible();
    const mx = view.w * CAMERA.center;
    const my = view.h * CAMERA.center;
    const p = this.pose;
    let tx = p.x;
    let ty = p.y;
    if (follow.x < view.x + mx) tx -= view.x + mx - follow.x;
    if (follow.x > view.x + view.w - mx) tx += follow.x - (view.x + view.w - mx);
    if (follow.y < view.y + my) ty -= view.y + my - follow.y;
    if (follow.y > view.y + view.h - my) ty += follow.y - (view.y + view.h - my);
    if (tx === p.x && ty === p.y) return false;
    const k = Math.min(1, delta / CAMERA.followMs);
    this.set({ x: p.x + (tx - p.x) * k, y: p.y + (ty - p.y) * k, zoom: p.zoom });
    return true;
  }

  private followFixed(delta: number, follow: Vec | null) {
    const f = this.frame;
    const cam = this.cam;
    let tx = f.scrollX;
    let ty = f.scrollY;
    if (follow && !this.reduced) {
      const mx = f.stage.w * 0.14;
      const my = f.stage.h * 0.14;
      const left = f.stage.x + tx;
      const top = f.stage.y + ty;
      if (follow.x < left + mx) tx -= left + mx - follow.x;
      if (follow.x > left + f.stage.w - mx) tx += follow.x - (left + f.stage.w - mx);
      if (follow.y < top + my) ty -= top + my - follow.y;
      if (follow.y > top + f.stage.h - my) ty += follow.y - (top + f.stage.h - my);
      tx = Phaser.Math.Clamp(tx, Math.min(f.scrollX, -f.stage.x), Math.max(f.scrollX, W - f.stage.x - f.stage.w));
      ty = Phaser.Math.Clamp(ty, Math.min(f.scrollY, -f.stage.y), Math.max(f.scrollY, H - f.stage.y - f.stage.h));
    }
    if (cam.scrollX === tx && cam.scrollY === ty) return false;
    const k = Math.min(1, delta / CAMERA.followMs);
    const nx = Math.abs(tx - cam.scrollX) < CAMERA.settle ? tx : cam.scrollX + (tx - cam.scrollX) * k;
    const ny = Math.abs(ty - cam.scrollY) < CAMERA.settle ? ty : cam.scrollY + (ty - cam.scrollY) * k;
    cam.setScroll(nx, ny);
    return true;
  }
}
