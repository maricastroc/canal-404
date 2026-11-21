import type * as Phaser from "phaser";
import type { Dir } from "../sim/types";

const INK = 0x1d1830;

export type Eyes = "dot" | "closed" | "wide" | "happy" | "squeeze" | "squint" | "angry";
export type Mouth = "line" | "o" | "grin" | "smile" | "snore" | "yell" | "tight" | "wobbly";
export type Brows = "none" | "up" | "worried" | "angry" | "flat";

type FaceSpec = { eyes: Eyes; mouth: Mouth; brows?: Brows; look?: { x: number; y: number }; glasses?: boolean; blush?: boolean; tint?: number; gap?: number };

const LOOK: Record<Dir, { x: number; y: number }> = { 0: { x: 0, y: -1 }, 1: { x: 1, y: 0 }, 2: { x: 0, y: 1 }, 3: { x: -1, y: 0 } };

export function lookOf(dir: Dir) {
  return LOOK[dir];
}

function face(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, spec: FaceSpec) {
  const look = spec.look ?? { x: 0, y: 0 };
  const gap = r * (spec.gap ?? 0.42);
  const ex = cx + look.x * r * 0.22;
  const ey = cy - r * 0.05 + look.y * r * 0.12;
  if (spec.blush) {
    g.fillStyle(0xff9d8a, 0.75);
    g.fillEllipse(ex - gap * 1.25, ey + r * 0.38, r * 0.34, r * 0.2);
    g.fillEllipse(ex + gap * 1.25, ey + r * 0.38, r * 0.34, r * 0.2);
  }
  for (const side of [-1, 1]) {
    const x = ex + side * gap;
    g.lineStyle(Math.max(2, r * 0.09), INK, 1);
    switch (spec.eyes) {
      case "dot":
        g.fillStyle(INK, 1);
        g.fillCircle(x + look.x * r * 0.05, ey + look.y * r * 0.05, r * 0.11);
        break;
      case "wide":
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x, ey, r * 0.2);
        g.strokeCircle(x, ey, r * 0.2);
        g.fillStyle(INK, 1);
        g.fillCircle(x + look.x * r * 0.08, ey + look.y * r * 0.08, r * 0.07);
        break;
      case "closed":
        g.beginPath();
        g.arc(x, ey - r * 0.02, r * 0.13, 0.15 * Math.PI, 0.85 * Math.PI);
        g.strokePath();
        break;
      case "happy":
        g.beginPath();
        g.arc(x, ey + r * 0.06, r * 0.13, 1.15 * Math.PI, 1.85 * Math.PI);
        g.strokePath();
        break;
      case "squeeze":
        g.lineBetween(x - r * 0.13, ey - r * 0.07 * side, x + r * 0.13, ey);
        g.lineBetween(x - r * 0.13, ey + r * 0.07 * side, x + r * 0.13, ey);
        break;
      case "squint":
        g.lineBetween(x - r * 0.12, ey, x + r * 0.12, ey);
        break;
      case "angry":
        g.fillStyle(INK, 1);
        g.fillCircle(x + look.x * r * 0.05, ey + look.y * r * 0.05, r * 0.1);
        break;
    }
    if (spec.glasses) {
      g.lineStyle(Math.max(2, r * 0.07), INK, 1);
      g.fillStyle(0xa9dcf7, 0.25);
      g.fillCircle(x, ey, r * 0.27);
      g.strokeCircle(x, ey, r * 0.27);
    }
    const by = ey - r * (spec.glasses ? 0.42 : 0.3);
    g.lineStyle(Math.max(2.5, r * 0.1), INK, 1);
    switch (spec.brows ?? "none") {
      case "up":
        g.lineBetween(x - r * 0.15, by - r * 0.08, x + r * 0.15, by - r * 0.08);
        break;
      case "worried":
        g.lineBetween(x - r * 0.15 * side, by - r * 0.1, x + r * 0.15 * side, by + r * 0.02);
        break;
      case "angry":
        g.lineBetween(x - r * 0.16 * side, by - r * 0.04, x + r * 0.16 * side, by + r * 0.12);
        break;
      case "flat":
        g.lineBetween(x - r * 0.15, by, x + r * 0.15, by);
        break;
    }
  }
  if (spec.glasses) {
    g.lineStyle(Math.max(2, r * 0.07), INK, 1);
    g.lineBetween(ex - gap + r * 0.27, ey, ex + gap - r * 0.27, ey);
  }
  const mx = cx + look.x * r * 0.2;
  const my = cy + r * 0.5 + look.y * r * 0.06;
  g.lineStyle(Math.max(2, r * 0.09), INK, 1);
  switch (spec.mouth) {
    case "line":
      g.lineBetween(mx - r * 0.14, my, mx + r * 0.14, my - r * 0.02);
      break;
    case "tight":
      g.lineBetween(mx - r * 0.1, my, mx + r * 0.1, my);
      g.lineBetween(mx - r * 0.12, my - r * 0.03, mx - r * 0.1, my);
      g.lineBetween(mx + r * 0.12, my - r * 0.03, mx + r * 0.1, my);
      break;
    case "o":
      g.fillStyle(0x5c2333, 1);
      g.fillEllipse(mx, my, r * 0.2, r * 0.24);
      g.strokeEllipse(mx, my, r * 0.2, r * 0.24);
      break;
    case "snore":
      g.fillStyle(0x5c2333, 1);
      g.fillEllipse(mx, my + r * 0.02, r * 0.24, r * 0.16);
      g.strokeEllipse(mx, my + r * 0.02, r * 0.24, r * 0.16);
      break;
    case "yell":
      g.fillStyle(0x5c2333, 1);
      g.fillEllipse(mx, my + r * 0.06, r * 0.46, r * 0.4);
      g.strokeEllipse(mx, my + r * 0.06, r * 0.46, r * 0.4);
      g.fillStyle(0xef4f43, 1);
      g.fillEllipse(mx, my + r * 0.16, r * 0.24, r * 0.12);
      break;
    case "smile":
      g.beginPath();
      g.arc(mx, my - r * 0.12, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
      g.strokePath();
      break;
    case "grin": {
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(mx - r * 0.3, my - r * 0.1, r * 0.6, r * 0.22, r * 0.08);
      g.strokeRoundedRect(mx - r * 0.3, my - r * 0.1, r * 0.6, r * 0.22, r * 0.08);
      g.lineStyle(Math.max(1.5, r * 0.05), INK, 1);
      g.lineBetween(mx - r * 0.3, my + r * 0.01, mx + r * 0.3, my + r * 0.01);
      for (let i = -1; i <= 1; i += 1) g.lineBetween(mx + i * r * 0.13, my - r * 0.1, mx + i * r * 0.13, my + r * 0.12);
      break;
    }
    case "wobbly":
      g.beginPath();
      g.moveTo(mx - r * 0.2, my);
      g.lineTo(mx - r * 0.1, my - r * 0.05);
      g.lineTo(mx, my);
      g.lineTo(mx + r * 0.1, my - r * 0.05);
      g.lineTo(mx + r * 0.2, my);
      g.strokePath();
      break;
  }
}

