import type * as Phaser from "phaser";
import type { BandMember, Signal } from "../song/notation";

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
export type Spark = { born: number; color: number; seed: number; x?: number };

export const RING_GAP = 16;

const GHOST: Record<"show" | "assist", Record<Exclude<Signal, "clear">, number>> = { show: { weak: 0.55, lost: 0.42 }, assist: { weak: 0.9, lost: 0.75 } };
const LOST_HIDDEN_BEATS = 1;
const LOST_FADE_BEATS = 0.75;

export function ghostAlpha(signal: Exclude<Signal, "clear">, assist: boolean, seed: number, now: number, still: boolean, beatsAhead: number) {
  const base = GHOST[assist ? "assist" : "show"][signal];
  if (assist || signal === "weak") return base;
  const reveal = Math.max(0, Math.min(1, (beatsAhead - LOST_HIDDEN_BEATS) / LOST_FADE_BEATS));
  if (still) return base * reveal;
  const n = Math.sin((Math.floor(now / 70) + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return base * reveal * (0.6 + 0.4 * (n - Math.floor(n)));
}

export class IconPool {
  private readonly items: Phaser.GameObjects.Image[] = [];
  private used = 0;

  constructor(
    private readonly create: () => Phaser.GameObjects.Image,
    private readonly map: ((x: number, y: number) => { x: number; y: number }) | null = null,
  ) {}

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
    const p = this.map ? this.map(x, y) : { x, y };
    icon.setPosition(p.x, p.y).setDisplaySize(size, size).setAlpha(alpha).setVisible(true);
  }

  end() {
    for (let i = this.used; i < this.items.length; i += 1) this.items[i].setVisible(false);
  }
}

export function shade(g: G, dx: number, dy: number) {
  const a = -(g.rotation + (g.parentContainer?.rotation ?? 0));
  if (a === 0) return { x: dx, y: dy };
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
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

export function drawRegion(g: G, x0: number, x1: number, laneY: number, r: number, color: number, alpha: number, dashFrom: number | null = null) {
  const half = ribbon(r) - 3;
  if (x1 - x0 < 4) return;
  g.fillStyle(color, alpha).fillRect(x0, laneY - half, x1 - x0, half * 2);
  if (dashFrom === null) return;
  const dash = 18;
  const start = dashFrom + Math.ceil((x0 - dashFrom) / (dash * 2)) * dash * 2;
  for (let x = start - dash * 2; x < x1; x += dash * 2) {
    const a = Math.max(x0, x);
    const b = Math.min(x1, x + dash);
    if (b <= a) continue;
    g.fillStyle(color, 0.9).fillRect(a, laneY - half, b - a, 4).fillRect(a, laneY + half - 4, b - a, 4);
  }
}

export type TallyState = "waiting" | "done" | "miss";

export const TALLY_GAP = 26;

export function drawTally(g: G, x: number, y: number, kind: "call" | "echo", state: TallyState) {
  const s = 9;
  if (kind === "call") {
    const pts = [
      { x, y: y - s * 1.25 },
      { x: x + s, y },
      { x, y: y + s * 1.25 },
      { x: x - s, y },
    ];
    g.fillStyle(state === "done" ? C.plum300 : C.plum950, 1).fillPoints(pts, true);
    g.lineStyle(3, state === "done" ? C.ink : C.plum300, 1).strokePoints(pts, true);
    return;
  }
  g.fillStyle(state === "done" ? C.sun : state === "miss" ? C.tomato : C.plum950, 1).fillCircle(x, y, s);
  g.lineStyle(3, state === "waiting" ? C.sun : C.ink, 1).strokeCircle(x, y, s);
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
  const drop = shade(g, 3, 6);
  const shine = shade(g, -r * 0.42, -r * 0.42);
  g.fillStyle(C.ink, 0.55 * alpha).fillCircle(x + drop.x, y + drop.y, r);
  g.fillStyle(color, alpha).fillCircle(x, y, r);
  g.lineStyle(5, C.ink, alpha).strokeCircle(x, y, r);
  g.fillStyle(C.paper, 0.55 * alpha).fillCircle(x + shine.x, y + shine.y, r * 0.18);
  icons.place(x, y, r * 1.2, alpha);
}

export function drawTail(g: G, x0: number, x1: number, y: number, r: number, color: number, alpha: number, left: number, right: number) {
  const a = Math.max(left, x0);
  const b = Math.min(right, x1);
  if (b <= a || alpha <= 0) return;
  const h = r * 0.95;
  const drop = shade(g, 3, 5);
  g.fillStyle(C.ink, 0.45 * alpha).fillRoundedRect(a + drop.x, y - h / 2 + drop.y, b - a, h, h / 2);
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
  const drop = shade(g, 3, 6);
  g.fillStyle(C.ink, 0.5 * alpha).fillPoints(pts(drop.x, drop.y), true);
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

export type RingState = { pulse: number; flash: number; flashColor: number; shake: number; holding: boolean; listen?: boolean; press?: number; near?: number; progress?: number };

export function drawRingBase(g: G, x: number, y: number, r: number, o: RingState) {
  const R = r + RING_GAP + o.pulse * 3;
  const cx = x + o.shake;
  const glow = o.listen ? C.plum300 : C.sun;
  const near = o.near ?? 0;
  g.fillStyle(glow, 0.06 + 0.08 * o.pulse + 0.16 * near).fillCircle(cx, y, R + 30);
  if (o.flash > 0) g.fillStyle(o.flashColor, 0.45 * o.flash).fillCircle(cx, y, R + 30 + 14 * (1 - o.flash));
  g.fillStyle(C.plum950, 1).fillCircle(cx, y, R);
  if (o.flash > 0) g.fillStyle(o.flashColor, 0.12 * o.flash).fillCircle(cx, y, R);
  g.lineStyle(3, o.listen ? C.plum300 : C.cream, 0.3 + 0.45 * near).strokeCircle(cx, y, r);
}

export function drawRingFront(g: G, x: number, y: number, r: number, o: RingState) {
  const press = o.press ?? 0;
  const R = r + RING_GAP + o.pulse * 3;
  const cx = x + o.shake;
  const flashing = o.flash > 0.2;
  const lit = flashing || o.holding || press > 0.2;
  const bulb = o.listen ? C.plum300 : flashing ? o.flashColor : C.sunPale;
  for (let i = 0; i < 12; i += 1) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
    const bx = cx + Math.cos(a) * (R + 19);
    const by = y + Math.sin(a) * (R + 19);
    g.fillStyle(lit ? bulb : C.plum700, 1).fillCircle(bx, by, 5.5);
    g.lineStyle(3, C.ink, 1).strokeCircle(bx, by, 5.5);
  }
  g.lineStyle(17 + press * 6, C.ink, 1).strokeCircle(cx, y, R);
  g.lineStyle(10 + press * 6, o.listen ? C.plum300 : press > 0 && !o.holding ? C.sunPale : C.sun, 1).strokeCircle(cx, y, R);
  const progress = o.progress ?? 0;
  if (progress > 0) {
    g.lineStyle(10, C.paper, 1);
    g.beginPath();
    g.arc(cx, y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress));
    g.strokePath();
  }
}

export function drawBurst(g: G, x: number, y: number, r: number, color: number, k: number) {
  g.lineStyle(12 * (1 - k), color, 1 - k).strokeCircle(x, y, r + RING_GAP + k * 56);
}

export type PopStrength = "perfect" | "good" | "near" | "held";
const POP: Record<PopStrength, { width: number; reach: number }> = { perfect: { width: 14, reach: 1.15 }, good: { width: 10, reach: 0.9 }, near: { width: 6, reach: 0.55 }, held: { width: 12, reach: 1 } };

export function drawPop(g: G, icons: IconPool, x: number, y: number, r: number, color: number, tint: number, strength: PopStrength, k: number, still: boolean) {
  if (k < 0 || k >= 1) return;
  const spec = POP[strength];
  const grow = still ? 0 : k;
  const fade = 1 - k;
  if (strength !== "held") {
    const scale = 1 + 0.28 * grow;
    g.fillStyle(color, fade).fillCircle(x, y, r * scale);
    g.fillStyle(C.paper, 0.75 * Math.max(0, 1 - k * 2.5)).fillCircle(x, y, r * scale);
    g.lineStyle(5, C.ink, fade).strokeCircle(x, y, r * scale);
    icons.place(x, y, r * 1.2 * scale, fade);
  }
  g.lineStyle(spec.width * fade, tint, fade).strokeCircle(x, y, r * (1.05 + spec.reach * (still ? 0.5 : grow)));
}

export function drawSparks(g: G, x: number, y: number, r: number, sparks: Spark[], now: number, life: number) {
  for (const s of sparks) {
    const k = (now - s.born) / life;
    if (k < 0 || k >= 1) continue;
    for (let i = 0; i < 7; i += 1) {
      const a = s.seed + (i / 7) * Math.PI * 2;
      const d = r + RING_GAP + 8 + k * (70 + (i % 3) * 16);
      const px = (s.x ?? x) + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      const size = (1 - k) * (i % 2 ? 9 : 12);
      g.fillStyle(s.color, 1 - k * k);
      g.fillTriangle(px - size, py, px, py - size * 1.6, px + size, py);
      g.fillTriangle(px - size, py, px, py + size * 1.6, px + size, py);
    }
  }
}
