import * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import type { NightCopy } from "../copy";
import { artKey } from "./art";
import type { Layout } from "./layout";

export const DECO_KEY = "pb-ending-deco";
export const DECO_URL = "/assets/dead-end-street/deco-worried.svg";

const INK = 0x1d1830;
const CREAM = 0xfbf5e6;
const NIGHT_SKY = 0x2a2342;
const MORNING = 0xffe3a3;
const SUN = 0xffc83d;
const PANEL_ASPECT = 1.2;
const ENDING_MS = 6800;

type Rect = { x: number; y: number; w: number; h: number };

export type Ending = { skip: () => void };

function panelRects(layout: Layout): { a: Rect; b: Rect; bottom: number } {
  const { W, H } = layout;
  const gap = 28 * layout.ui;
  const side = W / H >= 1.15;
  if (side) {
    const h = Math.min(H * 0.62, (W * 0.92 - gap) / 2 / PANEL_ASPECT);
    const w = h * PANEL_ASPECT;
    const top = (H - h) / 2 - 40 * layout.ui;
    const left = (W - (w * 2 + gap)) / 2;
    return { a: { x: left, y: top, w, h }, b: { x: left + w + gap, y: top, w, h }, bottom: top + h };
  }
  const w = Math.min(W * 0.9, ((H * 0.78 - gap) / 2) * PANEL_ASPECT);
  const h = w / PANEL_ASPECT;
  const top = (H - (h * 2 + gap)) / 2 - 30 * layout.ui;
  const left = (W - w) / 2;
  return { a: { x: left, y: top, w, h }, b: { x: left, y: top + h + gap, w, h }, bottom: top + h * 2 + gap };
}

function sprite(scene: Phaser.Scene, key: string, x: number, y: number, height: number) {
  if (!scene.textures.exists(key)) return null;
  const img = scene.add.image(x, y, key).setOrigin(0.5, 1);
  img.setDisplaySize((img.width / img.height) * height, height);
  return img;
}

function tape(scene: Phaser.Scene, x: number, y: number, w: number, label: string, font: string) {
  const h = w * 0.6;
  const g = scene.add.graphics();
  g.fillStyle(INK, 0.5);
  g.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, w * 0.06);
  g.fillStyle(0x26213a, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, w * 0.06);
  g.lineStyle(Math.max(2, w * 0.03), INK, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, w * 0.06);
  g.fillStyle(CREAM, 1);
  g.fillRect(-w * 0.4, -h * 0.4, w * 0.8, h * 0.34);
  g.fillStyle(0x4a4266, 1);
  g.fillRoundedRect(-w * 0.3, h * 0.04, w * 0.6, h * 0.3, h * 0.08);
  g.fillStyle(CREAM, 1);
  g.fillCircle(-w * 0.17, h * 0.19, h * 0.09);
  g.fillCircle(w * 0.17, h * 0.19, h * 0.09);
  const text = scene.add.text(0, -h * 0.23, label, { fontFamily: font, fontStyle: "700", fontSize: `${Math.max(8, Math.round(h * 0.17))}px`, color: "#c4352c" }).setOrigin(0.5);
  return scene.add.container(x, y, [g, text]);
}

function bubble(scene: Phaser.Scene, x: number, y: number, maxW: number, text: string, font: string, size: number, tailLeft: boolean) {
  const label = scene.add.text(0, 0, text, { fontFamily: font, fontStyle: "700", fontSize: `${Math.round(size)}px`, color: "#1d1830", align: "center", wordWrap: { width: maxW }, padding: { x: 2, y: 2 } }).setOrigin(0.5);
  const w = label.width + size * 1.2;
  const h = label.height + size * 0.7;
  const g = scene.add.graphics();
  const tx = tailLeft ? -w * 0.22 : w * 0.22;
  g.fillStyle(INK, 0.45);
  g.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, size * 0.6);
  g.fillStyle(CREAM, 1);
  g.lineStyle(Math.max(2.5, size * 0.12), INK, 1);
  g.fillTriangle(tx - size * 0.4, h / 2 - 2, tx + size * 0.4, h / 2 - 2, tx + (tailLeft ? -size * 0.5 : size * 0.5), h / 2 + size * 0.8);
  g.strokeTriangle(tx - size * 0.4, h / 2 - 2, tx + size * 0.4, h / 2 - 2, tx + (tailLeft ? -size * 0.5 : size * 0.5), h / 2 + size * 0.8);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, size * 0.6);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, size * 0.6);
  g.fillStyle(CREAM, 1);
  g.fillRect(tx - size * 0.36, h / 2 - 5, size * 0.72, 7);
  return scene.add.container(x, y, [g, label]);
}

