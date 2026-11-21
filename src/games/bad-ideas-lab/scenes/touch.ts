import type { Poly, Vec } from "../geometry";
import { pointInPoly } from "../geometry";

export const TOUCH = { slop: 26, drag: 10, lift: 34, settle: 2, liftMs: 70, steadyMs: 90, jitter: 6, trail: 16 };

export const MOUSE = { drag: 14, trayDrag: 24, trayLift: 80 };

function segmentDistance(p: Vec, a: Vec, b: Vec) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

export function distanceToPoly(p: Vec, poly: Poly) {
  if (pointInPoly(p, poly)) return 0;
  let best = Infinity;
  for (let i = 0; i < poly.length; i += 1) best = Math.min(best, segmentDistance(p, poly[i], poly[(i + 1) % poly.length]));
  return best;
}

export function halfHeight(poly: Poly) {
  const ys = poly.map((p) => p.y);
  return (Math.max(...ys) - Math.min(...ys)) / 2;
}
