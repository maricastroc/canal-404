import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import { COPY, type PajamaCopy } from "../copy";
import { cartoonText, INK_HEX, type Fonts } from "../../kit/ui";
import type { Prop, Room } from "./room";

type Img = Phaser.GameObjects.Image;
type Sway = { prop: Prop; amp: number; period: number; phase: number; quietSince: number; kind: "angle" | "breath" };
type Fly = { core: Img; halo: Img; x: number; y: number; vx: number; vy: number; heading: number; speed: number; blink: number; duty: number; phase: number; f1: number; f2: number };
type Note = { img: Img; born: number; x: number; drift: number };
type Lamp = { x: number; y: number; imgs: Img[]; tint: number; at: number };
type Puff = { img: Img; born: number; x: number; drift: number };
type Mote = { img: Img; x: number; y: number; vx: number; vy: number; phase: number };
type Pool = { img: Img; base: number; phase: number };

const TV = { x0: 238, y0: 299, x1: 396, y1: 411 };
const BEAM = { x: 960, top: 178, h: 560, w0: 150, w1: 330 };
const BULB_DROP = 402;
const BARS = [0xfbf5e6, 0xffc83d, 0x63d6c1, 0x8fd16a, 0xf06ba8, 0xef4f43, 0x5cb9f0];
const SHOW_MS = 6200;
const STATIC_MS = 260;
const ROLL_MS = 5600;
const WARM = 0xffc46b;
const TV_LIGHT = [0xd6ceff, 0x7d94ff, 0x8ad4ff];
const FLICKER_MS = 460;
const PUFF_MS = 3600;
const MOON = { x: 740, y: 100, w: 340, h: 470 };
const GLASS = { x0: 846, x1: 1044, y0: 112, y1: 306, mx: 945, my: 210, bar: 5 };
const FLOOR = { near: 356, depth: 204, skew: 0.45 };
const DOOR = { w: 500, h: 230, top: 24, near: 66, far: 214 };
const SCREEN = { ox: 140, oy: 360, x0: 30, x1: 250, y0: 40, y1: 204, ground: 186, fence: 140, span: 74, hop: 48, cycle: 3600 };

function hash(n: number) {
  const r = Math.sin(n * 12.9898 + 4.1414) * 43758.5453;
  return r - Math.floor(r);
}

function dimmed(color: number, k: number) {
  const r = Math.round(((color >> 16) & 255) * k);
  const g = Math.round(((color >> 8) & 255) * k);
  const b = Math.round((color & 255) * k);
  return (r << 16) | (g << 8) | b;
}

function onFloor(gx: number, gy: number) {
  const y = FLOOR.near + ((GLASS.y1 - gy) / (GLASS.y1 - GLASS.y0)) * FLOOR.depth;
  return { x: gx - (y - FLOOR.near) * FLOOR.skew, y };
}

function moonEdges(y: number) {
  const far = FLOOR.near + FLOOR.depth;
  const left = GLASS.x0 - ((y - GLASS.y0) / (far - GLASS.y0)) * (GLASS.x0 - onFloor(GLASS.x0, GLASS.y0).x);
  const right = y <= FLOOR.near ? GLASS.x1 : GLASS.x1 - (y - FLOOR.near) * FLOOR.skew;
  return { left, right };
}

