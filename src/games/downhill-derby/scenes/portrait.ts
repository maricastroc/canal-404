import type { Frame } from "../layout";
import type { DownhillSim } from "../sim/sim";

export type Cam = { x: number; y: number; zoom: number; shake: number; dip: number; dipVel: number };

export type Landing = ReturnType<DownhillSim["predictLanding"]>;

export const PORTRAIT = {
  cart: 230,
  slow: 96,
  fast: 66,
  ground: 60,
  air: 40,
  grid: 46,
  minView: 860,
  maxView: 2300,
  lead: { slow: 0.4, fast: 0.16 },
  road: 0.6,
  head: 250,
  foot: 40,
};

export type PortraitHost = {
  frame: Frame;
  hudBottom: number;
  bottomInset: number;
  phase: "countdown" | "race" | "done";
  sim: DownhillSim;
  gravity: number;
  camSpeed: number;
  predictedAir: number;
  grid: { min: number; max: number };
  awning: boolean;
  rivals: number[];
  groundBelow: (x: number) => number;
  interest: (x: number, reach: number) => number | null;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

export function zoomFor(frame: Frame, cartCss: number) {
  const z = (cartCss / PORTRAIT.cart) * frame.unit;
  return clamp(z, frame.view.w / PORTRAIT.maxView, frame.view.w / PORTRAIT.minView);
}

function placeVertical(h: PortraitHost, y: number, zoom: number, aheadX: number) {
  const f = h.frame;
  const view = f.view.h / zoom;
  const top = h.hudBottom / zoom;
  const usable = view - top;
  let viewTop = y - top - PORTRAIT.road * usable;
  const ahead = h.groundBelow(aheadX);
  const floor = viewTop + view - 0.08 * view - h.bottomInset / zoom;
  if (ahead > floor) viewTop += ahead - floor;
  const cap = y - PORTRAIT.head - top - 0.04 * view;
  if (viewTop > cap) viewTop = cap;
  return viewTop + view / 2;
}

export function portraitSnap(h: PortraitHost, x: number, y: number) {
  const f = h.frame;
  const lo = Math.min(h.grid.min - 240, x - 300);
  const hi = Math.max(h.grid.max + 280, x + 300);
  const zoom = Math.min(zoomFor(f, PORTRAIT.slow), Math.max(zoomFor(f, PORTRAIT.grid), f.view.w / (hi - lo)));
  const cx = (lo + hi) / 2;
  return { x: cx, y: placeVertical(h, y, zoom, cx + f.view.w / zoom / 2), zoom };
}

export function portraitTarget(h: PortraitHost, x: number, y: number, land: Landing) {
  const f = h.frame;
  const sim = h.sim;
  if (h.phase === "countdown") return portraitSnap(h, x, y);
  const air = sim.mode === "air";
  const forward = Math.max(0, air ? sim.vx : sim.v * Math.cos(sim.angle));
  const k = smooth(clamp((h.camSpeed - 500) / 1700, 0, 1));
  let zoom = zoomFor(f, PORTRAIT.slow + (PORTRAIT.fast - PORTRAIT.slow) * k);
  const lf = PORTRAIT.lead.slow + (PORTRAIT.lead.fast - PORTRAIT.lead.slow) * smooth(clamp(forward / 1700, 0, 1));
  const floorZoom = zoomFor(f, PORTRAIT.ground);
  if (h.phase === "race") {
    const it = h.interest(x, Math.max(700, forward * 0.95));
    if (it !== null) zoom = Math.min(zoom, Math.max(floorZoom, f.view.w / ((it - x + 160) / (1 - lf))));
    for (const rx of h.rivals) {
      const d = rx - x;
      if (d < -420 || d > 560) continue;
      const need = d < 0 ? (-d + 170) / lf : (d + 230) / (1 - lf);
      zoom = Math.min(zoom, Math.max(floorZoom, f.view.w / need));
    }
  }
  let span = f.view.w / zoom;
  let fx = x + (0.5 - lf) * span;
  let fy = placeVertical(h, y, zoom, fx + span / 2 - 40);
  if (h.awning && land) {
    fy = placeVertical(h, land.y + 60, zoom, fx + span / 2 - 40);
  } else if (land && h.predictedAir > 0.55) {
    const apex = sim.vy < 0 ? y - (sim.vy * sim.vy) / (2 * h.gravity) : y;
    const minX = Math.min(x, land.x) - 220;
    const maxX = Math.max(x, land.x) + 280;
    const top = Math.min(apex, y) - PORTRAIT.head - 20;
    const bottom = Math.max(land.y, y) + 90;
    const fitW = f.view.w / (maxX - minX);
    const fitH = (f.view.h - h.hudBottom - h.bottomInset - 12 * f.unit) / (bottom - top);
    zoom = Math.max(zoomFor(f, PORTRAIT.air), Math.min(zoom, fitW, fitH));
    span = f.view.w / zoom;
    fx = Math.min(Math.max(fx, (minX + maxX) / 2), x + 0.38 * span);
    const view = f.view.h / zoom;
    const hud = h.hudBottom / zoom;
    fy = (top + bottom) / 2 - hud / 2 + h.bottomInset / zoom / 2;
    const cap = y - PORTRAIT.head - hud + view / 2 - 0.03 * view;
    if (fy > cap) fy = cap;
  }
  return { x: fx, y: fy, zoom };
}

export function portraitClamp(h: PortraitHost, cam: Cam, x: number, y: number) {
  const f = h.frame;
  const z = cam.zoom;
  const halfW = f.view.w / (2 * z);
  const halfH = f.view.h / (2 * z);
  const hud = h.hudBottom / z;
  const air = h.sim.mode === "air";
  const head = PORTRAIT.head + (air ? 30 : 0);
  if (y - head < cam.y - halfH + hud) cam.y = y - head + halfH - hud;
  const floor = cam.y + halfH - h.bottomInset / z;
  if (y + PORTRAIT.foot > floor) cam.y += y + PORTRAIT.foot - floor;
  const minX = cam.x - halfW + (air ? 0.1 : 0.13) * halfW * 2;
  const maxX = cam.x - halfW + 0.6 * halfW * 2;
  if (x < minX) cam.x += x - minX;
  if (x > maxX) cam.x += x - maxX;
}
