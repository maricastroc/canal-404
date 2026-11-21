import type * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import type { Layout } from "./layout";

const INK = "#1d1830";
const INK_HEX = 0x1d1830;
const PAPER = 0xfbf5e6;

export type BubbleTone = "normal" | "shout" | "whisper" | "thought" | "scare" | "cheer";

export type Speaker = { name: string; color: number };

export type SayOptions = { tone?: BubbleTone; duration?: number; depth?: number; avoid?: Box[]; area?: Box; speaker?: Speaker };

export type Box = { x: number; y: number; w: number; h: number };

const BUBBLE_FILL: Record<Exclude<BubbleTone, "whisper" | "thought">, number> = { normal: PAPER, scare: 0xfff4ef, shout: 0xffe39a, cheer: 0xfff3b8 };

function sparkle(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.38 : r;
    pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
  }
  g.fillStyle(INK_HEX, 1);
  g.fillPoints(pts.map((p) => ({ x: p.x + 2, y: p.y + 3 })), true);
  g.fillStyle(0xffd23d, 1);
  g.fillPoints(pts, true);
  g.lineStyle(2.5, INK_HEX, 1);
  g.strokePoints(pts, true);
}

function overlap(a: Box, b: Box) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function burst(w: number, h: number) {
  const pts: { x: number; y: number }[] = [];
  const n = 18;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 2 ? 1 : 1.16;
    pts.push({ x: Math.cos(a) * (w / 2) * r, y: Math.sin(a) * (h / 2) * r });
  }
  return pts;
}