export function makeAmbientTextures(scene: Phaser.Scene) {
  const tex = scene.textures;
  const gfx = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (tex.exists(key)) return;
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  if (!tex.exists("attic-beam")) {
    const c = tex.createCanvas("attic-beam", BEAM.w1, BEAM.h)!;
    const ctx = c.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, BEAM.h);
    grad.addColorStop(0, "rgba(255,255,255,0.55)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.22)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo((BEAM.w1 - BEAM.w0) / 2, 0);
    ctx.lineTo((BEAM.w1 + BEAM.w0) / 2, 0);
    ctx.lineTo(BEAM.w1, BEAM.h);
    ctx.lineTo(0, BEAM.h);
    ctx.closePath();
    ctx.fill();
    c.refresh();
  }
  gfx("note", 30, 40, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(10, 31, 18, 13);
    g.fillRect(15, 4, 5, 28);
    g.fillTriangle(15, 4, 28, 10, 15, 16);
    g.fillStyle(0xffc83d, 1);
    g.fillEllipse(10, 31, 11, 7);
  });
  gfx("rocket", 64, 34, (g) => {
    g.fillStyle(INK_HEX, 1);
    g.fillTriangle(6, 2, 24, 17, 6, 32);
    g.fillEllipse(32, 17, 50, 26);
    g.fillTriangle(48, 6, 64, 17, 48, 28);
    g.fillStyle(0xef4f43, 1);
    g.fillTriangle(9, 7, 22, 17, 9, 27);
    g.fillStyle(0xfbf5e6, 1);
    g.fillEllipse(32, 17, 42, 18);
    g.fillTriangle(48, 10, 59, 17, 48, 24);
    g.fillStyle(0x5cb9f0, 1);
    g.fillCircle(38, 17, 5);
  });
  gfx("sheep", 96, 72, (g) => {
    g.fillStyle(INK_HEX, 1);
    for (const x of [30, 40, 58, 68]) g.fillRoundedRect(x - 5, 46, 10, 22, 4);
    g.fillStyle(0x3a3157, 1);
    for (const x of [30, 40, 58, 68]) g.fillRoundedRect(x - 2.5, 48, 5, 18, 2);
    const puffs: [number, number, number][] = [[18, 34, 6], [26, 42, 11], [34, 34, 15], [48, 28, 17], [62, 34, 15], [70, 42, 11], [40, 46, 12], [56, 46, 12]];
    g.fillStyle(INK_HEX, 1);
    for (const [x, y, r] of puffs) g.fillCircle(x, y, r + 3);
    g.fillStyle(0xffffff, 1);
    for (const [x, y, r] of puffs) g.fillCircle(x, y, r);
    g.fillStyle(0xe6e1f5, 1);
    g.fillCircle(44, 48, 8);
    g.fillCircle(60, 46, 7);
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(80, 30, 26, 22);
    g.fillEllipse(72, 21, 14, 9);
    g.fillStyle(0x3a3157, 1);
    g.fillEllipse(80, 30, 21, 17);
    g.fillEllipse(72, 21, 10, 5.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(84, 27, 3.4);
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(85, 27, 1.8);
  });
  gfx("scanlines", 4, 4, (g) => {
    g.fillStyle(0x0b0818, 0.3);
    g.fillRect(0, 2, 4, 2);
  });
  if (!tex.exists("door-light")) {
    const c = tex.createCanvas("door-light", DOOR.w, DOOR.h)!;
    const ctx = c.getContext();
    const off = 4000;
    const cx = DOOR.w / 2;
    const fade = ctx.createLinearGradient(0, DOOR.top, 0, DOOR.h - 10);
    fade.addColorStop(0, "rgba(255,255,255,0.95)");
    fade.addColorStop(0.45, "rgba(255,255,255,0.5)");
    fade.addColorStop(1, "rgba(255,255,255,0)");
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = off;
    ctx.fillStyle = fade;
    ctx.beginPath();
    ctx.moveTo(cx - DOOR.near - off, DOOR.top);
    ctx.lineTo(cx + DOOR.near - off, DOOR.top);
    ctx.lineTo(cx + DOOR.far - off, DOOR.h - 10);
    ctx.lineTo(cx - DOOR.far - off, DOOR.h - 10);
    ctx.closePath();
    ctx.fill();
    c.refresh();
  }
  if (!tex.exists("moonlight")) {
    const c = tex.createCanvas("moonlight", MOON.w, MOON.h)!;
    const ctx = c.getContext();
    const at = (p: { x: number; y: number }) => [p.x - MOON.x, p.y - MOON.y] as const;
    const far = FLOOR.near + FLOOR.depth;
    const hull = [at({ x: GLASS.x0, y: GLASS.y0 }), at({ x: GLASS.x1, y: GLASS.y0 }), at({ x: GLASS.x1, y: FLOOR.near }), at(onFloor(GLASS.x1, GLASS.y0)), at(onFloor(GLASS.x0, GLASS.y0))];
    const shaft = ctx.createLinearGradient(0, GLASS.y0 - MOON.y, 0, far - MOON.y);
    shaft.addColorStop(0, "rgba(255,255,255,0.075)");
    shaft.addColorStop(0.55, "rgba(255,255,255,0.04)");
    shaft.addColorStop(1, "rgba(255,255,255,0.012)");
    ctx.fillStyle = shaft;
    ctx.beginPath();
    hull.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    const floor = ctx.createLinearGradient(0, FLOOR.near - MOON.y, 0, far - MOON.y);
    floor.addColorStop(0, "rgba(255,255,255,0.3)");
    floor.addColorStop(1, "rgba(255,255,255,0.1)");
    ctx.fillStyle = floor;
    const g = GLASS;
    const panes = [
      [g.x0, g.mx - g.bar, g.my + g.bar, g.y1],
      [g.mx + g.bar, g.x1, g.my + g.bar, g.y1],
      [g.x0, g.mx - g.bar, g.y0, g.my - g.bar],
      [g.mx + g.bar, g.x1, g.y0, g.my - g.bar],
    ];
    for (const [x0, x1, y0, y1] of panes) {
      const pts = [onFloor(x0, y1), onFloor(x1, y1), onFloor(x1, y0), onFloor(x0, y0)].map(at);
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    }
    c.refresh();
  }
}

class TvShow {
  private g: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private small: Phaser.GameObjects.Text;
  private rocket: Img;
  private drops: Img[] = [];
  private scan: Phaser.GameObjects.TileSprite;
  private roll: Img;
  private spill: Img;
  private wash: Img;
  private staticUntil = 0;
  private stars: [number, number][] = [];
  private show = 0;
  private shownAt = 0;

