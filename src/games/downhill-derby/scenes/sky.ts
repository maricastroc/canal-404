import * as Phaser from "phaser";
import type { CourseId } from "../sim/course";
import { H, W } from "../layout";

type Sun = { x: number; y: number; r: number; color: number; halo?: { r: number; color: number; alpha: number } };

export type Sky = {
  stops?: number[];
  span?: number;
  sun: Sun;
  clouds?: number;
  layers?: number;
  grass?: number;
  wash?: { color: number; alpha: number };
};

const BANDS = 16;

export const SKIES: Record<CourseId, Sky> = {
  arlindo: {
    stops: [0x8ccbef, 0xf3d8e2, 0xffd497],
    span: 0.3,
    sun: { x: 520, y: 170, r: 90, color: 0xffdf86, halo: { r: 210, color: 0xfff0c2, alpha: 0.55 } },
    clouds: 0xffe0d4,
    layers: 0xffe6c8,
    grass: 0xfff0c2,
    wash: { color: 0xffc97a, alpha: 0.07 },
  },
  feira: {
    stops: [0x37a2ec, 0x74c4f3, 0xaee2fa],
    span: 0.4,
    sun: { x: 1120, y: 120, r: 84, color: 0xfffbe6, halo: { r: 150, color: 0xfff4b0, alpha: 0.5 } },
  },
  antena: {
    stops: [0x8f7ad8, 0xffb48a],
    sun: { x: 1380, y: 560, r: 116, color: 0xff8a52, halo: { r: 170, color: 0xffd2a0, alpha: 0.45 } },
    clouds: 0xffc6c0,
    layers: 0xffc9a8,
    grass: 0xffd6b0,
    wash: { color: 0xff7a3d, alpha: 0.08 },
  },
};

export function paintSky(scene: Phaser.Scene, sky: Sky) {
  const stops = sky.stops;
  if (!stops) return null;
  const g = scene.add.graphics();
  const colors = stops.map((c) => Phaser.Display.Color.ValueToColor(c));
  const band = ((sky.span ?? 1) * H) / BANDS;
  for (let k = 0; k < BANDS; k += 1) {
    const t = (k / (BANDS - 1)) * (colors.length - 1);
    const i = Math.min(Math.floor(t), colors.length - 2);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(colors[i], colors[i + 1], 1, t - i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, k * band, W, k === BANDS - 1 ? H : band + 2);
  }
  return g;
}

export function paintSun(scene: Phaser.Scene, sun: Sun) {
  const g = scene.add.graphics();
  if (sun.halo) {
    g.fillStyle(sun.halo.color, sun.halo.alpha);
    g.fillCircle(sun.x, sun.y, sun.halo.r);
  }
  g.fillStyle(sun.color, 1);
  g.fillCircle(sun.x, sun.y, sun.r);
  return g;
}