export function say(scene: Phaser.Scene, layout: Layout, fonts: Fonts, x: number, y: number, text: string, opts: SayOptions = {}) {
  const { tone: asked = "normal", duration = 1600, depth = 60, avoid = [], area, speaker } = opts;
  const tone = asked === "whisper" || asked === "thought" ? "normal" : asked;
  const s = layout.tile;
  const size = Math.round(Math.max(18, s * (tone === "shout" ? 0.25 : 0.2)));
  const family = tone === "shout" ? fonts.display : (fonts.round ?? fonts.body);
  const label = scene.add
    .text(0, 0, text, {
      fontFamily: family,
      fontSize: `${size}px`,
      fontStyle: tone === "shout" ? "normal" : "600",
      color: INK,
      align: "center",
      padding: { x: 4, y: 4 },
      wordWrap: { width: Math.max(s * 3.2, 260) },
      lineSpacing: 2,
    })
    .setOrigin(0.5);
  const padX = tone === "shout" ? size * 1.05 : size * 0.85;
  const padY = tone === "shout" ? size * 0.75 : size * 0.5;
  const tagged = !!speaker;
  const w = Math.max(label.width + padX * 2, size * (tone === "shout" ? 5.2 : tagged ? 5 : 4.2));
  const h = label.height + padY * 2 + (tagged ? size * 0.22 : 0);
  const gap = s * 0.32;
  const top = tagged ? size * 0.9 : 0;
  const b = layout.board;
  const bounds: Box = area ?? { x: 8, y: 8, w: layout.notebook.x - 16, h: layout.H - 16 };
  const candidates = [
    { cx: x, cy: y - gap - h / 2 },
    { cx: x + w * 0.42, cy: y - gap - h / 2 },
    { cx: x - w * 0.42, cy: y - gap - h / 2 },
    { cx: x + gap + w / 2, cy: y - h * 0.15 },
    { cx: x - gap - w / 2, cy: y - h * 0.15 },
    { cx: x + gap + w / 2, cy: y - gap - h * 0.6 },
    { cx: x - gap - w / 2, cy: y - gap - h * 0.6 },
    { cx: x, cy: y - gap * 2.4 - h / 2 },
    { cx: x + gap + w / 2, cy: y + h * 0.45 },
    { cx: x - gap - w / 2, cy: y + h * 0.45 },
  ];
  let best = candidates[0];
  let bestScore = Infinity;
  candidates.forEach((c, i) => {
    const box: Box = { x: c.cx - w / 2, y: c.cy - h / 2 - top, w, h: h + top };
    let score = i * 25;
    const ex = Math.max(box.x, Math.min(box.x + box.w, x));
    const ey = Math.max(box.y, Math.min(box.y + box.h, y));
    score += Math.hypot(ex - x, ey - y) * 6;
    for (const a of avoid) score += overlap(box, a) * 3;
    const outX = Math.max(0, bounds.x - box.x) + Math.max(0, box.x + box.w - (bounds.x + bounds.w));
    const outY = Math.max(0, bounds.y - box.y) + Math.max(0, box.y + box.h - (bounds.y + bounds.h));
    score += (outX + outY) * 400;
    if (box.y < b.y - h * 0.6) score += 200;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  });
  const cx = Math.max(bounds.x + w / 2, Math.min(bounds.x + bounds.w - w / 2, best.cx));
  const cy = Math.max(bounds.y + h / 2 + top, Math.min(bounds.y + bounds.h - h / 2, best.cy));
  const g = scene.add.graphics();
  const fill = BUBBLE_FILL[tone];
  const tipX = x - cx;
  const tipY = y - cy;
  const lw = tone === "shout" ? 5 : 4;
  const r = Math.min(20, h / 2);
  const edgeX = Math.max(-w / 2 + r, Math.min(w / 2 - r, tipX * 0.5));
  const edgeY = tipY > 0 ? h / 2 : -h / 2;
  const sideTail = Math.abs(tipY) < h / 2;
  const baseA = sideTail ? { x: Math.sign(tipX) * (w / 2 - 2), y: -size * 0.35 } : { x: edgeX - size * 0.42, y: edgeY - Math.sign(edgeY) * 2 };
  const baseB = sideTail ? { x: Math.sign(tipX) * (w / 2 - 2), y: size * 0.35 } : { x: edgeX + size * 0.42, y: edgeY - Math.sign(edgeY) * 2 };
  const len = Math.hypot(tipX, tipY);
  const stop = Math.max(0, len - s * 0.1);
  const tip = { x: (tipX / Math.max(1, len)) * stop, y: (tipY / Math.max(1, len)) * stop };
  const tail = Math.abs(tip.x) > w / 2 + size * 0.4 || Math.abs(tip.y) > h / 2 + size * 0.4;
  const shadow = (dx: number, dy: number) => {
    g.fillStyle(INK_HEX, 0.85);
    if (tone === "shout") g.fillPoints(burst(w, h).map((p) => ({ x: p.x + dx, y: p.y + dy })), true);
    else g.fillRoundedRect(-w / 2 + dx, -h / 2 + dy, w, h, r);
  };
  shadow(4, 6);
  if (tail) {
    g.fillStyle(INK_HEX, 0.85);
    g.fillTriangle(baseA.x + 4, baseA.y + 6, baseB.x + 4, baseB.y + 6, tip.x + 4, tip.y + 6);
  }
  g.fillStyle(fill, 1);
  if (tone === "shout") g.fillPoints(burst(w, h), true);
  else g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
  if (tail) g.fillTriangle(baseA.x, baseA.y, baseB.x, baseB.y, tip.x, tip.y);
  g.lineStyle(lw, INK_HEX, 1);
  if (tone === "shout") g.strokePoints(burst(w, h), true);
  else g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  if (tail) {
    g.fillStyle(fill, 1);
    g.fillRect(Math.min(baseA.x, baseB.x) + 3, sideTail ? baseA.y + 2 : edgeY - (edgeY > 0 ? lw + 1 : -1), Math.abs(baseB.x - baseA.x) - 6 + (sideTail ? lw + 2 : 0), sideTail ? baseB.y - baseA.y - 4 : lw + 1);
    g.lineBetween(baseA.x, baseA.y, tip.x, tip.y);
    g.lineBetween(baseB.x, baseB.y, tip.x, tip.y);
  }
  if (tone === "scare") {
    g.lineStyle(2.5, 0xef4f43, 0.9);
    g.strokeRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, Math.max(4, r - 6));
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      g.lineStyle(3.5, INK_HEX, 1);
      g.lineBetween(sx * (w / 2 + 6), sy * (h / 2 - 4), sx * (w / 2 + 16), sy * (h / 2 + 4));
      g.lineBetween(sx * (w / 2 - 6), sy * (h / 2 + 6), sx * (w / 2 + 2), sy * (h / 2 + 16));
    }
  }
  if (tone === "cheer") {
    sparkle(g, w / 2 - 4, -h / 2 - 2, size * 0.5);
    sparkle(g, -w / 2 + 8, h / 2 + 2, size * 0.36);
    sparkle(g, w / 2 + size * 0.5, h / 2 - size * 0.3, size * 0.28);
  }
  if (tone === "normal" || tone === "scare" || tone === "cheer") {
    g.lineStyle(3, 0xffffff, 0.8);
    g.lineBetween(-w / 2 + r * 0.8, -h / 2 + 7, -w / 2 + r * 0.8 + Math.min(w * 0.22, 60), -h / 2 + 7);
  }
  const parts: Phaser.GameObjects.GameObject[] = [g, label];
  if (tone === "scare") {
    const br = size * 0.5;
    const bx = w / 2 - br * 0.4;
    const by = -h / 2 - br * 0.2;
    const badge = scene.add.graphics();
    badge.fillStyle(INK_HEX, 1);
    badge.fillCircle(bx + 3, by + 4, br + 2);
    badge.fillStyle(0xff9d8a, 1);
    badge.fillCircle(bx, by, br);
    badge.lineStyle(3, INK_HEX, 1);
    badge.strokeCircle(bx, by, br);
    const mark = scene.add.text(bx, by, "!", { fontFamily: fonts.display, fontSize: `${Math.round(br * 1.4)}px`, color: INK, padding: { x: 2, y: 2 } }).setOrigin(0.5);
    parts.push(badge, mark);
  }
  if (tagged && speaker) {
    const tagSize = Math.round(Math.max(16, size * 0.6));
    const tagText = scene.add.text(0, 0, speaker.name.toUpperCase(), { fontFamily: fonts.display, fontSize: `${tagSize}px`, color: INK, padding: { x: 3, y: 3 } }).setOrigin(0.5);
    const tw = tagText.width + tagSize * 0.9;
    const th = tagSize * 1.45;
    const tx = -w / 2 + tw / 2 + Math.min(18, w * 0.08);
    const ty = -h / 2 - th * 0.12;
    const tag = scene.add.graphics();
    tag.fillStyle(INK_HEX, 1);
    tag.fillRoundedRect(tx - tw / 2 + 3, ty - th / 2 + 4, tw, th, th * 0.32);
    tag.fillStyle(speaker.color, 1);
    tag.fillRoundedRect(tx - tw / 2, ty - th / 2, tw, th, th * 0.32);
    tag.lineStyle(3, INK_HEX, 1);
    tag.strokeRoundedRect(tx - tw / 2, ty - th / 2, tw, th, th * 0.32);
    tagText.setPosition(tx, ty);
    const tagBox = scene.add.container(0, 0, [tag, tagText]).setAngle(-2);
    parts.push(tagBox);
  }
  label.setPosition(0, (tone === "shout" ? 2 : 0) + (tagged ? size * 0.16 : 0));
  const container = scene.add.container(cx, cy, parts).setDepth(depth).setScale(0.3);
  if (tone === "shout") container.setAngle(-3);
  if (tone === "cheer") container.setAngle(2);
  container.setData("box", { x: cx - w / 2, y: cy - h / 2 - top, w, h: h + top } satisfies Box);
  scene.tweens.add({ targets: container, scale: 1, duration: tone === "cheer" ? 320 : 220, ease: "Back.easeOut" });
  if (tone === "shout") scene.tweens.add({ targets: container, angle: { from: -5, to: 2 }, duration: 70, yoyo: true, repeat: 3 });
  if (tone === "scare") scene.tweens.add({ targets: container, x: { from: cx - 5, to: cx + 5 }, duration: 45, yoyo: true, repeat: 4, onComplete: () => container.setX(cx) });
  if (tone === "cheer") scene.tweens.add({ targets: container, angle: -2, y: cy - 6, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  scene.time.delayedCall(duration, () => {
    if (!container.active) return;
    scene.tweens.add({ targets: container, alpha: 0, y: cy - 10, duration: 260, onComplete: () => container.destroy() });
  });
  return container;
}

export function pop(scene: Phaser.Scene, fonts: Fonts, x: number, y: number, text: string, size: number, color = "#ffc83d", depth = 58) {
  const t = scene.add
    .text(x, y, text, { fontFamily: fonts.display, fontSize: `${size}px`, color, stroke: INK, strokeThickness: Math.max(4, size * 0.16), padding: { x: 4, y: 4 } })
    .setOrigin(0.5)
    .setDepth(depth)
    .setScale(0.2);
  scene.tweens.add({ targets: t, scale: 1, duration: 200, ease: "Back.easeOut" });
  scene.tweens.add({ targets: t, y: y - size * 0.6, alpha: 0, delay: 700, duration: 380, onComplete: () => t.destroy() });
  return t;
}

export function floatZ(scene: Phaser.Scene, fonts: Fonts, x: number, y: number, size: number, depth = 40) {
  const t = scene.add
    .text(x, y, "z", { fontFamily: fonts.hand, fontSize: `${size}px`, color: "#d8d0ff", padding: { x: 2, y: 2 } })
    .setOrigin(0.5)
    .setDepth(depth)
    .setAlpha(0);
  scene.tweens.add({ targets: t, alpha: { from: 0, to: 0.9 }, duration: 300, yoyo: true, hold: 700 });
  scene.tweens.add({ targets: t, x: x + size * 0.9, y: y - size * 1.6, scale: 1.5, duration: 1300, ease: "Sine.easeOut", onComplete: () => t.destroy() });
}

export function noiseRing(scene: Phaser.Scene, x: number, y: number, radius: number, color: number, depth = 30) {
  for (let i = 0; i < 3; i += 1) {
    const g = scene.add.graphics().setDepth(depth).setPosition(x, y);
    g.lineStyle(5, color, 0.9);
    g.strokeCircle(0, 0, radius * 0.25);
    g.setScale(0.4).setAlpha(0);
    scene.tweens.add({ targets: g, scale: 4, alpha: { from: 0.9, to: 0 }, delay: i * 140, duration: 700, ease: "Sine.easeOut", onComplete: () => g.destroy() });
  }
}

export function squiggle(scene: Phaser.Scene, fonts: Fonts, x: number, y: number, text: string, size: number, color = "#d7cdfa", depth = 50) {
  const t = scene.add
    .text(x, y, text, { fontFamily: fonts.display, fontSize: `${size}px`, color, stroke: INK, strokeThickness: Math.max(3, size * 0.14), padding: { x: 4, y: 4 } })
    .setOrigin(0.5)
    .setDepth(depth)
    .setAngle(-8);
  scene.tweens.add({ targets: t, angle: 8, duration: 60, yoyo: true, repeat: 5 });
  scene.tweens.add({ targets: t, y: y - size, alpha: 0, delay: 500, duration: 400, onComplete: () => t.destroy() });
}

export function soundLine(scene: Phaser.Scene, x0: number, y0: number, x1: number, y1: number, s: number, depth = 52) {
  const g = scene.add.graphics().setDepth(depth);
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const steps = Math.max(2, Math.floor(len / (s * 0.45)));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const cx = x0 + (x1 - x0) * t;
    const cy = y0 + (y1 - y0) * t;
    g.lineStyle(Math.max(3, s * 0.04), 0xd9ccff, 0.95);
    g.beginPath();
    g.arc(cx, cy, s * 0.14, ang - 0.7, ang + 0.7);
    g.strokePath();
  }
  g.setAlpha(0);
  scene.tweens.add({ targets: g, alpha: 1, duration: 120, hold: 650, yoyo: true, onComplete: () => g.destroy() });
}

export function sightLine(scene: Phaser.Scene, x0: number, y0: number, x1: number, y1: number, s: number, depth = 52) {
  const g = scene.add.graphics().setDepth(depth);
  const len = Math.hypot(x1 - x0, y1 - y0);
  const dash = s * 0.12;
  g.lineStyle(Math.max(4, s * 0.05), 0xef4f43, 1);
  for (let d = 0; d < len; d += dash * 2) {
    const t0 = d / len;
    const t1 = Math.min(1, (d + dash) / len);
    g.lineBetween(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0, x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1);
  }
  g.lineStyle(Math.max(4, s * 0.05), 0xef4f43, 1);
  g.strokeCircle(x1, y1, s * 0.42);
  g.setAlpha(0);
  scene.tweens.add({ targets: g, alpha: 1, duration: 140, hold: 1600, yoyo: true, onComplete: () => g.destroy() });
}
