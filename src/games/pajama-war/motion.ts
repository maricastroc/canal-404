import { ACCEL } from "./config";
import type { Body } from "./nav";

export function drive(b: Body, mx: number, my: number, speed: number, dt: number) {
  const len = Math.hypot(mx, my);
  const tx = len > 0.01 ? (mx / Math.max(1, len)) * speed : 0;
  const ty = len > 0.01 ? (my / Math.max(1, len)) * speed * 0.86 : 0;
  const step = ACCEL * dt;
  b.vx += Math.min(step, Math.max(-step, tx - b.vx));
  b.vy += Math.min(step, Math.max(-step, ty - b.vy));
}

export function coast(b: Body, dt: number) {
  const f = Math.exp(-dt * 7);
  b.vx *= f;
  b.vy *= f;
}

export function move(b: Body, dt: number) {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
}
