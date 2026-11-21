import type * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import type { Layout } from "./layout";

const INK = "#1d1830";
const INK_HEX = 0x1d1830;
const PAPER = 0xfbf5e6;

export type BubbleTone = "normal" | "shout" | "whisper" | "thought";

export function say(scene: Phaser.Scene, layout: Layout, fonts: Fonts, x: number, y: number, text: string, tone: BubbleTone = "normal", duration = 1600, depth = 60) {
  const size = Math.round(layout.tile * (tone === "shout" ? 0.42 : tone === "whisper" ? 0.27 : 0.32));
  const label = scene.add
    .text(0, 0, text, {
      fontFamily: tone === "shout" ? fonts.display : fonts.hand,
      fontSize: `${size}px`,
      color: INK,
      align: "center",
      padding: { x: 4, y: 4 },
      wordWrap: { width: layout.tile * 4.2 },
    })
    .setOrigin(0.5);
  const w = label.width + size * 1.1;
  const h = label.height + size * 0.6;
  const g = scene.add.graphics();
  const top = -h - size * 0.9;
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(-w / 2 + 4, top + 5, w, h, Math.min(22, h / 2));
  g.fillStyle(tone === "shout" ? 0xffe39a : PAPER, 1);
  g.fillRoundedRect(-w / 2, top, w, h, Math.min(22, h / 2));
  g.lineStyle(tone === "shout" ? 5 : 3.5, INK_HEX, 1);
  g.strokeRoundedRect(-w / 2, top, w, h, Math.min(22, h / 2));
  if (tone === "thought") {
    g.fillStyle(PAPER, 1);
    g.fillCircle(0, -size * 0.55, size * 0.18);
    g.strokeCircle(0, -size * 0.55, size * 0.18);
    g.fillCircle(size * 0.12, -size * 0.2, size * 0.1);
    g.strokeCircle(size * 0.12, -size * 0.2, size * 0.1);
  } else {
    g.fillStyle(tone === "shout" ? 0xffe39a : PAPER, 1);
    g.fillTriangle(-size * 0.3, top + h - 2, size * 0.3, top + h - 2, 0, -size * 0.1);
    g.lineStyle(tone === "shout" ? 5 : 3.5, INK_HEX, 1);
    g.lineBetween(-size * 0.3, top + h - 1, 0, -size * 0.1);
    g.lineBetween(size * 0.3, top + h - 1, 0, -size * 0.1);
  }
  label.setPosition(0, top + h / 2);
  const minX = w / 2 + 8;
  const maxX = layout.W - w / 2 - 8;
  const cx = Math.max(minX, Math.min(maxX, x));
  const cy = Math.max(-top + 8, y);
  const container = scene.add.container(cx, cy, [g, label]).setDepth(depth).setScale(0.3).setAlpha(tone === "whisper" ? 0.85 : 1);
  scene.tweens.add({ targets: container, scale: 1, duration: 220, ease: "Back.easeOut" });
  if (tone === "shout") scene.tweens.add({ targets: container, angle: { from: -4, to: 4 }, duration: 70, yoyo: true, repeat: 3 });
  scene.time.delayedCall(duration, () => {
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
