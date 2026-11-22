import type * as Phaser from "phaser";
import type { BandMember } from "../song/notation";

export const C = {
  ink: 0x1d1830,
  cream: 0xf7ecd4,
  cream2: 0xecd9b2,
  cream3: 0xdcc394,
  paper: 0xfbf5e6,
  plum950: 0x140f26,
  plum900: 0x1f1839,
  plum800: 0x2b2150,
  plum700: 0x3f3170,
  plum600: 0x5a4790,
  plum500: 0x7b62c4,
  plum300: 0xb9a6ef,
  sun: 0xffc83d,
  sunDeep: 0xeda21a,
  sunPale: 0xffe39a,
  tangerine: 0xff8a3d,
  tomato: 0xef4f43,
  bubblegum: 0xf06ba8,
  mint: 0x63d6c1,
  sky: 0x5cb9f0,
  gray: 0x6d6585,
};

export const MEMBER_COLOR: Record<BandMember, number> = { deco: C.tangerine, lina: C.bubblegum, bruno: C.mint, mila: C.plum300, "404": C.sun };

type G = Phaser.GameObjects.Graphics;
export type Track = { x: number; y: number; w: number; h: number };
export type Spark = { born: number; color: number; seed: number };

export const RING_GAP = 16;

export class IconPool {
  private readonly items: Phaser.GameObjects.Image[] = [];
  private used = 0;

  constructor(private readonly create: () => Phaser.GameObjects.Image) {}

  begin() {
    this.used = 0;
  }

  place(x: number, y: number, size: number, alpha: number) {
    let icon = this.items[this.used];
    if (!icon) {
      icon = this.create();
      this.items.push(icon);
    }
    this.used += 1;
    icon.setPosition(x, y).setDisplaySize(size, size).setAlpha(alpha).setVisible(true);
  }

  end() {
    for (let i = this.used; i < this.items.length; i += 1) this.items[i].setVisible(false);
  }
}

export function ribbon(r: number) {
  return r * 1.3;
}

export function drawTrack(g: G, t: Track, laneY: number, r: number) {
  const half = ribbon(r);
  g.fillStyle(C.plum950, 1).fillRoundedRect(t.x, t.y, t.w, t.h, Math.min(26, t.h / 4));
  g.fillStyle(C.plum800, 1).fillRoundedRect(t.x + 6, laneY - half, t.w - 12, half * 2, half);
  g.lineStyle(3, C.plum700, 1).strokeRoundedRect(t.x + 6, laneY - half, t.w - 12, half * 2, half);
  const gap = r * 0.42;
  for (let i = -2; i <= 2; i += 1) g.lineStyle(2, C.plum600, 0.7).lineBetween(t.x + half, laneY + i * gap, t.x + t.w - half, laneY + i * gap);
}

export function drawBeatLine(g: G, x: number, laneY: number, r: number, strong: boolean) {
  const half = strong ? ribbon(r) - 4 : r * 0.84;
  g.fillStyle(strong ? C.plum500 : C.plum600, strong ? 0.95 : 0.8).fillRect(x - (strong ? 2.5 : 1.5), laneY - half, strong ? 5 : 3, half * 2);
}

export function drawRegion(g: G, x0: number, x1: number, laneY: number, r: number, color: number, alpha: number) {
  const half = ribbon(r) - 3;
  if (x1 - x0 < 4) return;
  g.fillStyle(color, alpha).fillRect(x0, laneY - half, x1 - x0, half * 2);
}

export function drawNote(g: G, icons: IconPool, x: number, y: number, r: number, color: number, alpha = 1, streaks = true) {
  if (alpha <= 0) return;
  if (streaks) {
    for (let i = 0; i < 3; i += 1) {
      const dy = (i - 1) * r * 0.5;
      const len = r * (i === 1 ? 0.9 : 0.55);
      g.lineStyle(5, color, 0.35 * alpha).lineBetween(x + r + 10, y + dy, x + r + 10 + len, y + dy);
    }
  }
  g.fillStyle(C.ink, 0.55 * alpha).fillCircle(x + 3, y + 6, r);
  g.fillStyle(color, alpha).fillCircle(x, y, r);
  g.lineStyle(5, C.ink, alpha).strokeCircle(x, y, r);
  g.fillStyle(C.paper, 0.55 * alpha).fillCircle(x - r * 0.42, y - r * 0.42, r * 0.18);
  icons.place(x, y, r * 1.2, alpha);
}

