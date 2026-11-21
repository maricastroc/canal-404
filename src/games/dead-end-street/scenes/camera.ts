import * as Phaser from "phaser";
import { W } from "../config";
import { FULL_FRAME, TALL, type Frame, type Rect } from "../layout";

export type Pose = { x: number; y: number; zoom: number };

export type Vec = { x: number; y: number };

export type CameraMode = "auto" | "free" | "overview";

export const CAM = { sky: -1700, floor: 1090, maxZoom: 1.8, aim: { left: 0.08, right: 0.92, top: 0.12 }, flight: { left: 0.18, right: 0.62, top: 0.16 }, action: { left: 0.24, right: 0.76, top: 0.22 } };

type Anim = { from: Pose; to: Pose; t: number; ms: number; done?: () => void };

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export class StreetCamera {
  private frame: Frame = FULL_FRAME;
  private anim: Anim | null = null;
  mode: CameraMode = "auto";

  constructor(
    private cam: Phaser.Cameras.Scene2D.Camera,
    private reduced: boolean,
  ) {}

  get tall() {
    return this.frame.kind === "tall";
  }

  get animating() {
    return this.anim !== null;
  }

  get pose(): Pose {
    const c = this.cam;
    return { x: c.scrollX + c.width / 2, y: c.scrollY + c.height / 2, zoom: c.zoom };
  }

  get playZoom() {
    return this.frame.zoom;
  }

  cssPerWorld(zoom = this.cam.zoom) {
    return zoom / this.frame.unit;
  }

  apply(frame: Frame, keep: boolean) {
    const before = this.pose;
    const ratio = before.zoom / (this.frame.zoom || 1);
    const wasTall = this.tall;
    this.frame = frame;
    this.anim = null;
    const c = this.cam;
    if (!this.tall) {
      this.mode = "auto";
      c.setViewport(0, 0, frame.width, frame.height);
      c.setZoom(1);
      c.setScroll(0, 0);
      return;
    }
    const st = frame.stage;
    c.setViewport(st.x, st.y, st.w, st.h);
    if (keep && wasTall) {
      const zoom = this.mode === "overview" ? frame.overview : frame.zoom * ratio;
      this.set({ x: before.x, y: before.y, zoom });
      return;
    }
    this.set(this.home());
  }

  size(zoom = this.cam.zoom) {
    return { w: this.cam.width / zoom, h: this.cam.height / zoom };
  }

  restY(zoom = this.frame.zoom) {
    const { h } = this.size(zoom);
    return TALL.band.bottom - h / 2;
  }

  clamp(p: Pose): Pose {
    const f = this.frame;
    const zoom = Phaser.Math.Clamp(p.zoom, f.overview, f.zoom * CAM.maxZoom);
    const { w, h } = this.size(zoom);
    const x = w >= W ? W / 2 : Phaser.Math.Clamp(p.x, w / 2, W - w / 2);
    const y = Phaser.Math.Clamp(p.y, CAM.sky + h / 2, Math.max(CAM.sky + h / 2, CAM.floor - h / 2));
    return { x, y, zoom };
  }

  set(p: Pose) {
    const q = this.tall ? this.clamp(p) : p;
    const c = this.cam;
    c.setZoom(q.zoom);
    c.setScroll(q.x - c.width / 2, q.y - c.height / 2);
  }

  visible(): Rect {
    const p = this.pose;
    const { w, h } = this.size(p.zoom);
    return { x: p.x - w / 2, y: p.y - h / 2, w, h };
  }

  toScreen(wx: number, wy: number): Vec {
    const c = this.cam;
    return { x: c.x + c.width / 2 + (wx - c.scrollX - c.width / 2) * c.zoom, y: c.y + c.height / 2 + (wy - c.scrollY - c.height / 2) * c.zoom };
  }

  toWorld(sx: number, sy: number): Vec {
    const c = this.cam;
    return { x: c.scrollX + c.width / 2 + (sx - c.x - c.width / 2) / c.zoom, y: c.scrollY + c.height / 2 + (sy - c.y - c.height / 2) / c.zoom };
  }

  inStage(sx: number, sy: number) {
    const st = this.frame.stage;
    return sx >= st.x && sx <= st.x + st.w && sy >= st.y && sy <= st.y + st.h;
  }

  inView(wx: number, wy: number, margin = 0) {
    const v = this.visible();
    return wx >= v.x + margin && wx <= v.x + v.w - margin && wy >= v.y + margin && wy <= v.y + v.h - margin;
  }

  home(): Pose {
    const zoom = this.frame.zoom;
    const { w } = this.size(zoom);
    return this.clamp({ x: w / 2, y: this.restY(zoom), zoom });
  }

  overviewPose(): Pose {
    const zoom = this.frame.overview;
    const { h } = this.size(zoom);
    return this.clamp({ x: W / 2, y: Math.min(TALL.band.bottom + 30 - h / 2, 540), zoom });
  }

  private keep(point: Vec, band: { left: number; right: number; top: number }): Pose {
    const p = this.pose;
    const zoom = this.frame.zoom;
    const { w, h } = this.size(zoom);
    let left = p.x - w / 2;
    if (point.x < left + band.left * w) left = point.x - band.left * w;
    if (point.x > left + band.right * w) left = point.x - band.right * w;
    const restTop = this.restY(zoom) - h / 2;
    const top = Math.min(restTop, point.y - band.top * h);
    return this.clamp({ x: left + w / 2, y: top + h / 2, zoom });
  }

  frameAim(required: Vec[], optional: Vec[] = []): Pose {
    const zoom = this.frame.zoom;
    const { w, h } = this.size(zoom);
    const band = CAM.aim;
    const fits = (pts: Vec[]) => {
      const lo = Math.max(...pts.map((q) => q.x - band.right * w));
      const hi = Math.min(...pts.map((q) => q.x - band.left * w));
      return lo <= hi ? { lo, hi } : null;
    };
    let pts = [...required, ...optional];
    let range = fits(pts);
    if (!range) {
      pts = required;
      range = fits(pts);
    }
    if (!range) {
      pts = required.slice(0, 1);
      range = fits(pts)!;
    }
    const p = this.pose;
    const left = Phaser.Math.Clamp(p.x - w / 2, range.lo, range.hi);
    const restTop = this.restY(zoom) - h / 2;
    const top = Math.min(restTop, ...pts.map((q) => q.y - band.top * h));
    return this.clamp({ x: left + w / 2, y: top + h / 2, zoom });
  }

  frameFlight(at: Vec, vel: Vec): Pose {
    const view = this.visible();
    const next = this.keep(at, CAM.flight);
    if (at.x < view.x && vel.x > 0.5) next.x = Math.max(next.x, this.pose.x);
    return next;
  }

  frameAction(focus: Vec) {
    return this.keep(focus, CAM.action);
  }

  animateTo(p: Pose, ms = 600, done?: () => void) {
    const to = this.clamp(p);
    if (this.reduced || ms <= 0) {
      this.anim = null;
      this.set(to);
      done?.();
      return;
    }
    this.anim = { from: this.pose, to, t: 0, ms, done };
  }

  stop() {
    this.anim = null;
  }

  update(delta: number) {
    const a = this.anim;
    if (!a) return false;
    a.t = Math.min(1, a.t + delta / a.ms);
    const e = ease(a.t);
    this.set({ x: a.from.x + (a.to.x - a.from.x) * e, y: a.from.y + (a.to.y - a.from.y) * e, zoom: a.from.zoom + (a.to.zoom - a.from.zoom) * e });
    if (a.t >= 1) {
      this.anim = null;
      a.done?.();
    }
    return true;
  }

  chase(target: Pose, delta: number, ms: number) {
    const p = this.pose;
    const k = this.reduced ? 1 : 1 - Math.exp(-delta / ms);
    const settle = (from: number, to: number, eps: number) => (Math.abs(to - from) < eps ? to : from + (to - from) * k);
    this.set({ x: settle(p.x, target.x, 0.3), y: settle(p.y, target.y, 0.3), zoom: settle(p.zoom, target.zoom, 0.0005) });
  }

  panBy(dx: number, dy: number) {
    const p = this.pose;
    this.set({ x: p.x - dx / p.zoom, y: p.y - dy / p.zoom, zoom: p.zoom });
  }

  zoomAt(zoom: number, sx: number, sy: number, anchor = this.toWorld(sx, sy)) {
    const c = this.cam;
    const f = this.frame;
    const z = Phaser.Math.Clamp(zoom, f.overview, f.zoom * CAM.maxZoom);
    this.set({ x: anchor.x - (sx - c.x - c.width / 2) / z, y: anchor.y - (sy - c.y - c.height / 2) / z, zoom: z });
  }
}