function caption(scene: Phaser.Scene, r: Rect, text: string, font: string, size: number) {
  const label = scene.add.text(0, 0, text, { fontFamily: font, fontStyle: "700", fontSize: `${Math.round(size)}px`, color: "#1d1830", wordWrap: { width: r.w * 0.86 }, padding: { x: 2, y: 2 } }).setOrigin(0, 0.5);
  const w = label.width + size * 1.1;
  const h = label.height + size * 0.5;
  const g = scene.add.graphics();
  g.fillStyle(0xffe39a, 1);
  g.fillRect(0, -h / 2, w, h);
  g.lineStyle(Math.max(2.5, size * 0.12), INK, 1);
  g.strokeRect(0, -h / 2, w, h);
  label.setX(size * 0.55);
  return scene.add.container(r.x + size * 0.5, r.y + h / 2 + size * 0.5, [g, label]).setAngle(-1.5);
}

function frame(scene: Phaser.Scene, r: Rect, fill: number, k: number) {
  const g = scene.add.graphics();
  g.fillStyle(INK, 0.6);
  g.fillRoundedRect(r.x + 6 * k, r.y + 8 * k, r.w, r.h, 14 * k);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(r.x, r.y, r.w, r.h, 14 * k);
  return g;
}

function outline(scene: Phaser.Scene, r: Rect, k: number) {
  const g = scene.add.graphics();
  g.lineStyle(5 * k, INK, 1);
  g.strokeRoundedRect(r.x, r.y, r.w, r.h, 14 * k);
  return g;
}

function nightPanel(scene: Phaser.Scene, r: Rect, copy: NightCopy, fonts: Fonts, k: number) {
  const round = fonts.round ?? fonts.body;
  const parts: Phaser.GameObjects.GameObject[] = [frame(scene, r, NIGHT_SKY, k)];
  const stars = scene.add.graphics();
  stars.fillStyle(0xfff4c8, 0.85);
  for (let i = 0; i < 18; i += 1) stars.fillCircle(r.x + ((i * 97) % 100) / 100 * r.w, r.y + ((i * 53) % 45) / 100 * r.h, (1.4 + (i % 3)) * k);
  parts.push(stars);
  const floor = scene.add.graphics();
  floor.fillStyle(0x4a3a5c, 1);
  floor.fillRect(r.x, r.y + r.h * 0.72, r.w, r.h * 0.28);
  floor.fillStyle(0x5a4870, 1);
  for (let i = 0; i < 5; i += 1) floor.fillRect(r.x, r.y + r.h * (0.76 + i * 0.05), r.w, 2 * k);
  parts.push(floor);
  const moon = scene.add.graphics();
  moon.fillStyle(0xfff4c8, 1);
  moon.fillCircle(r.x + r.w * 0.82, r.y + r.h * 0.22, r.h * 0.08);
  moon.fillStyle(NIGHT_SKY, 1);
  moon.fillCircle(r.x + r.w * 0.8 + r.h * 0.035, r.y + r.h * 0.2, r.h * 0.07);
  parts.push(moon);
  const bed = sprite(scene, artKey("bed"), r.x + r.w * 0.7, r.y + r.h * 0.93, r.h * 0.62);
  if (bed) parts.push(bed);
  const bruno = sprite(scene, artKey("bruno-front-relief"), r.x + r.w * 0.33, r.y + r.h * 0.95, r.h * 0.68);
  if (bruno) parts.push(bruno);
  parts.push(tape(scene, r.x + r.w * 0.47, r.y + r.h * 0.66, r.h * 0.2, copy.ending.label, round));
  const size = Math.max(13, r.h * 0.065);
  parts.push(caption(scene, r, copy.ending.night, round, size));
  parts.push(outline(scene, r, k));
  return scene.add.container(0, 0, parts);
}