  constructor(
    scene: Phaser.Scene,
    private fonts: Fonts,
    depth: number,
    private reduced: boolean,
    private text: PajamaCopy["tv"],
    floorY: number,
  ) {
    const cx = (TV.x0 + TV.x1) / 2;
    const w = TV.x1 - TV.x0;
    const h = TV.y1 - TV.y0;
    this.g = scene.add.graphics().setDepth(depth);
    this.label = cartoonText(scene, cx, (TV.y0 + TV.y1) / 2, "404", { size: 38, color: "#ffc83d", font: fonts.display, stroke: 0.22 }).setOrigin(0.5).setDepth(depth + 0.01);
    this.small = cartoonText(scene, cx, TV.y0 + 18, "", { size: 15, color: "#fbf5e6", font: fonts.display, stroke: 0.25, shadow: false }).setOrigin(0.5).setDepth(depth + 0.01);
    this.rocket = scene.add.image(TV.x0, (TV.y0 + TV.y1) / 2, "rocket").setScale(0.62).setDepth(depth + 0.01).setVisible(false);
    for (let i = 0; i < 3; i += 1) this.drops.push(scene.add.image(TV.x0, TV.y0, "pillow").setScale(0.2).setDepth(depth + 0.01).setVisible(false));
    for (let i = 0; i < 14; i += 1) this.stars.push([TV.x0 + 8 + ((i * 53) % (w - 16)), TV.y0 + 8 + ((i * 37) % (h - 16))]);
    this.scan = scene.add.tileSprite(TV.x0, TV.y0, w, h, "scanlines").setOrigin(0, 0).setDepth(depth + 0.02).setAlpha(0.7);
    this.roll = scene.add.image(cx, TV.y0, "glow").setDisplaySize(w * 1.1, 34).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 0.03).setVisible(false);
    const glass = scene.add.graphics().setDepth(depth + 0.04);
    glass.fillStyle(0xffffff, 0.1);
    glass.fillTriangle(TV.x0 + 6, TV.y0 + 6, TV.x0 + w * 0.42, TV.y0 + 6, TV.x0 + 6, TV.y0 + h * 0.5);
    glass.fillStyle(0xffffff, 0.06);
    glass.fillTriangle(TV.x0 + w * 0.48, TV.y0 + 6, TV.x0 + w * 0.56, TV.y0 + 6, TV.x0 + 6, TV.y0 + h * 0.62);
    this.spill = scene.add.image(cx - 8, floorY + 34, "glow").setDisplaySize(470, 126).setBlendMode(Phaser.BlendModes.ADD).setDepth(24.5).setAlpha(0.15).setTint(TV_LIGHT[0]);
    this.wash = scene.add.image(cx, (TV.y0 + TV.y1) / 2 - 10, "glow").setDisplaySize(440, 330).setBlendMode(Phaser.BlendModes.ADD).setDepth(6).setAlpha(0.08).setTint(TV_LIGHT[0]);
  }

  glitch(t: number) {
    this.staticUntil = t + 420;
  }

  update(t: number) {
    const g = this.g;
    g.clear();
    const w = TV.x1 - TV.x0;
    const h = TV.y1 - TV.y0;
    if (this.reduced) {
      this.ident(t, true);
      return;
    }
    if (t - this.shownAt >= SHOW_MS) {
      this.show = (this.show + 1) % 3;
      this.shownAt = t;
      this.staticUntil = Math.max(this.staticUntil, t + STATIC_MS);
    }
    const flick = hash(Math.floor(t / 90));
    const noisy = t < this.staticUntil;
    if (noisy) {
      this.hideAll();
      g.fillStyle(0x2b2150, 1);
      g.fillRoundedRect(TV.x0, TV.y0, w, h, 12);
      const seed = Math.floor(t / 45);
      for (let i = 0; i < 70; i += 1) {
        const r = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
        const k = r - Math.floor(r);
        const r2 = Math.sin((i + 3) * 93.989 + seed * 17.13) * 24634.6345;
        const k2 = r2 - Math.floor(r2);
        g.fillStyle(k > 0.5 ? 0xfbf5e6 : 0x9df0dc, 0.5 + k2 * 0.4);
        g.fillRect(TV.x0 + 6 + k * (w - 18), TV.y0 + 6 + k2 * (h - 14), 9, 3);
      }
    } else if (this.show === 0) this.ident(t, false);
    else if (this.show === 1) this.cartoon(t);
    else this.weather(t);
    g.fillStyle(0xffffff, 0.015 + flick * 0.035);
    g.fillRect(TV.x0, TV.y0, w, h);
    const k = (t % ROLL_MS) / 1900;
    if (k < 1) this.roll.setVisible(true).setY(TV.y0 + 10 + k * (h - 20)).setAlpha(Math.sin(k * Math.PI) * 0.12);
    else this.roll.setVisible(false);
    const color = noisy ? 0xeef2ff : TV_LIGHT[this.show];
    const level = noisy ? 0.24 + flick * 0.08 : 0.13 + flick * 0.05;
    this.spill.setTint(color).setAlpha(level);
    this.wash.setTint(color).setAlpha(level * 0.55);
  }

  private hideAll() {
    this.label.setVisible(false);
    this.small.setVisible(false);
    this.rocket.setVisible(false);
    for (const d of this.drops) d.setVisible(false);
  }

  private ident(t: number, still: boolean) {
    const g = this.g;
    const w = TV.x1 - TV.x0;
    const h = TV.y1 - TV.y0;
    this.hideAll();
    const bw = w / BARS.length;
    BARS.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillRect(TV.x0 + i * bw, TV.y0, bw + 1, h * 0.72);
    });
    g.fillStyle(0x2b2150, 1);
    g.fillRect(TV.x0, TV.y0 + h * 0.72, w, h * 0.28);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(TV.x0 + w / 2 - 46, TV.y0 + h * 0.36 - 22, 92, 44, 10);
    this.label.setVisible(true).setText("404").setFontSize(34).setPosition(TV.x0 + w / 2, TV.y0 + h * 0.36).setScale(still ? 1 : 1 + Math.max(0, Math.sin(t / 260)) * 0.08);
    this.small.setVisible(true).setText(this.text.onAir).setPosition(TV.x0 + w / 2, TV.y0 + h * 0.86);
  }

  private cartoon(t: number) {
    const g = this.g;
    const w = TV.x1 - TV.x0;
    const h = TV.y1 - TV.y0;
    this.hideAll();
    g.fillStyle(0x1d2a5a, 1);
    g.fillRect(TV.x0, TV.y0, w, h);
    for (const [x, y] of this.stars) {
      g.fillStyle(0xfbf5e6, 0.5 + 0.5 * Math.abs(Math.sin(t / 300 + x)));
      g.fillCircle(x, y, 1.6);
    }
    g.fillStyle(0xfff2b0, 1);
    g.fillCircle(TV.x1 - 30, TV.y0 + 26, 14);
    g.fillStyle(0x1d2a5a, 1);
    g.fillCircle(TV.x1 - 24, TV.y0 + 22, 12);
    const k = ((t - this.shownAt) % SHOW_MS) / SHOW_MS;
    const x = TV.x0 + 20 + k * (w - 40);
    const y = TV.y0 + h * 0.6 + Math.sin(k * Math.PI * 4) * 12;
    this.rocket.setVisible(true).setPosition(x, y).setAngle(Math.cos(k * Math.PI * 4) * -14).setAlpha(Math.min(1, k * 8, (1 - k) * 8));
    g.fillStyle(0xffc83d, 0.9);
    g.fillTriangle(x - 20, y - 5, x - 20, y + 5, x - 28 - Math.abs(Math.sin(t / 50)) * 8, y);
    g.fillStyle(0x2b2150, 1);
    g.fillRect(TV.x0, TV.y1 - 18, w, 18);
    this.small.setVisible(true).setText(this.text.cartoon).setPosition(TV.x0 + w / 2, TV.y1 - 9);
  }

  private weather(t: number) {
    const g = this.g;
    const w = TV.x1 - TV.x0;
    this.hideAll();
    g.fillStyle(0x5cb9f0, 1);
    g.fillRect(TV.x0, TV.y0, w, TV.y1 - TV.y0);
    g.fillStyle(0xfbf5e6, 1);
    const cx = TV.x0 + 44;
    const cy = TV.y0 + 52;
    g.fillCircle(cx, cy, 16);
    g.fillCircle(cx + 18, cy - 6, 20);
    g.fillCircle(cx + 38, cy, 15);
    g.fillRect(cx - 4, cy, 46, 14);
    g.lineStyle(3, INK_HEX, 1);
    g.strokeCircle(cx + 18, cy - 6, 20);
    this.drops.forEach((d, i) => {
      const k = ((t / 1100 + i / 3) % 1 + 1) % 1;
      d.setVisible(true).setPosition(cx - 4 + i * 22, cy + 18 + k * 36).setAngle(Math.sin(t / 200 + i) * 30).setAlpha(Math.min(1, (1 - k) * 4));
    });
    this.small.setVisible(true).setText(this.text.forecast).setPosition(TV.x0 + w * 0.72, TV.y0 + 30);
    g.fillStyle(0x2b2150, 1);
    g.fillRect(TV.x0, TV.y1 - 26, w, 26);
    g.fillStyle(0xffc83d, 1);
    g.fillRect(TV.x0, TV.y1 - 26, 8, 26);
  }
}

