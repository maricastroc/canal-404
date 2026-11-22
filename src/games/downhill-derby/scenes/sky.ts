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
    stops: [0x76c2ec, 0xc8e7f2, 0xffdba6],
    span: 0.42,
    sun: { x: 620, y: 380, r: 100, color: 0xffe39a, halo: { r: 180, color: 0xfff3c8, alpha: 0.6 } },
    clouds: 0xfff0e4,
    wash: { color: 0xffe9a8, alpha: 0.05 },
  },
  feira: {
    sun: { x: 1120, y: 120, r: 96, color: 0xfff1a8 },
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