export function drawTail(g: G, x0: number, x1: number, y: number, r: number, color: number, alpha: number, left: number, right: number) {
  const a = Math.max(left, x0);
  const b = Math.min(right, x1);
  if (b <= a || alpha <= 0) return;
  const h = r * 0.95;
  g.fillStyle(C.ink, 0.45 * alpha).fillRoundedRect(a + 3, y - h / 2 + 5, b - a, h, h / 2);
  g.fillStyle(color, alpha).fillRoundedRect(a, y - h / 2, b - a, h, h / 2);
  g.lineStyle(4, C.ink, alpha).strokeRoundedRect(a, y - h / 2, b - a, h, h / 2);
  g.fillStyle(C.paper, 0.35 * alpha).fillRoundedRect(a + 8, y - h / 2 + 6, Math.max(0, b - a - 16), h * 0.18, h * 0.09);
  if (x1 <= right && x1 - x0 > r) {
    g.fillStyle(color, alpha).fillCircle(x1 - h / 2, y, h * 0.32);
    g.lineStyle(4, C.ink, alpha).strokeCircle(x1 - h / 2, y, h * 0.32);
  }
}

export function drawCall(g: G, x: number, y: number, r: number, alpha: number) {
  if (alpha <= 0) return;
  const pts = (dx: number, dy: number) => [
    { x: x + dx, y: y + dy - r * 0.9 },
    { x: x + dx + r * 0.75, y: y + dy },
    { x: x + dx, y: y + dy + r * 0.9 },
    { x: x + dx - r * 0.75, y: y + dy },
  ];
  g.fillStyle(C.ink, 0.5 * alpha).fillPoints(pts(3, 6), true);
  g.fillStyle(C.plum300, alpha).fillPoints(pts(0, 0), true);
  g.lineStyle(5, C.ink, alpha).strokePoints(pts(0, 0), true);
}

export function drawEcho(g: G, x: number, y: number, r: number, alpha: number, color: number = C.sun) {
  if (alpha <= 0) return;
  const segments = 12;
  for (let i = 0; i < segments; i += 1) {
    const a0 = (i / segments) * Math.PI * 2;
    g.lineStyle(6, color, alpha);
    g.beginPath();
    g.arc(x, y, r * 0.72, a0, a0 + (Math.PI * 2) / segments / 1.8);
    g.strokePath();
  }
}

export type RingState = { pulse: number; flash: number; flashColor: number; lit: number; shake: number; holding: boolean };

export function drawRingBase(g: G, x: number, y: number, r: number, o: RingState) {
  const R = r + RING_GAP + o.pulse * 5;
  const cx = x + o.shake;
  g.fillStyle(C.sun, 0.1 + 0.12 * o.pulse).fillCircle(cx, y, R + 36);
  g.fillStyle(C.plum950, 1).fillCircle(cx, y, R);
  g.fillStyle(C.sun, 0.07 + 0.06 * o.pulse).fillCircle(cx, y, r);
  if (o.flash > 0) g.fillStyle(o.flashColor, 0.7 * o.flash).fillCircle(cx, y, R);
  const dash = 16;
  for (let i = 0; i < dash; i += 1) {
    const a0 = (i / dash) * Math.PI * 2;
    g.lineStyle(3, C.cream, 0.5);
    g.beginPath();
    g.arc(cx, y, r, a0, a0 + (Math.PI * 2) / dash / 2);
    g.strokePath();
  }
}

export function drawRingFront(g: G, x: number, y: number, r: number, o: RingState) {
  const R = r + RING_GAP + o.pulse * 5;
  const cx = x + o.shake;
  const bulbs = 12;
  for (let i = 0; i < bulbs; i += 1) {
    const a = -Math.PI / 2 + (i / bulbs) * Math.PI * 2;
    const on = o.flash > 0.2 || o.holding || (((i + Math.floor(o.lit)) % 3) + 3) % 3 === 0;
    const bx = cx + Math.cos(a) * (R + 20);
    const by = y + Math.sin(a) * (R + 20);
    g.fillStyle(on ? C.sunPale : C.plum600, 1).fillCircle(bx, by, 6.5);
    g.lineStyle(3, C.ink, 1).strokeCircle(bx, by, 6.5);
  }
  g.lineStyle(17, C.ink, 1).strokeCircle(cx, y, R);
  g.lineStyle(10, o.holding ? C.sunPale : C.sun, 1).strokeCircle(cx, y, R);
}

export function drawBurst(g: G, x: number, y: number, r: number, color: number, k: number) {
  g.lineStyle(12 * (1 - k), color, 1 - k).strokeCircle(x, y, r + RING_GAP + k * 56);
}

export function drawSparks(g: G, x: number, y: number, r: number, sparks: Spark[], now: number, life: number) {
  for (const s of sparks) {
    const k = (now - s.born) / life;
    if (k < 0 || k >= 1) continue;
    for (let i = 0; i < 7; i += 1) {
      const a = s.seed + (i / 7) * Math.PI * 2;
      const d = r + RING_GAP + 8 + k * (70 + (i % 3) * 16);
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      const size = (1 - k) * (i % 2 ? 9 : 12);
      g.fillStyle(s.color, 1 - k * k);
      g.fillTriangle(px - size, py, px, py - size * 1.6, px + size, py);
      g.fillTriangle(px - size, py, px, py + size * 1.6, px + size, py);
    }
  }
}