class ScreenShow {
  private root: Phaser.GameObjects.Container;
  private sheep: Img;
  private count: Phaser.GameObjects.Text;
  private beam: Phaser.GameObjects.Rectangle;
  private specks: Phaser.GameObjects.Graphics;
  private shown = -1;
  private tick = -1;

  constructor(
    private scene: Phaser.Scene,
    private prop: Prop,
    fonts: Fonts,
    private reduced: boolean,
  ) {
    const at = (x: number, y: number) => [x - SCREEN.ox, y - SCREEN.oy] as const;
    const [px, py] = at(SCREEN.x0, SCREEN.y0);
    const w = SCREEN.x1 - SCREEN.x0;
    const h = SCREEN.y1 - SCREEN.y0;
    this.sheep = scene.add.image(0, 0, "sheep").setOrigin(0.5, 66 / 72).setScale(0.46);
    this.count = cartoonText(scene, ...at(SCREEN.x0 + 14, SCREEN.y0 + 20), "", { size: 44, color: "#ffc83d", font: fonts.display, stroke: 0.22 }).setOrigin(0, 0.5).setScale(0.5).setVisible(false);
    this.beam = scene.add.rectangle(px, py, w, h, 0xffffff, 1).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.specks = scene.add.graphics();
    this.root = scene.add.container(prop.img.x, prop.img.y, [this.sheep, this.count, this.beam, this.specks]).setScale(prop.def.scale ?? 1).setDepth(prop.img.depth + 0.05);
    if (reduced) {
      this.place(SCREEN.fence, 0);
      this.setCount(1);
    }
  }

  private place(x: number, k: number) {
    const lift = Math.sin(Math.PI * k) * SCREEN.hop;
    const fade = Phaser.Math.Clamp((x - SCREEN.x0 - 6) / 12, 0, 1) * Phaser.Math.Clamp((SCREEN.x1 - 6 - x) / 12, 0, 1);
    this.sheep.setPosition(x - SCREEN.ox, SCREEN.ground - lift - SCREEN.oy).setAngle(-14 * Math.sin(Math.PI * 2 * k)).setAlpha(fade);
  }

  private setCount(n: number) {
    if (n === this.shown) return;
    this.shown = n;
    this.count.setText(String(n)).setVisible(n > 0);
    if (!this.reduced && n > 0) this.scene.tweens.add({ targets: this.count, scale: { from: 0.78, to: 0.5 }, duration: 260, ease: "Back.easeOut" });
  }

  update(t: number) {
    const img = this.prop.img;
    this.root.setPosition(img.x, img.y).setAngle(img.angle);
    if (this.reduced) return;
    const loop = Math.floor(t / SCREEN.cycle);
    const k = (t % SCREEN.cycle) / SCREEN.cycle;
    const walk = Math.min(1, k / 0.9);
    const x = SCREEN.x0 + 6 + walk * (SCREEN.x1 - SCREEN.x0 - 12);
    const jump = Phaser.Math.Clamp((x - (SCREEN.fence - SCREEN.span / 2)) / SCREEN.span, 0, 1);
    this.place(x, jump);
    if (jump === 0 || jump === 1) this.sheep.y -= Math.abs(Math.sin(t / 80)) * 1.5;
    if (k >= 0.9) this.sheep.setAlpha(0);
    this.setCount(loop + (jump >= 0.5 ? 1 : 0));
    const step = Math.floor(t / 90);
    if (step === this.tick) return;
    this.tick = step;
    this.beam.setAlpha(0.02 + hash(step) * 0.05);
    const g = this.specks;
    g.clear();
    if (hash(step + 7) < 0.3) {
      g.fillStyle(INK_HEX, 0.45);
      for (let i = 0; i < 3; i += 1) g.fillCircle(SCREEN.x0 + 8 + hash(step * 3 + i) * (SCREEN.x1 - SCREEN.x0 - 16) - SCREEN.ox, SCREEN.y0 + 8 + hash(step * 5 + i) * (SCREEN.y1 - SCREEN.y0 - 16) - SCREEN.oy, 0.9 + hash(step + i) * 1.1);
    }
    if (hash(step + 13) < 0.08) {
      const sx = SCREEN.x0 + 10 + hash(step + 21) * (SCREEN.x1 - SCREEN.x0 - 20) - SCREEN.ox;
      g.lineStyle(1, 0xffffff, 0.35);
      g.lineBetween(sx, SCREEN.y0 + 4 - SCREEN.oy, sx + 2, SCREEN.y1 - 4 - SCREEN.oy);
    }
  }
}