function sweat(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
  g.fillStyle(0x9fdcff, 1);
  g.lineStyle(2, INK, 1);
  g.beginPath();
  g.moveTo(x, y - r);
  g.lineTo(x + r * 0.6, y + r * 0.2);
  g.arc(x, y + r * 0.2, r * 0.6, 0, Math.PI);
  g.closePath();
  g.fillPath();
  g.strokePath();
}

export type BrunoMood = "calm" | "tense" | "breath" | "scared" | "caught" | "happy" | "sneak";

export class BrunoView {
  readonly container: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Graphics;
  private body: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private facing: Dir = 1;
  private mood: BrunoMood = "calm";
  private bob?: Phaser.Tweens.Tween;

  constructor(
    private scene: Phaser.Scene,
    private s: number,
  ) {
    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.35);
    this.shadow.fillEllipse(0, s * 0.3, s * 0.56, s * 0.18);
    this.gfx = scene.add.graphics();
    this.body = scene.add.container(0, 0, [this.gfx]);
    this.container = scene.add.container(0, 0, [this.shadow, this.body]).setDepth(34);
    this.draw();
    this.startBob();
  }

  private startBob() {
    this.bob?.remove();
    this.body.y = 0;
    this.bob = this.scene.tweens.add({ targets: this.body, y: -this.s * 0.025, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  setMood(mood: BrunoMood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.draw();
  }

  getMood() {
    return this.mood;
  }

  setFacing(dir: Dir) {
    if (dir === this.facing) return;
    this.facing = dir;
    this.draw();
  }

  place(x: number, y: number) {
    this.scene.tweens.killTweensOf(this.container);
    this.container.setPosition(x, y);
  }

  hop(x: number, y: number, duration: number) {
    this.scene.tweens.killTweensOf(this.container);
    const sx = this.container.x;
    const sy = this.container.y;
    const lift = this.s * 0.14;
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        this.container.setPosition(sx + (x - sx) * t, sy + (y - sy) * t - Math.sin(t * Math.PI) * lift);
        this.body.scaleY = 1 + Math.sin(t * Math.PI) * 0.06;
        this.body.scaleX = 1 - Math.sin(t * Math.PI) * 0.04;
      },
      onComplete: () => {
        this.container.setPosition(x, y);
        this.body.setScale(1);
      },
    });
  }

  rewind(x: number, y: number, duration: number) {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({ targets: this.container, x, y, duration, ease: "Cubic.easeOut" });
    this.scene.tweens.add({ targets: this.body, angle: { from: -10, to: 0 }, duration, ease: "Back.easeOut" });
  }

  bump(dir: Dir) {
    const look = LOOK[dir];
    this.scene.tweens.add({ targets: this.body, x: look.x * this.s * 0.08, y: look.y * this.s * 0.08, duration: 70, yoyo: true, ease: "Sine.easeOut", onComplete: () => this.body.setPosition(0, 0) });
  }

  freeze() {
    this.bob?.pause();
    this.scene.tweens.add({ targets: this.body, scaleY: 1.12, scaleX: 0.92, duration: 120, yoyo: true, repeat: 1 });
  }

  cheer() {
    this.scene.tweens.add({ targets: this.body, y: -this.s * 0.25, duration: 180, yoyo: true, repeat: 2, ease: "Quad.easeOut" });
  }

  resume() {
    this.body.setScale(1).setAngle(0);
    this.startBob();
  }

  private draw() {
    const g = this.gfx;
    const s = this.s;
    const back = this.facing === 0;
    const turn = this.facing === 1 ? 1 : this.facing === 3 ? -1 : 0;
    g.clear();
    const bodyY = s * 0.14;
    g.fillStyle(0x5cb9f0, 1);
    g.fillEllipse(0, bodyY, s * 0.48, s * 0.4);
    g.lineStyle(2, 0xa9dcf7, 0.9);
    for (let i = -2; i <= 2; i += 1) g.lineBetween(i * s * 0.08, bodyY - s * 0.17, i * s * 0.08, bodyY + s * 0.17);
    g.lineStyle(3.5, INK, 1);
    g.strokeEllipse(0, bodyY, s * 0.48, s * 0.4);
    const handY = bodyY + s * 0.04;
    g.fillStyle(0xffd2a8, 1);
    g.fillCircle(-s * 0.25, handY, s * 0.065);
    g.strokeCircle(-s * 0.25, handY, s * 0.065);
    if (!back) {
      const nx = turn >= 0 ? s * 0.2 : -s * 0.34;
      g.fillStyle(0xfbf5e6, 1);
      g.fillRect(nx, bodyY - s * 0.06, s * 0.15, s * 0.2);
      g.lineStyle(2.5, INK, 1);
      g.strokeRect(nx, bodyY - s * 0.06, s * 0.15, s * 0.2);
      g.lineStyle(1.5, 0xef4f43, 1);
      g.lineBetween(nx + s * 0.035, bodyY - s * 0.06, nx + s * 0.035, bodyY + s * 0.14);
    }
    g.fillStyle(0xffd2a8, 1);
    g.lineStyle(3.5, INK, 1);
    g.fillCircle(s * 0.25, handY, s * 0.065);
    g.strokeCircle(s * 0.25, handY, s * 0.065);
    const hx = turn * s * 0.03;
    const hy = -s * 0.13;
    const r = s * 0.25;
    const tint = this.mood === "breath" ? 0xf0b8c8 : 0xffd2a8;
    g.fillStyle(tint, 1);
    g.fillCircle(hx, hy, r);
    g.lineStyle(3.5, INK, 1);
    g.strokeCircle(hx, hy, r);
    g.fillStyle(0x4a2c1c, 1);
    if (back) {
      g.fillCircle(hx, hy - r * 0.05, r * 0.94);
      g.lineStyle(3.5, INK, 1);
      g.strokeCircle(hx, hy - r * 0.05, r * 0.94);
      g.lineStyle(3, 0x6b4430, 1);
      g.beginPath();
      g.arc(hx, hy + r * 0.1, r * 0.4, 1.1 * Math.PI, 1.9 * Math.PI);
      g.strokePath();
      return;
    }
    g.beginPath();
    g.arc(hx, hy, r, Math.PI * 1.02, Math.PI * 1.98);
    g.lineTo(hx + r * 0.9, hy - r * 0.22);
    g.lineTo(hx + r * 0.3 + turn * r * 0.2, hy - r * 0.42);
    g.lineTo(hx - r * 0.2 + turn * r * 0.2, hy - r * 0.32);
    g.lineTo(hx - r * 0.9, hy - r * 0.22);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, INK, 1);
    g.strokePath();
    const look = this.facing === 2 ? { x: 0, y: 0.6 } : { x: turn, y: 0 };
    const cx = hx + turn * r * 0.16;
    const cy = hy + r * 0.12;
    const spec: Record<BrunoMood, FaceSpec> = {
      calm: { eyes: "dot", mouth: "line", brows: "flat", look, glasses: true },
      sneak: { eyes: "dot", mouth: "tight", brows: "flat", look, glasses: true },
      tense: { eyes: "dot", mouth: "wobbly", brows: "worried", look, glasses: true },
      breath: { eyes: "squeeze", mouth: "tight", brows: "worried", look, glasses: true, blush: true },
      scared: { eyes: "wide", mouth: "o", brows: "up", look, glasses: true },
      caught: { eyes: "wide", mouth: "grin", brows: "worried", look: { x: 0, y: 0.4 }, glasses: true, blush: true },
      happy: { eyes: "happy", mouth: "smile", brows: "up", look, glasses: true, blush: true },
    };
    face(g, cx, cy, r * 0.82, spec[this.mood]);
    if (this.mood === "tense" || this.mood === "caught" || this.mood === "scared") sweat(g, hx + r * 0.95, hy - r * 0.5, r * 0.22);
    if (this.mood === "caught") sweat(g, hx - r * 0.95, hy - r * 0.35, r * 0.18);
  }
}