function morningPanel(scene: Phaser.Scene, r: Rect, copy: NightCopy, fonts: Fonts, k: number) {
  const round = fonts.round ?? fonts.body;
  const parts: Phaser.GameObjects.GameObject[] = [frame(scene, r, MORNING, k)];
  const sun = scene.add.graphics();
  sun.fillStyle(SUN, 1);
  sun.fillCircle(r.x + r.w * 0.86, r.y + r.h * 0.2, r.h * 0.09);
  sun.lineStyle(3 * k, 0xf0a020, 1);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    sun.lineBetween(r.x + r.w * 0.86 + Math.cos(a) * r.h * 0.12, r.y + r.h * 0.2 + Math.sin(a) * r.h * 0.12, r.x + r.w * 0.86 + Math.cos(a) * r.h * 0.16, r.y + r.h * 0.2 + Math.sin(a) * r.h * 0.16);
  }
  parts.push(sun);
  const ground = scene.add.graphics();
  ground.fillStyle(0x8fd17a, 1);
  ground.fillRect(r.x, r.y + r.h * 0.78, r.w, r.h * 0.22);
  ground.fillStyle(0x7cc066, 1);
  ground.fillRect(r.x, r.y + r.h * 0.78, r.w, 4 * k);
  parts.push(ground);
  const deco = sprite(scene, DECO_KEY, r.x + r.w * 0.28, r.y + r.h * 0.96, r.h * 0.54);
  if (deco) parts.push(deco);
  const bruno = sprite(scene, artKey("bruno-front-happy"), r.x + r.w * 0.7, r.y + r.h * 0.96, r.h * 0.57);
  if (bruno) parts.push(bruno);
  parts.push(tape(scene, r.x + r.w * 0.8, r.y + r.h * 0.66, r.h * 0.15, copy.ending.label, round));
  const size = Math.max(13, r.h * 0.065);
  parts.push(caption(scene, r, copy.ending.morning, round, size));
  parts.push(outline(scene, r, k));
  return scene.add.container(0, 0, parts);
}

export function playEnding(scene: Phaser.Scene, layout: Layout, fonts: Fonts, copy: NightCopy, opts: { reducedMotion: boolean; touch: boolean; onDone: () => void }): Ending {
  const k = layout.ui;
  const round = fonts.round ?? fonts.body;
  const { a, b, bottom } = panelRects(layout);
  const root = scene.add.container(0, 0).setDepth(200);
  const shade = scene.add.rectangle(0, 0, layout.W, layout.H, 0x0d0a1c, 0.82).setOrigin(0).setAlpha(0).setInteractive();
  root.add(shade);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    opts.onDone();
  };
  shade.on("pointerup", finish);
  const enter = (obj: Phaser.GameObjects.Container, delay: number, from = 0.92) => {
    obj.setAlpha(0);
    if (!opts.reducedMotion) obj.setScale(from);
    scene.tweens.add({ targets: obj, alpha: 1, scale: 1, delay, duration: opts.reducedMotion ? 300 : 360, ease: opts.reducedMotion ? "Linear" : "Back.easeOut" });
  };
  scene.tweens.add({ targets: shade, alpha: 1, duration: 320 });
  const night = nightPanel(scene, a, copy, fonts, k);
  const morning = morningPanel(scene, b, copy, fonts, k);
  for (const [panel, r] of [[night, a], [morning, b]] as const) {
    panel.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    panel.list.forEach((child) => {
      const c = child as unknown as { x: number; y: number };
      c.x -= r.x + r.w / 2;
      c.y -= r.y + r.h / 2;
    });
  }
  root.add([night, morning]);
  enter(night, 250);
  enter(morning, 2100);
  const size = Math.max(12, b.h * 0.055);
  const deco = bubble(scene, b.x + b.w * 0.27, b.y + b.h * 0.3, b.w * 0.34, copy.ending.deco, round, size, true);
  const bruno = bubble(scene, b.x + b.w * 0.71, b.y + b.h * 0.3, b.w * 0.34, copy.ending.bruno, round, size, false);
  root.add([deco, bruno]);
  enter(deco, 2700, 0.6);
  enter(bruno, 3500, 0.6);
  const titleSize = Math.max(26, Math.min(layout.W, layout.H) * 0.06);
  const title = scene.add.text(layout.W / 2, bottom + (layout.H - bottom) * 0.4, copy.ending.end.toUpperCase(), { fontFamily: fonts.display, fontSize: `${Math.round(titleSize)}px`, color: "#ffe39a", stroke: "#1d1830", strokeThickness: Math.max(4, titleSize * 0.14), padding: { x: 6, y: 6 } }).setOrigin(0.5);
  const hint = scene.add.text(layout.W / 2, title.y + titleSize * 0.95, opts.touch ? copy.ending.tap : copy.ending.key, { fontFamily: round, fontStyle: "600", fontSize: `${Math.round(Math.max(12, titleSize * 0.38))}px`, color: "#d9ccff", padding: { x: 2, y: 2 } }).setOrigin(0.5);
  const tail = scene.add.container(0, 0, [title, hint]);
  root.add(tail);
  enter(tail, 4200, 1);
  scene.time.delayedCall(ENDING_MS, finish);
  return { skip: finish };
}