export class Ambient {
  private sways: Sway[] = [];
  private flies: Fly[] = [];
  private notes: Note[] = [];
  private lamps: Lamp[] = [];
  private pools: Pool[] = [];
  private puffs: Puff[] = [];
  private motes: Mote[] = [];
  private beamMotes: Mote[] = [];
  private bulb: { prop: Prop; glow: Img | null } | null = null;
  private fan: { g: Phaser.GameObjects.Graphics; x: number; y: number; top: number; angle: number; speed: number } | null = null;
  private clock: { g: Phaser.GameObjects.Graphics; x: number; y: number; ringAt: number; ringUntil: number } | null = null;
  private tv: TvShow | null = null;
  private screen: ScreenShow | null = null;
  private tent: { inner: Img; spill: Img[]; base: number[] } | null = null;
  private grill: { prop: Prop; ember: Img; puffAt: number } | null = null;
  private swing: { prop: Prop; shadow: Img } | null = null;
  private moonlight: Img | null = null;
  private noteAt = 4000;
  private boombox: Prop | null = null;
  private time = 0;
  private blade = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => new Phaser.Math.Vector2()));
  private bladeShadow = [0, 1, 2, 3].map(() => new Phaser.Math.Vector2());

  constructor(
    private scene: Phaser.Scene,
    private room: Room,
    private reduced: boolean,
    fonts: Fonts,
  ) {
    makeAmbientTextures(scene);
    const theme = room.def.theme;
    const add = (x: number, y: number, w: number, h: number, tint: number, alpha: number, depth: number) => scene.add.image(x, y, "glow").setDisplaySize(w, h).setTint(tint).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth);
    for (const p of room.props) {
      const key = p.def.key;
      if (key === "tree") this.sways.push({ prop: p, amp: 0.85, period: 1900, phase: 0.4, quietSince: 0, kind: "angle" });
      if (key === "bush") this.sways.push({ prop: p, amp: 1.3, period: 1300, phase: p.def.x / 300, quietSince: 0, kind: "angle" });
      if (key === "tire-swing") {
        this.sways.push({ prop: p, amp: 4.5, period: 520, phase: 0, quietSince: 0, kind: "angle" });
        this.swing = { prop: p, shadow: scene.add.image(p.def.x, 618, "shade").setDisplaySize(96, 18).setAlpha(0.4).setDepth(26) };
      }
      if (key === "plant-big") this.sways.push({ prop: p, amp: 1.1, period: 1500, phase: p.def.x / 500, quietSince: 0, kind: "angle" });
      if (key === "tent") {
        this.sways.push({ prop: p, amp: 0.018, period: 900, phase: 0, quietSince: 0, kind: "breath" });
        const door = scene.add.image(p.def.x, p.def.y - 32, "door-light").setOrigin(0.5, DOOR.top / DOOR.h).setTint(0xffbf66).setAlpha(0.62).setBlendMode(Phaser.BlendModes.ADD).setDepth(25.2);
        this.tent = {
          inner: add(p.def.x, p.def.y - 84, 132, 184, 0xffd690, 0.3, p.img.depth + 0.05),
          spill: [door, add(p.def.x, p.def.y - 18, 420, 110, WARM, 0.34, 25), add(p.def.x, p.def.y - 24, 210, 54, 0xffe2a6, 0.3, 25.1)],
          base: [0.62, 0.34, 0.3],
        };
      }
      if (key === "boombox") this.boombox = p;
      if (key === "bulb-hang") {
        this.sways.push({ prop: p, amp: 1.6, period: 1700, phase: 0.8, quietSince: 0, kind: "angle" });
        this.bulb = { prop: p, glow: room.glows.get(p) ?? null };
        const pool = add(p.def.x, 560, 420, 120, WARM, 0.2, 24);
        this.lamps.push({ x: p.def.x, y: 560, imgs: this.bulb.glow ? [this.bulb.glow, pool] : [pool], tint: WARM, at: -99999 });
      }
      if (key === "screen") this.screen = new ScreenShow(scene, p, fonts, reduced);
      if (key === "lantern") this.pools.push({ img: add(p.def.x, p.def.y + 2, 170, 46, WARM, 0.17, 25), base: 0.17, phase: p.def.x / 97 });
      if (key === "grill") this.grill = { prop: p, ember: add(p.def.x, p.def.y, 128, 46, 0xffa04d, 0.5, p.img.depth + 0.1), puffAt: 900 };
      if (key === "lamp" || key === "floor-lamp") {
        const glow = room.glows.get(p);
        const pool = key === "lamp" ? add(1360, 470, 340, 96, WARM, 0.2, 24) : add(p.def.x, p.def.y + 6, 330, 92, WARM, 0.18, 24);
        if (!reduced) scene.tweens.add({ targets: pool, alpha: pool.alpha * 0.72, duration: 2200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.lamps.push({ x: p.def.x, y: p.def.y, imgs: glow ? [glow, pool] : [pool], tint: WARM, at: -99999 });
      }
    }
    if (theme === "bedroom") {
      this.fan = { g: scene.add.graphics().setDepth(6.5), x: 470, y: 0, top: 0, angle: 0.3, speed: 0 };
      this.clock = { g: scene.add.graphics().setDepth(452.6), x: 1377, y: 336, ringAt: 9000, ringUntil: 0 };
      this.moonlight = scene.add.image(MOON.x, MOON.y, "moonlight").setOrigin(0, 0).setTint(0xb4c4ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(21);
      if (!reduced) scene.tweens.add({ targets: this.moonlight, alpha: 0.78, duration: 5200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      for (let i = 0; i < 8; i += 1) {
        const y = GLASS.y0 + 40 + hash(i + 40) * 400;
        const { left, right } = moonEdges(y);
        const x = left + hash(i + 60) * (right - left);
        const img = scene.add.image(x, y, "glow").setDisplaySize(7, 7).setTint(0xe6ecff).setBlendMode(Phaser.BlendModes.ADD).setDepth(21.5).setAlpha(0.3);
        this.motes.push({ img, x, y, vx: (hash(i + 80) - 0.5) * 6, vy: -3 - hash(i + 90) * 5, phase: i * 1.7 });
      }
    }
    if (theme === "attic") {
      const beam = scene.add.image(BEAM.x, BEAM.top, "attic-beam").setOrigin(0.5, 0).setTint(0xb4c4ff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.42).setDepth(21);
      if (!reduced) scene.tweens.add({ targets: beam, alpha: 0.3, duration: 4600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      for (let i = 0; i < 12; i += 1) {
        const y = BEAM.top + 60 + hash(i + 140) * (BEAM.h - 90);
        const half = this.beamHalf(y);
        const x = BEAM.x - half + hash(i + 160) * half * 2;
        const img = scene.add.image(x, y, "glow").setDisplaySize(8, 8).setTint(0xe6ecff).setBlendMode(Phaser.BlendModes.ADD).setDepth(21.5).setAlpha(0.3);
        this.beamMotes.push({ img, x, y, vx: (hash(i + 180) - 0.5) * 8, vy: -4 - hash(i + 190) * 6, phase: i * 1.3 });
      }
    }
    if (theme === "living") {
      const tv = room.props.find((p) => p.def.key === "tv");
      this.tv = new TvShow(scene, fonts, (tv?.img.depth ?? 525) + 0.3, reduced, COPY[(scene.registry.get("ctx") as GameHostContext).locale].tv, tv?.def.y ?? 525);
    }
    const b = room.def.bounds;
    const n = room.def.fireflies ?? 0;
    for (let i = 0; i < n; i += 1) {
      const [h1, h2, h3, h4] = [hash(i + 1), hash(i + 101), hash(i + 201), hash(i + 301)];
      const x = b.x0 + h1 * (b.x1 - b.x0);
      const y = 230 + h2 * (b.y1 - 260);
      const back = i % 3 !== 0;
      const halo = scene.add.image(x, y, "glow").setDisplaySize(30, 30).setTint(0xd8ff7a).setBlendMode(Phaser.BlendModes.ADD).setDepth(back ? 4 : 1300).setAlpha(0);
      const core = scene.add.image(x, y, "glow").setDisplaySize(9, 9).setTint(0xf6ffcc).setBlendMode(Phaser.BlendModes.ADD).setDepth(halo.depth + 0.01).setAlpha(0);
      const blink = 2600 + h4 * 3000;
      this.flies.push({ core, halo, x, y, vx: 0, vy: 0, heading: h1 * Math.PI * 2, speed: 10 + h3 * 16, blink, duty: 0.26 + h1 * 0.24, phase: h2 * blink, f1: 1 / (650 + h3 * 900), f2: 1 / (1600 + h4 * 1500) });
    }
  }

  update(t: number, dt: number) {
    this.time = t;
    this.swayProps(t);
    this.updateFlies(t, dt);
    this.updateFan(dt);
    this.updateClock(t);
    this.tv?.update(t);
    this.screen?.update(t);
    this.updateNotes(t);
    this.updateLights(t);
    this.updateGrill(t);
    this.updateMotes(t, dt);
    this.updateBeam(t, dt);
    this.updateBulb();
    this.updateSwing();
  }

  private beamHalf(y: number) {
    return (BEAM.w0 + ((y - BEAM.top) / BEAM.h) * (BEAM.w1 - BEAM.w0)) / 2;
  }

  private updateBeam(t: number, dt: number) {
    for (const m of this.beamMotes) {
      if (!this.reduced) {
        m.x += (m.vx + Math.sin(t / 1500 + m.phase) * 5) * dt;
        m.y += m.vy * dt;
        if (m.y < BEAM.top + 40) {
          m.y = BEAM.top + BEAM.h - 40;
          m.x = BEAM.x + (hash(t + m.phase) - 0.5) * this.beamHalf(m.y) * 1.6;
        }
      }
      const half = this.beamHalf(m.y);
      const inside = Math.min(1, Math.max(0, (half - Math.abs(m.x - BEAM.x)) / 30));
      const fade = Math.min(1, (BEAM.top + BEAM.h - m.y) / 120);
      const twinkle = this.reduced ? 0.7 : 0.55 + 0.45 * Math.sin(t / 800 + m.phase * 3);
      m.img.setPosition(m.x, m.y).setAlpha(inside * fade * twinkle * 0.5);
    }
  }

  private updateBulb() {
    const b = this.bulb;
    if (!b?.glow) return;
    const img = b.prop.img;
    const reach = BULB_DROP * (b.prop.def.scale ?? 1);
    const a = Phaser.Math.DegToRad(img.angle);
    b.glow.setPosition(img.x - Math.sin(a) * reach, img.y + Math.cos(a) * reach);
  }

  private swayProps(t: number) {
    if (this.reduced) return;
    for (const s of this.sways) {
      const p = s.prop;
      const target = p.sway;
      if (p.busy || this.scene.tweens.isTweening(target)) {
        s.quietSince = t;
        continue;
      }
      const ramp = Math.min(1, (t - s.quietSince) / 800);
      if (s.kind === "angle") {
        const wave = Math.sin(t / s.period + s.phase) + Math.sin(t / (s.period * 2.3) + s.phase * 1.7) * 0.4;
        target.setAngle(p.swayBase + wave * s.amp * ramp);
      } else {
        const gust = Math.max(0, Math.sin(t / 2100 + s.phase)) * (0.6 + 0.4 * Math.sin(t / s.period));
        p.img.setScale(p.base.sx * (1 + gust * s.amp * ramp), p.base.sy * (1 - gust * s.amp * 0.5 * ramp));
      }
    }
  }

  private updateFlies(t: number, dt: number) {
    if (!this.flies.length) return;
    const b = this.room.def.bounds;
    for (const f of this.flies) {
      f.vx *= Math.exp(-dt * 1.4);
      f.vy *= Math.exp(-dt * 1.4);
      if (!this.reduced) {
        f.heading += (Math.sin(t * f.f1 + f.phase) * 1.1 + Math.sin(t * f.f2 + f.phase * 0.7) * 0.7) * dt;
        const speed = f.speed * (0.65 + 0.35 * Math.sin(t * f.f2 * 1.7 + f.phase));
        f.x += (Math.cos(f.heading) * speed + f.vx) * dt;
        f.y += (Math.sin(f.heading) * speed * 0.55 + f.vy + Math.cos(t / 610 + f.phase) * 5) * dt;
        if (f.x < b.x0 - 40 || f.x > b.x1 + 40) f.heading = Math.PI - f.heading;
        if (f.y < 210 || f.y > b.y1 - 10) f.heading = -f.heading;
        f.x = Phaser.Math.Clamp(f.x, b.x0 - 40, b.x1 + 40);
        f.y = Phaser.Math.Clamp(f.y, 210, b.y1 - 10);
      }
      const k = ((((t + f.phase) % f.blink) + f.blink) % f.blink) / f.blink;
      const glow = this.reduced ? 0.55 : k < f.duty ? Math.sin((k / f.duty) * Math.PI) ** 1.6 : 0;
      f.halo.setPosition(f.x, f.y).setAlpha(0.04 + glow * 0.5).setDisplaySize(16 + glow * 20, 16 + glow * 20);
      f.core.setPosition(f.x, f.y).setAlpha(0.06 + glow * 0.9);
    }
  }

  private updateLights(t: number) {
    for (const l of this.lamps) {
      const k = (t - l.at) / FLICKER_MS;
      if (k < 0 || k > 1.05) continue;
      const on = k >= 1 || Math.sin(k * 34) > -0.2 ? 1 : 0;
      const level = k >= 1 ? 1 : 1 - (1 - k) * (on ? 0.25 : 0.7);
      for (const img of l.imgs) img.setTint(dimmed(l.tint, level));
      if (k >= 1) l.at = -99999;
    }
    if (this.reduced) return;
    const lantern = 0.88 + 0.08 * Math.sin(t / 530) * Math.sin(t / 1270 + 1.3) + 0.04 * Math.sin(t / 173);
    if (this.tent) {
      this.tent.inner.setAlpha(0.3 * lantern);
      this.tent.spill.forEach((img, i) => img.setAlpha(this.tent!.base[i] * lantern));
    }
    for (const p of this.pools) p.img.setAlpha(p.base * (0.86 + 0.14 * Math.sin(t / 700 + p.phase) * Math.sin(t / 1900 + p.phase * 2)));
  }

  private updateGrill(t: number) {
    const gr = this.grill;
    if (!gr) return;
    const img = gr.prop.img;
    const k = gr.prop.def.scale ?? 1;
    const a = Phaser.Math.DegToRad(img.angle);
    const rise = (190 - 74) * k;
    const ex = img.x + rise * Math.sin(a);
    const ey = img.y - rise * Math.cos(a);
    gr.ember.setPosition(ex, ey).setAngle(img.angle);
    if (this.reduced) return;
    gr.ember.setAlpha(0.44 + 0.12 * Math.sin(t / 380) + 0.06 * Math.sin(t / 97));
    if (t >= gr.puffAt) {
      gr.puffAt = t + 1150 + hash(Math.floor(t)) * 600;
      const puff = this.scene.add.image(ex - 8, ey - 26, "dust").setTint(0xc4c8dc).setAlpha(0).setScale(0.26).setDepth(img.depth + 0.2);
      this.puffs.push({ img: puff, born: t, x: ex - 8 + (hash(t) - 0.5) * 14, drift: hash(t + 3) < 0.5 ? -1 : 1 });
    }
    for (const p of this.puffs) {
      const age = (t - p.born) / PUFF_MS;
      if (age >= 1) {
        p.img.destroy();
        continue;
      }
      p.img
        .setPosition(p.x + Math.sin(age * Math.PI * 1.6) * 14 * p.drift + age * 18, ey - 26 - age * 150)
        .setScale(0.32 + age * 0.7)
        .setAlpha(Math.min(1, age * 5) * (1 - age) * 0.5)
        .setAngle(age * 40 * p.drift);
    }
    this.puffs = this.puffs.filter((p) => p.img.active);
  }

  private updateMotes(t: number, dt: number) {
    for (const m of this.motes) {
      if (!this.reduced) {
        m.x += (m.vx + Math.sin(t / 1700 + m.phase) * 4) * dt;
        m.y += m.vy * dt;
        if (m.y < GLASS.y0 + 30) {
          m.y = FLOOR.near + FLOOR.depth - 30;
          const { left, right } = moonEdges(m.y);
          m.x = left + hash(t + m.phase) * (right - left);
        }
      }
      const { left, right } = moonEdges(m.y);
      const inside = Math.min(1, Math.max(0, Math.min(m.x - left, right - m.x) / 24));
      const twinkle = this.reduced ? 0.7 : 0.55 + 0.45 * Math.sin(t / 900 + m.phase * 3);
      m.img.setPosition(m.x, m.y).setAlpha(inside * twinkle * 0.42);
    }
  }

  private updateSwing() {
    const s = this.swing;
    if (!s) return;
    const img = s.prop.img;
    const reach = 228 * (s.prop.def.scale ?? 1);
    const a = Phaser.Math.DegToRad(img.angle);
    s.shadow.setX(img.x - Math.sin(a) * reach).setDisplaySize(96 - Math.abs(Math.sin(a)) * 30, 18);
  }

  setCeiling(y: number) {
    if (this.fan) this.fan.top = y;
  }

  private updateFan(dt: number) {
    const fan = this.fan;
    if (!fan) return;
    const g = fan.g;
    g.clear();
    if (!this.reduced) {
      fan.speed = Math.max(0, fan.speed - dt * 1.2);
      fan.angle += (0.9 + fan.speed) * dt;
    }
    const hubY = fan.y + 88;
    g.lineStyle(8, INK_HEX, 1);
    g.lineBetween(fan.x, Math.min(fan.top, fan.y), fan.x, hubY - 20);
    const drawBlade = (i: number, front: boolean) => {
      const a = fan.angle + (i * Math.PI) / 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      if (s >= 0 !== front) return;
      const len = 150;
      const tipX = fan.x + c * len;
      const tipY = hubY + s * len * 0.16;
      const px = -s * 0.88;
      const py = c * 0.16;
      const pts = this.blade[i];
      pts[0].set(fan.x + px * 10, hubY + py * 10 - 3);
      pts[1].set(tipX + px * 26, tipY + py * 26 - 6);
      pts[2].set(tipX - px * 26, tipY - py * 26 + 6);
      pts[3].set(fan.x - px * 10, hubY - py * 10 + 3);
      for (let k = 0; k < 4; k += 1) this.bladeShadow[k].set(pts[k].x, pts[k].y + 4);
      g.fillStyle(INK_HEX, 1);
      g.fillPoints(this.bladeShadow, true);
      g.fillStyle(front ? 0xc98552 : 0xa9683f, 1);
      g.fillPoints(pts, true);
      g.lineStyle(4, INK_HEX, 1);
      g.strokePoints(pts, true);
    };
    for (let i = 0; i < 4; i += 1) drawBlade(i, false);
    g.fillStyle(INK_HEX, 1);
    g.fillEllipse(fan.x + 2, hubY + 2, 66, 32);
    g.fillStyle(0x6e52b4, 1);
    g.fillEllipse(fan.x, hubY, 62, 28);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeEllipse(fan.x, hubY, 62, 28);
    g.fillStyle(0xfff3b0, 1);
    g.fillEllipse(fan.x, hubY + 14, 26, 14);
    g.lineStyle(3, INK_HEX, 1);
    g.strokeEllipse(fan.x, hubY + 14, 26, 14);
    for (let i = 0; i < 4; i += 1) drawBlade(i, true);
  }

  private updateClock(t: number) {
    const c = this.clock;
    if (!c) return;
    const g = c.g;
    g.clear();
    if (!this.reduced && t >= c.ringAt) {
      c.ringUntil = t + 900;
      c.ringAt = t + 15000 + ((t * 7) % 6000);
    }
    const ringing = !this.reduced && t < c.ringUntil;
    const jig = ringing ? Math.sin(t / 22) * 3 : 0;
    const x = c.x + jig;
    const y = c.y;
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(x - 13, y - 17, 7);
    g.fillCircle(x + 13, y - 17, 7);
    g.fillStyle(0xffc83d, 1);
    g.fillCircle(x - 13, y - 17, 4.5);
    g.fillCircle(x + 13, y - 17, 4.5);
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(x - 20, y - 15, 40, 33, 9);
    g.fillStyle(0xf06ba8, 1);
    g.fillRoundedRect(x - 17, y - 12, 34, 27, 7);
    g.fillStyle(0xfffaf0, 1);
    g.fillCircle(x, y + 1, 10);
    g.lineStyle(2.5, INK_HEX, 1);
    g.strokeCircle(x, y + 1, 10);
    const sec = this.reduced ? 0 : Math.floor(t / 1000);
    const sa = -Math.PI / 2 + (sec % 60) * (Math.PI / 30);
    const ma = -Math.PI / 2 + (t / 60000) * Math.PI * 2;
    g.lineStyle(2.5, INK_HEX, 1);
    g.lineBetween(x, y + 1, x + Math.cos(ma) * 6, y + 1 + Math.sin(ma) * 6);
    g.lineStyle(1.6, 0xef4f43, 1);
    g.lineBetween(x, y + 1, x + Math.cos(sa) * 8, y + 1 + Math.sin(sa) * 8);
    if (ringing) {
      g.lineStyle(3, INK_HEX, 1);
      for (const side of [-1, 1]) {
        g.lineBetween(x + side * 24, y - 22, x + side * 32, y - 30);
        g.lineBetween(x + side * 26, y - 12, x + side * 35, y - 14);
      }
    }
  }

  private updateNotes(t: number) {
    if (this.boombox && !this.reduced && t >= this.noteAt) {
      this.noteAt = t + 5200 + ((t * 13) % 3400);
      for (let i = 0; i < 2; i += 1) {
        const img = this.scene.add.image(this.boombox.def.x - 20 + i * 34, this.boombox.def.y - 70, "note").setDepth(this.boombox.img.depth + 1).setScale(0.7).setAlpha(0);
        this.notes.push({ img, born: t + i * 420, x: img.x, drift: i ? 1 : -1 });
      }
    }
    for (const n of this.notes) {
      const age = (t - n.born) / 1600;
      if (age < 0) continue;
      if (age >= 1) {
        n.img.destroy();
        continue;
      }
      n.img.setPosition(n.x + Math.sin(age * Math.PI * 2) * 10 * n.drift, this.boombox!.def.y - 70 - age * 70).setAlpha(Math.min(1, age * 5, (1 - age) * 3)).setAngle(Math.sin(age * 9) * 12);
    }
    this.notes = this.notes.filter((n) => n.img.active);
  }

  impact(x: number, y: number, power: number) {
    for (const f of this.flies) {
      const dx = f.x - x;
      const dy = f.y - (y - 80);
      const d = Math.hypot(dx, dy);
      if (d < 260 && d > 0) {
        f.vx += (dx / d) * 260 * power;
        f.vy += (dy / d) * 200 * power;
      }
    }
    if (this.fan && y < 640) this.fan.speed = Math.min(5, this.fan.speed + power * 2.4);
    if (this.clock && Math.hypot(x - this.clock.x, y - 452) < 230 && this.time >= this.clock.ringUntil && !this.reduced) this.clock.ringUntil = this.time + 600;
    if (this.tv && Math.hypot(x - 330, y - 500) < 240) this.tv.glitch(this.time);
    if (!this.reduced && power >= 0.6) for (const l of this.lamps) if (Math.hypot(x - l.x, (y - l.y) * 1.2) < 300) l.at = this.time;
  }
}