export type SleeperSeat = "bed" | "armchair";

export type SleeperMood = "sleep" | "awake" | "angry" | "drowsy";

export class DadView {
  readonly container: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private head: Phaser.GameObjects.Container;
  private headGfx: Phaser.GameObjects.Graphics;
  private mood: SleeperMood = "sleep";
  private facing: Dir = 2;
  private breathe?: Phaser.Tweens.Tween;

  constructor(
    private scene: Phaser.Scene,
    private s: number,
    private seat: SleeperSeat,
  ) {
    this.gfx = scene.add.graphics();
    this.headGfx = scene.add.graphics();
    this.head = scene.add.container(0, 0, [this.headGfx]);
    this.container = scene.add.container(0, 0, [this.gfx, this.head]).setDepth(32);
    this.draw();
    this.startBreath();
  }

  private startBreath() {
    this.breathe?.remove();
    this.head.setScale(1);
    if (this.mood !== "sleep") return;
    this.breathe = this.scene.tweens.add({ targets: this.head, scaleX: 1.05, scaleY: 0.96, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  headPoint() {
    return { x: this.container.x + this.head.x, y: this.container.y + this.head.y - this.s * 0.3 };
  }

  set(mood: SleeperMood, facing: Dir) {
    if (mood === this.mood && facing === this.facing) return;
    const wasSleeping = this.mood === "sleep";
    this.mood = mood;
    this.facing = facing;
    this.draw();
    this.startBreath();
    if (wasSleeping && mood !== "sleep") {
      this.scene.tweens.add({ targets: this.head, y: this.head.y - this.s * 0.1, duration: 90, yoyo: true, ease: "Quad.easeOut" });
    }
  }

  shake() {
    this.scene.tweens.add({ targets: this.container, x: this.container.x + 4, duration: 40, yoyo: true, repeat: 5 });
  }

  private draw() {
    const g = this.gfx;
    const s = this.s;
    const up = this.mood !== "sleep" && this.mood !== "drowsy";
    g.clear();
    if (this.seat === "bed") {
      const bodyTop = up ? -s * 0.38 : -s * 0.6;
      g.fillStyle(0xf7f1e6, 1);
      g.lineStyle(3.5, INK, 1);
      if (up) {
        g.fillEllipse(0, -s * 0.12, s * 0.62, s * 0.5);
        g.strokeEllipse(0, -s * 0.12, s * 0.62, s * 0.5);
      }
      g.fillStyle(0x5d7cb0, 1);
      g.fillRoundedRect(-s * 0.44, up ? -s * 0.02 : bodyTop + s * 0.2, s * 0.88, up ? s * 0.42 : s * 0.98, s * 0.12);
      g.lineStyle(3.5, INK, 1);
      g.strokeRoundedRect(-s * 0.44, up ? -s * 0.02 : bodyTop + s * 0.2, s * 0.88, up ? s * 0.42 : s * 0.98, s * 0.12);
      g.lineStyle(2, 0x9fb6e0, 0.8);
      for (let i = 1; i < 4; i += 1) g.lineBetween(-s * 0.44 + i * s * 0.22, up ? 0 : bodyTop + s * 0.22, -s * 0.44 + i * s * 0.22, s * 0.38);
      this.head.setPosition(up ? 0 : 0, up ? -s * 0.38 : -s * 0.7);
    } else {
      g.fillStyle(0xf7f1e6, 1);
      g.lineStyle(3.5, INK, 1);
      g.fillEllipse(0, s * 0.14, s * 0.6, s * 0.46);
      g.strokeEllipse(0, s * 0.14, s * 0.6, s * 0.46);
      g.fillStyle(0x6b5a8f, 1);
      g.fillRoundedRect(-s * 0.3, s * 0.2, s * 0.6, s * 0.2, 8);
      g.strokeRoundedRect(-s * 0.3, s * 0.2, s * 0.6, s * 0.2, 8);
      this.head.setPosition(up ? 0 : s * 0.1, up ? -s * 0.14 : -s * 0.06);
      this.head.setAngle(up ? 0 : 16);
    }
    const h = this.headGfx;
    h.clear();
    const r = s * 0.26;
    h.fillStyle(0xe7a874, 1);
    h.lineStyle(3.5, INK, 1);
    h.fillCircle(0, 0, r);
    h.strokeCircle(0, 0, r);
    h.fillStyle(0x2a1d1a, 1);
    h.beginPath();
    h.arc(0, 0, r, Math.PI * 1.05, Math.PI * 1.95);
    for (let i = 0; i <= 6; i += 1) h.lineTo(r * 0.9 - (i * r * 1.8) / 6, -r * (i % 2 ? 0.55 : 0.75));
    h.closePath();
    h.fillPath();
    h.strokePath();
    const look = this.mood === "sleep" || this.mood === "drowsy" ? { x: 0, y: 0 } : lookOf(this.facing);
    const spec: Record<SleeperMood, FaceSpec> = {
      sleep: { eyes: "closed", mouth: "snore", brows: "flat" },
      drowsy: { eyes: "squint", mouth: "line", brows: "flat" },
      awake: { eyes: "wide", mouth: "o", brows: "up", look },
      angry: { eyes: "angry", mouth: "yell", brows: "angry", look },
    };
    face(h, look.x * r * 0.15, look.y * r * 0.12 + r * 0.05, r * 0.86, spec[this.mood]);
    h.fillStyle(0x2a1d1a, 1);
    const mx = look.x * r * 0.18;
    const my = r * 0.3 + look.y * r * 0.1;
    h.fillEllipse(mx - r * 0.2, my, r * 0.42, r * 0.18);
    h.fillEllipse(mx + r * 0.2, my, r * 0.42, r * 0.18);
  }
}

export type GrandmaMood = "walk" | "alert" | "shock";

export class GrandmaView {
  readonly container: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private body: Phaser.GameObjects.Container;
  private mood: GrandmaMood = "walk";
  private facing: Dir = 2;

  constructor(
    private scene: Phaser.Scene,
    private s: number,
  ) {
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillEllipse(0, s * 0.3, s * 0.6, s * 0.18);
    this.gfx = scene.add.graphics();
    this.body = scene.add.container(0, 0, [this.gfx]);
    this.container = scene.add.container(0, 0, [shadow, this.body]).setDepth(33);
    this.draw();
  }

  set(mood: GrandmaMood, facing: Dir) {
    if (mood === this.mood && facing === this.facing) return;
    this.mood = mood;
    this.facing = facing;
    this.draw();
  }

  walkTo(x: number, y: number, duration: number) {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({ targets: this.container, x, y, duration, ease: "Sine.easeInOut" });
    this.scene.tweens.add({ targets: this.body, angle: { from: -6, to: 6 }, duration: duration / 2, yoyo: true, ease: "Sine.easeInOut", onComplete: () => this.body.setAngle(0) });
  }

  headPoint() {
    return { x: this.container.x, y: this.container.y - this.s * 0.4 };
  }

  private draw() {
    const g = this.gfx;
    const s = this.s;
    const look = lookOf(this.facing);
    const back = this.facing === 0;
    g.clear();
    g.fillStyle(0xf06ba8, 1);
    g.lineStyle(3.5, INK, 1);
    g.fillEllipse(0, s * 0.14, s * 0.54, s * 0.44);
    g.strokeEllipse(0, s * 0.14, s * 0.54, s * 0.44);
    g.lineStyle(2, 0xf9b6d4, 1);
    g.lineBetween(0, s * 0.0, 0, s * 0.34);
    const fx = look.x * s * 0.34;
    const fy = s * 0.1 + look.y * s * 0.26;
    g.fillStyle(0x9aa6b8, 1);
    g.lineStyle(3, INK, 1);
    g.fillRoundedRect(fx - s * 0.07, fy - s * 0.07, s * 0.14, s * 0.14, 4);
    g.strokeRoundedRect(fx - s * 0.07, fy - s * 0.07, s * 0.14, s * 0.14, 4);
    g.fillStyle(0xffe39a, 1);
    g.fillCircle(fx + look.x * s * 0.08, fy + look.y * s * 0.08, s * 0.05);
    g.fillStyle(0xffd2a8, 1);
    g.fillCircle(fx - look.y * s * 0.05, fy + look.x * s * 0.05, s * 0.05);
    const r = s * 0.24;
    const hy = -s * 0.14;
    g.fillStyle(0xffd2a8, 1);
    g.lineStyle(3.5, INK, 1);
    g.fillCircle(0, hy, r);
    g.strokeCircle(0, hy, r);
    g.fillStyle(0xd9d4e6, 1);
    if (back) {
      g.fillCircle(0, hy, r * 0.96);
      g.strokeCircle(0, hy, r * 0.96);
      g.fillCircle(0, hy + r * 0.1, r * 0.42);
      g.strokeCircle(0, hy + r * 0.1, r * 0.42);
      return;
    }
    g.beginPath();
    g.arc(0, hy, r, Math.PI * 1.0, Math.PI * 2.0);
    g.lineTo(r * 0.7, hy - r * 0.15);
    g.lineTo(-r * 0.7, hy - r * 0.15);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillCircle(0, hy - r * 0.95, r * 0.36);
    g.strokeCircle(0, hy - r * 0.95, r * 0.36);
    const spec: Record<GrandmaMood, FaceSpec> = {
      walk: { eyes: "squint", mouth: "line", brows: "flat", look, glasses: true },
      alert: { eyes: "wide", mouth: "o", brows: "up", look, glasses: true },
      shock: { eyes: "wide", mouth: "yell", brows: "up", look: { x: 0, y: 0.5 }, glasses: true },
    };
    face(g, look.x * r * 0.18, hy + r * 0.12 + look.y * r * 0.06, r * 0.82, spec[this.mood]);
  }
}

export type DogMood = "sleep" | "alert" | "walk" | "sniff" | "happy";

export class DogView {
  readonly container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private tail: Phaser.GameObjects.Graphics;
  private mood: DogMood = "sleep";
  private facing: Dir = 2;
  private wag?: Phaser.Tweens.Tween;
  private breathe?: Phaser.Tweens.Tween;

  constructor(
    private scene: Phaser.Scene,
    private s: number,
  ) {
    this.gfx = scene.add.graphics();
    this.tail = scene.add.graphics();
    this.body = scene.add.container(0, 0, [this.tail, this.gfx]);
    this.container = scene.add.container(0, 0, [this.body]).setDepth(31);
    this.draw();
    this.animate();
  }

  set(mood: DogMood, facing: Dir) {
    if (mood === this.mood && facing === this.facing) return;
    this.mood = mood;
    this.facing = facing;
    this.draw();
    this.animate();
  }

  getMood() {
    return this.mood;
  }

  trotTo(x: number, y: number, duration: number) {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({ targets: this.container, x, y, duration, ease: "Sine.easeInOut" });
  }

  place(x: number, y: number) {
    this.scene.tweens.killTweensOf(this.container);
    this.container.setPosition(x, y);
  }

  headPoint() {
    return { x: this.container.x, y: this.container.y - this.s * 0.3 };
  }

  jump() {
    this.scene.tweens.add({ targets: this.body, scale: 1.2, duration: 120, yoyo: true, repeat: 3, ease: "Quad.easeOut" });
  }

  private animate() {
    this.wag?.remove();
    this.breathe?.remove();
    this.tail.setAngle(0);
    this.body.setScale(1);
    if (this.mood === "sleep") {
      this.breathe = this.scene.tweens.add({ targets: this.body, scaleX: 1.04, scaleY: 0.97, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      return;
    }
    const speed = this.mood === "happy" ? 70 : this.mood === "alert" ? 260 : 140;
    this.wag = this.scene.tweens.add({ targets: this.tail, angle: { from: -28, to: 28 }, duration: speed, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    if (this.mood === "sniff") this.breathe = this.scene.tweens.add({ targets: this.body, y: { from: 0, to: this.s * 0.04 }, duration: 120, yoyo: true, repeat: -1 });
  }

  private draw() {
    const g = this.gfx;
    const t = this.tail;
    const s = this.s;
    const fur = 0xd89a4e;
    const dark = 0x8d5434;
    const muzzle = 0xf6d7a7;
    g.clear();
    t.clear();
    if (this.mood === "sleep") {
      this.body.setAngle(0);
      g.fillStyle(fur, 1);
      g.lineStyle(3.5, INK, 1);
      g.fillCircle(0, s * 0.04, s * 0.3);
      g.strokeCircle(0, s * 0.04, s * 0.3);
      g.lineStyle(3, dark, 1);
      g.beginPath();
      g.arc(0, s * 0.04, s * 0.2, 0.2 * Math.PI, 1.3 * Math.PI);
      g.strokePath();
      g.fillStyle(fur, 1);
      g.lineStyle(3.5, INK, 1);
      g.fillCircle(-s * 0.1, s * 0.12, s * 0.17);
      g.strokeCircle(-s * 0.1, s * 0.12, s * 0.17);
      g.fillStyle(dark, 1);
      g.fillEllipse(-s * 0.24, s * 0.04, s * 0.12, s * 0.2);
      g.fillEllipse(0.02 * s, s * 0.0, s * 0.12, s * 0.2);
      g.fillStyle(muzzle, 1);
      g.fillEllipse(-s * 0.1, s * 0.2, s * 0.16, s * 0.1);
      g.fillStyle(INK, 1);
      g.fillCircle(-s * 0.1, s * 0.17, s * 0.025);
      g.lineStyle(2.5, INK, 1);
      g.beginPath();
      g.arc(-s * 0.16, s * 0.1, s * 0.03, 0.1 * Math.PI, 0.9 * Math.PI);
      g.strokePath();
      g.beginPath();
      g.arc(-s * 0.04, s * 0.1, s * 0.03, 0.1 * Math.PI, 0.9 * Math.PI);
      g.strokePath();
      t.fillStyle(fur, 1);
      t.lineStyle(3, INK, 1);
      t.fillEllipse(s * 0.22, s * 0.24, s * 0.22, s * 0.1);
      t.strokeEllipse(s * 0.22, s * 0.24, s * 0.22, s * 0.1);
      return;
    }
    this.body.setAngle(this.facing * 90);
    t.setPosition(0, s * 0.26);
    t.fillStyle(fur, 1);
    t.lineStyle(3, INK, 1);
    t.fillEllipse(0, s * 0.1, s * 0.08, s * 0.22);
    t.strokeEllipse(0, s * 0.1, s * 0.08, s * 0.22);
    g.fillStyle(fur, 1);
    g.lineStyle(3.5, INK, 1);
    g.fillEllipse(0, s * 0.08, s * 0.32, s * 0.5);
    g.strokeEllipse(0, s * 0.08, s * 0.32, s * 0.5);
    g.fillStyle(dark, 1);
    g.fillEllipse(s * 0.04, s * 0.12, s * 0.14, s * 0.16);
    const headY = this.mood === "sniff" ? -s * 0.26 : -s * 0.2;
    const earUp = this.mood === "alert" || this.mood === "happy";
    g.fillStyle(dark, 1);
    g.lineStyle(3, INK, 1);
    for (const side of [-1, 1]) {
      g.fillEllipse(side * s * 0.13, headY + (earUp ? -s * 0.08 : s * 0.02), s * 0.1, earUp ? s * 0.18 : s * 0.16);
      g.strokeEllipse(side * s * 0.13, headY + (earUp ? -s * 0.08 : s * 0.02), s * 0.1, earUp ? s * 0.18 : s * 0.16);
    }
    g.fillStyle(fur, 1);
    g.lineStyle(3.5, INK, 1);
    g.fillCircle(0, headY, s * 0.15);
    g.strokeCircle(0, headY, s * 0.15);
    g.fillStyle(muzzle, 1);
    g.fillEllipse(0, headY - s * 0.12, s * 0.14, s * 0.12);
    g.fillStyle(INK, 1);
    g.fillCircle(0, headY - s * 0.17, s * 0.035);
    if (this.mood === "happy") {
      g.fillStyle(0xef4f43, 1);
      g.fillEllipse(0, headY - s * 0.25, s * 0.06, s * 0.1);
    }
    const eyeY = headY - s * 0.04;
    if (this.mood === "happy") {
      g.lineStyle(2.5, INK, 1);
      for (const side of [-1, 1]) {
        g.beginPath();
        g.arc(side * s * 0.06, eyeY + s * 0.01, s * 0.03, Math.PI, 2 * Math.PI);
        g.strokePath();
      }
    } else {
      g.fillStyle(INK, 1);
      g.fillCircle(-s * 0.06, eyeY, s * (this.mood === "alert" ? 0.035 : 0.026));
      g.fillCircle(s * 0.06, eyeY, s * (this.mood === "alert" ? 0.035 : 0.026));
    }
  }
}

export class ClockView {
  readonly container: Phaser.GameObjects.Container;
  private pendulum: Phaser.GameObjects.Graphics;
  private bird: Phaser.GameObjects.Graphics;
  private door: Phaser.GameObjects.Graphics;
  private number: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    private s: number,
    font: string,
  ) {
    const g = scene.add.graphics();
    const w = s * 0.62;
    g.fillStyle(0x7c4527, 1);
    g.lineStyle(3.5, INK, 1);
    g.fillTriangle(-w * 0.62, -s * 0.18, w * 0.62, -s * 0.18, 0, -s * 0.48);
    g.strokeTriangle(-w * 0.62, -s * 0.18, w * 0.62, -s * 0.18, 0, -s * 0.48);
    g.fillStyle(0xb06c3f, 1);
    g.fillRect(-w / 2, -s * 0.2, w, s * 0.56);
    g.strokeRect(-w / 2, -s * 0.2, w, s * 0.56);
    g.fillStyle(0xfbf5e6, 1);
    g.fillCircle(0, s * 0.12, s * 0.17);
    g.strokeCircle(0, s * 0.12, s * 0.17);
    this.bird = scene.add.graphics();
    this.bird.fillStyle(0xffc83d, 1);
    this.bird.lineStyle(3, INK, 1);
    this.bird.fillCircle(0, 0, s * 0.09);
    this.bird.strokeCircle(0, 0, s * 0.09);
    this.bird.fillStyle(0xef4f43, 1);
    this.bird.fillTriangle(-s * 0.04, s * 0.02, s * 0.04, s * 0.02, 0, s * 0.11);
    this.bird.fillStyle(INK, 1);
    this.bird.fillCircle(-s * 0.035, -s * 0.02, s * 0.015);
    this.bird.fillCircle(s * 0.035, -s * 0.02, s * 0.015);
    this.bird.setPosition(0, -s * 0.24).setScale(0.2).setVisible(false);
    this.door = scene.add.graphics();
    this.door.fillStyle(0x55301e, 1);
    this.door.lineStyle(2.5, INK, 1);
    this.door.fillRect(-s * 0.08, -s * 0.34, s * 0.16, s * 0.12);
    this.door.strokeRect(-s * 0.08, -s * 0.34, s * 0.16, s * 0.12);
    this.pendulum = scene.add.graphics();
    this.pendulum.lineStyle(3, 0xffc83d, 1);
    this.pendulum.lineBetween(0, 0, 0, s * 0.34);
    this.pendulum.fillStyle(0xffc83d, 1);
    this.pendulum.fillCircle(0, s * 0.36, s * 0.06);
    this.pendulum.lineStyle(2.5, INK, 1);
    this.pendulum.strokeCircle(0, s * 0.36, s * 0.06);
    this.pendulum.setPosition(0, s * 0.34);
    this.number = scene.add.text(0, s * 0.12, "", { fontFamily: font, fontSize: `${Math.round(s * 0.24)}px`, color: "#1d1830", padding: { x: 2, y: 2 } }).setOrigin(0.5);
    this.container = scene.add.container(0, 0, [this.pendulum, g, this.door, this.bird, this.number]).setDepth(36);
    scene.tweens.add({ targets: this.pendulum, angle: { from: -16, to: 16 }, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  setCountdown(n: number) {
    this.number.setText(String(n));
    this.number.setColor(n === 1 ? "#ef4f43" : "#1d1830");
    this.door.setAlpha(n === 1 ? 0.45 : 1);
    if (n === 1) this.scene.tweens.add({ targets: this.number, scale: { from: 1.4, to: 1 }, duration: 260, ease: "Back.easeOut" });
  }

  sing() {
    this.bird.setVisible(true).setScale(0.2).setPosition(0, -this.s * 0.28);
    this.scene.tweens.add({ targets: this.bird, scale: 1.3, y: -this.s * 0.62, duration: 160, ease: "Back.easeOut", yoyo: true, hold: 520, onComplete: () => this.bird.setVisible(false) });
    this.scene.tweens.add({ targets: this.container, angle: { from: -3, to: 3 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => this.container.setAngle(0) });
  }
}
