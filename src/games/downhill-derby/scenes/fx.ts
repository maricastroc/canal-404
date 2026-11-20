import * as Phaser from "phaser";
import { INK } from "./cart";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: number; kind: "puff" | "chip" | "star" | "spark"; spin: number; rot: number; gravity: number };

const MAX = 420;

export class WorldFx {
  private readonly back: Phaser.GameObjects.Graphics;
  private readonly front: Phaser.GameObjects.Graphics;
  private readonly parts: Particle[] = [];
  private seed = 7;

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer) {
    this.back = scene.add.graphics();
    this.back.setDepth(9.4);
    this.front = scene.add.graphics();
    this.front.setDepth(12);
    layer.add(this.back);
    layer.add(this.front);
  }

  private rnd() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private push(p: Particle) {
    if (this.parts.length >= MAX) this.parts.shift();
    this.parts.push(p);
  }

  dust(x: number, y: number, speed: number, color = 0xe9dcc0, amount = 1) {
    for (let i = 0; i < amount; i += 1) {
      const life = 0.28 + this.rnd() * 0.3;
      this.push({ x: x + (this.rnd() - 0.5) * 20, y: y - 4, vx: -speed * (0.12 + this.rnd() * 0.12), vy: -40 - this.rnd() * 90, life, max: life, size: 7 + this.rnd() * 9, color, kind: "puff", spin: 0, rot: 0, gravity: -30 });
    }
  }

  impact(x: number, y: number, power: number, color = 0xe9dcc0) {
    const n = Math.round(6 + power * 10);
    for (let i = 0; i < n; i += 1) {
      const dir = this.rnd() < 0.5 ? -1 : 1;
      const life = 0.3 + this.rnd() * 0.25;
      this.push({ x, y: y - 6, vx: dir * (140 + this.rnd() * 320) * (0.6 + power), vy: -50 - this.rnd() * 160, life, max: life, size: 8 + this.rnd() * 10, color, kind: "puff", spin: 0, rot: 0, gravity: 120 });
    }
  }

  sparkle(x: number, y: number) {
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const life = 0.4;
      this.push({ x, y: y - 40, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420 - 80, life, max: life, size: 12, color: 0xffcf3f, kind: "star", spin: 6, rot: a, gravity: 300 });
    }
  }

  debris(x: number, y: number, vx: number, colors: number[]) {
    for (let i = 0; i < 9; i += 1) {
      const life = 0.8 + this.rnd() * 0.5;
      this.push({ x, y: y - 40, vx: vx * 0.4 + (this.rnd() - 0.3) * 520, vy: -300 - this.rnd() * 500, life, max: life, size: 10 + this.rnd() * 14, color: colors[i % colors.length], kind: "chip", spin: (this.rnd() - 0.5) * 18, rot: 0, gravity: 1800 });
    }
  }

  stars(x: number, y: number) {
    for (let i = 0; i < 4; i += 1) {
      const life = 0.7;
      const a = (i / 4) * Math.PI * 2;
      this.push({ x: x + Math.cos(a) * 36, y: y + Math.sin(a) * 14, vx: Math.cos(a + 1.6) * 90, vy: Math.sin(a + 1.6) * 30, life, max: life, size: 11, color: 0xffcf3f, kind: "star", spin: 5, rot: a, gravity: 0 });
    }
  }

  confetti(x: number, y: number, count: number) {
    const colors = [0xffcf3f, 0xf27aa8, 0x7fe0c4, 0x6fb6ff, 0xff7a4a];
    for (let i = 0; i < count; i += 1) {
      const life = 1.4 + this.rnd() * 0.8;
      const a = -Math.PI / 2 + (this.rnd() - 0.5) * 2.2;
      const v = 500 + this.rnd() * 700;
      this.push({ x: x + (this.rnd() - 0.5) * 200, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, size: 7 + this.rnd() * 6, color: colors[i % colors.length], kind: "chip", spin: (this.rnd() - 0.5) * 20, rot: 0, gravity: 700 });
    }
  }

  sparks(x: number, y: number, speed: number) {
    for (let i = 0; i < 2; i += 1) {
      const life = 0.18 + this.rnd() * 0.12;
      this.push({ x, y: y - 2, vx: -speed * (0.3 + this.rnd() * 0.3), vy: -80 - this.rnd() * 160, life, max: life, size: 4, color: 0xfff1a8, kind: "spark", spin: 0, rot: 0, gravity: 900 });
    }
  }

  update(dt: number) {
    this.back.clear();
    this.front.clear();
    for (let i = this.parts.length - 1; i >= 0; i -= 1) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= 1 - Math.min(1, dt * 2.2);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      const u = p.life / p.max;
      const g = p.kind === "puff" ? this.back : this.front;
      if (p.kind === "puff") {
        g.fillStyle(p.color, 0.75 * u);
        g.fillCircle(p.x, p.y, p.size * (1.6 - u * 0.6));
      } else if (p.kind === "chip") {
        const c = Math.cos(p.rot);
        const s = Math.sin(p.rot);
        const w = p.size;
        const h = p.size * 0.45;
        const pts = [
          new Phaser.Math.Vector2(p.x + (-w * c + h * s), p.y + (-w * s - h * c)),
          new Phaser.Math.Vector2(p.x + (w * c + h * s), p.y + (w * s - h * c)),
          new Phaser.Math.Vector2(p.x + (w * c - h * s), p.y + (w * s + h * c)),
          new Phaser.Math.Vector2(p.x + (-w * c - h * s), p.y + (-w * s + h * c)),
        ];
        g.fillStyle(INK, Math.min(1, u * 2));
        g.fillPoints(pts, true);
        g.fillStyle(p.color, Math.min(1, u * 2));
        g.fillPoints(pts.map((q) => new Phaser.Math.Vector2(p.x + (q.x - p.x) * 0.7, p.y + (q.y - p.y) * 0.5)), true);
      } else if (p.kind === "star") {
        star(g, p.x, p.y, p.size, p.rot, p.color, Math.min(1, u * 1.6));
      } else {
        g.fillStyle(p.color, u);
        g.fillCircle(p.x, p.y, p.size);
      }
    }
  }

  clear() {
    this.parts.length = 0;
    this.back.clear();
    this.front.clear();
  }
}

export function star(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, rot: number, color: number, alpha: number) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i += 1) {
    const a = rot + (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
  }
  g.fillStyle(INK, alpha);
  g.fillPoints(pts.map((p) => new Phaser.Math.Vector2(x + (p.x - x) * 1.35, y + (p.y - y) * 1.35)), true);
  g.fillStyle(color, alpha);
  g.fillPoints(pts, true);
}
