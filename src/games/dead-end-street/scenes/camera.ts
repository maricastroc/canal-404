import * as Phaser from "phaser";
import { W } from "../config";
import { FULL_FRAME, TALL, type Frame, type Rect } from "../layout";

export type Pose = { x: number; y: number; zoom: number };

export type Vec = { x: number; y: number };

export type CameraMode = "auto" | "free" | "overview" | "inspect";

export type Margin = { x: number; top: number };

export const CAM = {
  sky: -1700,
  floor: 1090,
  maxZoom: 1.8,
  hold: 0.86,
  aim: { zoom: 0.74, margin: { x: 0.07, top: 0.1 } },
  flight: { zoom: 0.72, margin: { x: 0.16, top: 0.14 }, lead: 22 },
  action: { zoom: 0.8, margin: { x: 0.2, top: 0.18 } },
};

type Anim = { from: Pose; to: Pose; t: number; ms: number; done?: () => void };

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export class StreetCamera {
  private frame: Frame = FULL_FRAME;
  private anim: Anim | null = null;
  private bounds: Rect = { x: 0, y: 0, w: W, h: TALL.band.bottom };
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

  get navigating() {
    return this.mode === "overview" || this.mode === "inspect";
  }

  setBounds(rect: Rect) {
    this.bounds = rect;
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
    const floor = zoom < f.zoom * 0.6 ? CAM.floor + 600 : CAM.floor;
    const y = Phaser.Math.Clamp(p.y, CAM.sky + h / 2, Math.max(CAM.sky + h / 2, floor - h / 2));
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
    const b = this.bounds;
    const zoom = Math.max(this.frame.overview, Math.min(this.cam.width / b.w, this.frame.zoom));
    const { h } = this.size(zoom);
    const clearance = (56 * this.frame.unit) / zoom;
    return this.clamp({ x: b.x + b.w / 2, y: TALL.band.bottom + clearance - h / 2, zoom });
  }

  inspectPose(at: Vec): Pose {
    const zoom = this.frame.zoom;
    return this.clamp({ x: at.x, y: this.restY(zoom), zoom });
  }

  private zoomFor(pts: Vec[], m: Margin) {
    const xs = pts.map((p) => p.x);
    const top = Math.min(...pts.map((p) => p.y));
    const needW = Math.max(1, Math.max(...xs) - Math.min(...xs)) / (1 - 2 * m.x);
    const needH = Math.max(1, TALL.band.bottom - top) / (1 - m.top);
    return Math.min(this.cam.width / needW, this.cam.height / needH);
  }

  fit(points: Vec[], must: number, minScale: number, m: Margin): Pose {
    const play = this.frame.zoom;
    const range: [number, number] = [play * minScale, play];
    let chosen = points.slice(0, must);
    let zoom = play;
    for (let n = points.length; n >= must; n -= 1) {
      const pts = points.slice(0, n);
      const z = this.zoomFor(pts, m);
      if (z >= range[0] || n === must) {
        chosen = pts;
        zoom = Phaser.Math.Clamp(z, range[0], range[1]);
        break;
      }
    }
    const cur = this.pose;
    if (cur.zoom >= range[0] - 1e-6 && cur.zoom <= zoom * 1.0001 && cur.zoom >= zoom * CAM.hold) zoom = cur.zoom;
    const { w, h } = this.size(zoom);
    const xs = chosen.map((p) => p.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const lo = maxX - (1 - m.x) * w;
    const hi = minX - m.x * w;
    const first = chosen[0];
    const left = lo <= hi ? Phaser.Math.Clamp(cur.x - w / 2, lo, hi) : Phaser.Math.Clamp(cur.x - w / 2, first.x - (1 - m.x) * w, first.x - m.x * w);
    const restTop = TALL.band.bottom - h;
    const top = Math.min(restTop, Math.min(...chosen.map((p) => p.y)) - m.top * h);
    return this.clamp({ x: left + w / 2, y: top + h / 2, zoom });
  }

  frameAim(points: Vec[]) {
    return this.fit(points, Math.min(2, points.length), CAM.aim.zoom, CAM.aim.margin);
  }

  frameFlight(at: Vec, vel: Vec): Pose {
    const view = this.visible();
    const f = CAM.flight;
    const ahead = { x: at.x + vel.x * f.lead, y: Math.min(at.y, at.y + vel.y * f.lead) };
    const next = this.fit([at, ahead], 1, f.zoom, f.margin);
    if (at.x < view.x && vel.x > 0.5) next.x = Math.max(next.x, this.pose.x);
    return next;
  }

  frameAction(points: Vec[]) {
    return this.fit(points, 1, CAM.action.zoom, CAM.action.margin);
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

  chase(target: Pose, delta: number, ms: number, zoomMs = 650) {
    const p = this.pose;
    const k = this.reduced ? 1 : 1 - Math.exp(-delta / ms);
    const kz = this.reduced ? 1 : 1 - Math.exp(-delta / Math.max(ms, zoomMs));
    const settle = (from: number, to: number, eps: number, f: number) => (Math.abs(to - from) < eps ? to : from + (to - from) * f);
    const zoom = settle(p.zoom, target.zoom, 0.0005, kz);
    const { w, h } = this.size(zoom);
    const tw = this.size(target.zoom);
    const left = settle(p.x - this.size(p.zoom).w / 2, target.x - tw.w / 2, 0.3, k);
    const bottom = settle(p.y + this.size(p.zoom).h / 2, target.y + tw.h / 2, 0.3, k);
    this.set({ x: left + w / 2, y: bottom - h / 2, zoom });
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
