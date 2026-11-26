import * as Phaser from "phaser";
import { FLOOR_Y } from "../config";
import type { LabCopy } from "../copy";
import { goalLayout } from "../geometry";
import type { Block, LevelDef, Rect } from "../levels";
import type { LabSfx } from "../sounds";
import { INK_HEX, cartoonText, type Fonts } from "../../kit/ui";

const WOOD = 0xf2c48a;
const WOOD_DARK = 0xd9a066;
const METAL = 0xb8c2d1;
const METAL_DARK = 0x8d98ab;

function drawBox(g: Phaser.GameObjects.Graphics, w: number, h: number, fill: number, radius: number) {
  g.fillStyle(INK_HEX, 1);
  g.fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, radius);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  g.lineStyle(5, INK_HEX, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
}

export function drawBlock(scene: Phaser.Scene, b: Block) {
  const g = scene.add.graphics();
  const { w, h } = b;
  const r = Math.min(8, h / 2 - 1, w / 2 - 1);
  switch (b.kind) {
    case "shelf": {
      g.lineStyle(5, INK_HEX, 1);
      g.fillStyle(0x8d98ab, 1);
      for (const sx of [-w / 2 + 44, w / 2 - 44]) {
        g.fillTriangle(sx - 6, h / 2, sx + 18, h / 2, sx - 6, h / 2 + 30);
        g.strokeTriangle(sx - 6, h / 2, sx + 18, h / 2, sx - 6, h / 2 + 30);
      }
      drawBox(g, w, h, WOOD, r);
      g.lineStyle(3, WOOD_DARK, 1);
      g.lineBetween(-w / 2 + 16, -2, -w / 2 + w * 0.42, -2);
      g.lineBetween(-w / 2 + w * 0.55, 4, w / 2 - 18, 4);
      g.lineStyle(3, 0xfff1d6, 0.9);
      g.lineBetween(-w / 2 + 10, -h / 2 + 6, w / 2 - 10, -h / 2 + 6);
      break;
    }
    case "counter": {
      g.lineStyle(5, INK_HEX, 1);
      g.fillStyle(0x8d98ab, 1);
      for (const sx of [-w / 2 + 50, w / 2 - 50]) {
        g.fillTriangle(sx - 8, h / 2, sx + 22, h / 2, sx - 8, h / 2 + 36);
        g.strokeTriangle(sx - 8, h / 2, sx + 22, h / 2, sx - 8, h / 2 + 36);
      }
      drawBox(g, w, h, 0x63d6c1, r);
      g.fillStyle(0xfbf5e6, 1);
      g.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, 10, 4);
      g.lineStyle(4, INK_HEX, 1);
      g.lineBetween(-w / 2 + 2, -h / 2 + 13, w / 2 - 2, -h / 2 + 13);
      break;
    }
    case "cabinet": {
      drawBox(g, w, h, 0x7b62c4, 8);
      g.lineStyle(4, INK_HEX, 1);
      g.strokeRoundedRect(-w / 2 + 10, -h / 2 + 14, w - 20, h - 28, 6);
      g.fillStyle(0xffc83d, 1);
      g.fillCircle(w / 2 - 20, 0, 6);
      g.strokeCircle(w / 2 - 20, 0, 6);
      g.fillStyle(0x9a84e0, 1);
      g.fillRect(-w / 2 + 6, -h / 2 + 4, w - 12, 5);
      break;
    }
    case "metal": {
      drawBox(g, w, h, METAL, 6);
      g.fillStyle(0xdde3ec, 1);
      if (w >= h) g.fillRect(-w / 2 + 6, -h / 2 + 4, w - 12, 5);
      else g.fillRect(-w / 2 + 5, -h / 2 + 6, 6, h - 12);
      g.fillStyle(METAL_DARK, 1);
      g.lineStyle(2.5, INK_HEX, 1);
      const long = Math.max(w, h);
      for (let d = -long / 2 + 26; d <= long / 2 - 20; d += 64) {
        const px = w >= h ? d : 0;
        const py = w >= h ? 0 : d;
        g.fillCircle(px, py, 5);
        g.strokeCircle(px, py, 5);
      }
      break;
    }
    case "crate": {
      drawBox(g, w, h, WOOD, 6);
      g.lineStyle(4, WOOD_DARK, 1);
      g.lineBetween(-w / 2 + 8, -h / 2 + 8, w / 2 - 8, h / 2 - 8);
      break;
    }
    case "pole": {
      g.fillStyle(INK_HEX, 1);
      g.fillRect(-w / 2 - 2, -h / 2, w + 4, h);
      g.fillStyle(METAL, 1);
      g.fillRect(-w / 2 + 2, -h / 2, w - 4, h);
      g.fillStyle(0xdde3ec, 1);
      g.fillRect(-w / 2 + 4, -h / 2, 4, h);
      break;
    }
  }
  return scene.add.container(b.x, b.y, [g]).setAngle(b.angle ?? 0).setDepth(3);
}

function overlapArea(a: Rect, b: Rect) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

export function drawBuildArea(scene: Phaser.Scene, r: Rect, fonts: Fonts, text: string, avoid: Rect[] = []) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.14);
  g.fillRoundedRect(r.x, r.y, r.w, r.h, 18);
  g.lineStyle(4, 0xfbf5e6, 0.95);
  const dash = 22;
  const gap = 14;
  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    for (let d = 0; d < len; d += dash + gap) {
      const e = Math.min(len, d + dash);
      g.lineBetween(x1 + ux * d, y1 + uy * d, x1 + ux * e, y1 + uy * e);
    }
  };
  const inset = 2;
  edge(r.x + 18, r.y + inset, r.x + r.w - 18, r.y + inset);
  edge(r.x + 18, r.y + r.h - inset, r.x + r.w - 18, r.y + r.h - inset);
  edge(r.x + inset, r.y + 18, r.x + inset, r.y + r.h - 18);
  edge(r.x + r.w - inset, r.y + 18, r.x + r.w - inset, r.y + r.h - 18);
  const label = scene.add
    .text(r.x + 16, r.y + 10, text, {
      fontFamily: fonts.hand,
      fontSize: "24px",
      color: "#fbf5e6",
      stroke: "#1d1830",
      strokeThickness: 5,
      padding: { x: 4, y: 2 },
    })
    .setAlpha(0.95);
  const lw = label.width;
  const lh = label.height;
  const spots = [
    { x: r.x + 16, y: r.y + 10 },
    { x: r.x + r.w - 16 - lw, y: r.y + 10 },
    { x: r.x + 16, y: r.y + r.h - 10 - lh },
    { x: r.x + r.w - 16 - lw, y: r.y + r.h - 10 - lh },
  ];
  const cost = (p: { x: number; y: number }) => avoid.reduce((sum, a) => sum + overlapArea({ x: p.x, y: p.y, w: lw, h: lh }, a), 0);
  const spot = spots.reduce((best, p) => (cost(p) < cost(best) ? p : best), spots[0]);
  label.setPosition(spot.x, spot.y);
  return scene.add.container(0, 0, [g, label]).setDepth(7);
}

export function drawPipe(scene: Phaser.Scene, level: LevelDef) {
  const flip = Boolean(level.pipe.flip);
  const img = scene.add.image(level.pipe.x + (flip ? 4 : -4), level.pipe.y, "pipe").setDepth(12);
  img.setOrigin(flip ? 10 / 196 : 186 / 196, 400 / 450).setFlipX(flip);
  return img;
}

export type GoalView = {
  celebrate: (ball: Phaser.GameObjects.Image) => number;
  layers: Phaser.GameObjects.GameObject[];
  point?: () => void;
};

export const HOPPER_ORIGIN_X = 55 / 150;
export const PIXEL_SCALE = 1.1;
export const BOWL_SCALE = 0.7;
const GLOW = { fill: 0xffc83d, rings: [0.34, 0.2, 0.1], spread: 9 };

function union(...rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.w));
  const bottom = Math.max(...rects.map((r) => r.y + r.h));
  return { x, y, w: right - x, h: bottom - y };
}

export function goalZone(level: LevelDef): Rect {
  const goal = level.goal;
  const keep = goalLayout(goal).keepOut;
  const floor = (cx: number, w: number, h: number): Rect => ({ x: cx - w / 2, y: FLOOR_Y - h, w, h });
  switch (goal.type) {
    case "bell":
      return level.decor.includes("cat") ? union(keep, floor(goal.x + 130, 160, 120)) : keep;
    case "remote":
      return level.decor.includes("tv") ? union(keep, floor(goal.x - 60, 230, 190)) : keep;
    case "toaster":
      return union(keep, { x: goal.x - 60, y: goal.y - 290, w: 130, h: 150 });
    case "feeder":
      return union({ x: goal.x - 76, y: goal.y - 64, w: 152, h: 72 }, floor(goal.x - 153, 150, 200), floor(goal.x + 70, 130, 120));
    case "pins":
      return union(keep, { x: goal.x - 120, y: goal.y - 220, w: 260, h: 220 });
    default:
      return keep;
  }
}

type FxHelpers = {
  word: (text: string, x: number, y: number, color: string, size?: number) => void;
  burst: (x: number, y: number, count: number, tex?: string) => void;
  sfx: (name: LabSfx, volume?: number) => void;
  notes: (x: number, y: number, count: number) => void;
  chain?: () => number;
  reduced: boolean;
  text: LabCopy["world"];
};

function findCeiling(blocks: Block[], x: number, y: number) {
  let best = 40;
  for (const b of blocks) {
    if (b.angle) continue;
    const bottom = b.y + b.h / 2;
    if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 && bottom < y && bottom > best) best = bottom;
  }
  return best;
}

export function buildGoal(scene: Phaser.Scene, level: LevelDef, fonts: Fonts, fx: FxHelpers): GoalView {
  const goal = level.goal;
  const layers: Phaser.GameObjects.GameObject[] = [];
  switch (goal.type) {
    case "target": {
      const g = scene.add.graphics().setDepth(2);
      g.fillStyle(INK_HEX, 1);
      g.fillEllipse(goal.x, FLOOR_Y - 2, 96, 22);
      g.fillStyle(0x7b62c4, 1);
      g.fillEllipse(goal.x, FLOOR_Y - 6, 86, 16);
      const board = scene.add.image(goal.x, goal.y, "target").setDepth(4);
      layers.push(g, board);
      if (!fx.reduced) scene.tweens.add({ targets: board, angle: { from: -3, to: 3 }, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      return {
        layers,
        celebrate: () => {
          fx.sfx("ding", 0.8);
          fx.word(fx.text.bullseye, goal.x, goal.y - 120, "#ffc83d", 60);
          fx.burst(goal.x, goal.y, 14, "star");
          scene.tweens.killTweensOf(board);
          if (!fx.reduced) {
            scene.tweens.add({ targets: board, scaleX: { from: 1, to: -1 }, duration: 160, yoyo: true, repeat: 2, ease: "Sine.easeInOut", onComplete: () => board.setScale(1).setAngle(0) });
          }
          return 1700;
        },
      };
    }
    case "bell": {
      const g = scene.add.graphics().setDepth(2);
      if (goal.stand === "pole") {
        g.fillStyle(INK_HEX, 1);
        g.fillEllipse(goal.x, FLOOR_Y - 2, 96, 22);
        g.fillStyle(0x7b62c4, 1);
        g.fillEllipse(goal.x, FLOOR_Y - 6, 86, 16);
      } else {
        const top = findCeiling(level.blocks, goal.x, goal.y);
        g.lineStyle(9, INK_HEX, 1);
        g.lineBetween(goal.x, top, goal.x, goal.y - 40);
        g.lineStyle(4, 0xb06c3f, 1);
        g.lineBetween(goal.x, top, goal.x, goal.y - 40);
        g.fillStyle(0x9aa6b8, 1);
        g.lineStyle(4, INK_HEX, 1);
        g.fillRoundedRect(goal.x - 16, top - 2, 32, 12, 4);
        g.strokeRoundedRect(goal.x - 16, top - 2, 32, 12, 4);
      }
      const bell = scene.add.image(goal.x, goal.y - 38, "bell").setOrigin(0.5, 0.12).setDepth(4);
      layers.push(g, bell);
      let cat: Phaser.GameObjects.Image | null = null;
      let zzz: Phaser.GameObjects.Text | null = null;
      if (level.decor.includes("cat")) {
        cat = scene.add.image(goal.x + 130, FLOOR_Y + 4, "cat-sleep").setOrigin(0.5, 1).setScale(PIXEL_SCALE).setDepth(13);
        zzz = cartoonText(scene, goal.x + 100, FLOOR_Y - 96, fx.text.zzz, { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.18 }).setDepth(13);
        layers.push(cat, zzz);
        if (!fx.reduced) {
          scene.tweens.add({ targets: zzz, y: FLOOR_Y - 120, alpha: { from: 1, to: 0.2 }, duration: 1800, repeat: -1 });
          scene.tweens.add({ targets: cat, scaleY: PIXEL_SCALE * 0.96, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        }
      }
      return {
        layers,
        celebrate: () => {
          fx.sfx("ding", 1);
          fx.word(fx.text.ding, goal.x, goal.y - 110, "#ffc83d", 64);
          fx.burst(goal.x, goal.y, 14, "spark");
          if (!fx.reduced) {
            scene.tweens.add({ targets: bell, angle: { from: -22, to: 22 }, duration: 160, yoyo: true, repeat: 4, ease: "Sine.easeInOut", onComplete: () => bell.setAngle(0) });
          }
          if (cat && zzz) {
            const c = cat;
            scene.time.delayedCall(350, () => {
              zzz?.destroy();
              scene.tweens.killTweensOf(c);
              c.setTexture("cat-scared").setScale(PIXEL_SCALE);
              fx.sfx("meow", 0.9);
              fx.word(fx.text.meow, c.x, c.y - 140, "#f06ba8", 48);
              if (!fx.reduced) scene.tweens.add({ targets: c, y: c.y - 60, duration: 180, yoyo: true, ease: "Quad.easeOut" });
            });
          }
          return 1900;
        },
      };
    }
    case "toaster": {
      const toast = scene.add.image(goal.x + 6, goal.y - 70, "toast").setDepth(3.5);
      const toaster = scene.add.image(goal.x, goal.y - 45, "toaster").setOrigin(90 / 160, 61 / 112).setDepth(4);
      layers.push(toast, toaster);
      return {
        layers,
        celebrate: () => {
          fx.sfx("toaster", 1);
          fx.word(fx.text.toast, goal.x, goal.y - 170, "#ffc83d", 60);
          if (fx.reduced) {
            toast.setPosition(goal.x + 6, goal.y - 130);
          } else {
            scene.tweens.add({
              targets: toast,
              y: goal.y - 260,
              angle: 200,
              duration: 420,
              ease: "Quad.easeOut",
              onComplete: () => {
                scene.tweens.add({ targets: toast, y: goal.y - 128, angle: 360, duration: 420, ease: "Bounce.easeOut" });
              },
            });
            toaster.setScale(1.06, 0.92);
            scene.tweens.add({ targets: toaster, scaleX: 1, scaleY: 1, duration: 300, ease: "Back.easeOut" });
          }
          fx.burst(goal.x, goal.y - 120, 6, "puff");
          return 1900;
        },
      };
    }
    case "juicer": {
      const g = scene.add.graphics().setDepth(3);
      const top = goal.y + 113;
      g.fillStyle(INK_HEX, 1);
      g.fillRect(goal.x - 24, top, 48, FLOOR_Y - top);
      g.fillStyle(0xb06c3f, 1);
      g.fillRect(goal.x - 18, top, 36, FLOOR_Y - top);
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(goal.x - 64, top - 4, 128, 22, 8);
      g.fillStyle(0xf06ba8, 1);
      g.fillRoundedRect(goal.x - 59, top, 118, 13, 6);
      g.fillStyle(INK_HEX, 1);
      g.fillEllipse(goal.x, FLOOR_Y - 2, 110, 20);
      const juice = scene.add.graphics().setDepth(11.5);
      const jar = scene.add.image(goal.x, goal.y, "juicer").setOrigin(85 / 190, 14 / 130).setDepth(12);
      layers.push(g, juice, jar);
      return {
        layers,
        celebrate: (ball) => {
          fx.sfx("squish", 1);
          fx.word(fx.text.juice, goal.x, goal.y - 80, "#ff8a3d", 60);
          fx.burst(goal.x, goal.y + 30, 12, "drop");
          const level = { v: 0 };
          const draw = () => {
            juice.clear();
            const hgt = 64 * level.v;
            juice.fillStyle(0xffa733, 0.92);
            juice.fillRect(goal.x - 64, goal.y + 99 - hgt, 128, hgt);
            juice.fillStyle(0xffd27a, 0.9);
            juice.fillRect(goal.x - 64, goal.y + 99 - hgt, 128, Math.min(6, hgt));
          };
          if (fx.reduced) {
            level.v = 1;
            draw();
            ball.setVisible(false);
          } else {
            scene.tweens.add({ targets: ball, scaleY: 0.25, scaleX: 1.4, alpha: 0, y: ball.y + 18, duration: 380, ease: "Quad.easeIn" });
            scene.tweens.add({ targets: level, v: 1, duration: 900, delay: 200, ease: "Sine.easeOut", onUpdate: draw });
          }
          return 2000;
        },
      };
    }
    case "remote": {
      const remote = scene.add.image(goal.x, goal.y - 12, "remote").setDepth(4);
      layers.push(remote);
      let screen: Phaser.GameObjects.Graphics | null = null;
      let tvLabel: Phaser.GameObjects.Text | null = null;
      let tvX = 0;
      let tvY = 0;
      if (level.decor.includes("tv")) {
        const tv = scene.add.image(goal.x - 60, FLOOR_Y + 6, "tv").setOrigin(0.5, 1).setDepth(2.5);
        tvX = tv.x - 110 + 24;
        tvY = tv.y - 186 + 48;
        screen = scene.add.graphics().setDepth(2.6);
        tvLabel = cartoonText(scene, tvX + 69, tvY + 52, "404", { size: 46, color: "#ffc83d", font: fonts.display, stroke: 0.2 })
          .setOrigin(0.5)
          .setDepth(2.7)
          .setVisible(false);
        layers.push(tv, screen, tvLabel);
      }
      return {
        layers,
        celebrate: () => {
          fx.sfx("click", 1);
          remote.setTint(0xfff3c4);
          fx.word(fx.text.click, goal.x, goal.y - 90, "#9df0dc", 52);
          if (screen && tvLabel) {
            const s = screen;
            const label = tvLabel;
            scene.time.delayedCall(260, () => {
              fx.sfx("tvOn", 0.9);
              const colors = [0xfbf5e6, 0xffc83d, 0x63d6c1, 0x9df0dc, 0xf06ba8, 0x7b62c4, 0xef4f43];
              s.clear();
              s.fillStyle(0x2b2150, 1);
              s.fillRoundedRect(tvX, tvY, 138, 104, 22);
              colors.forEach((c, i) => {
                s.fillStyle(c, 1);
                s.fillRect(tvX + 8 + i * 17.5, tvY + 10, 17.5, 66);
              });
              s.fillStyle(0x1d1830, 1);
              s.fillRect(tvX + 8, tvY + 76, 122, 18);
              label.setVisible(true);
              if (!fx.reduced) {
                label.setScale(0.2);
                scene.tweens.add({ targets: label, scale: 1, duration: 300, ease: "Back.easeOut" });
              }
            });
          }
          return 1900;
        },
      };
    }
    case "feeder":
      return buildFeeder(scene, goal, fonts, fx);
    case "record":
      return buildRecord(scene, goal, fx);
    case "pins":
      return buildPins(scene, goal, fx);
    case "button":
      return buildButton(scene, goal, fonts, fx);
  }
}

type At = { x: number; y: number };

function buildFeeder(scene: Phaser.Scene, goal: At, fonts: Fonts, fx: FxHelpers): GoalView {
  const hopperX = goal.x - 175;
  const bowlX = goal.x - 72;
  const cable = scene.add.graphics().setDepth(2.4);
  cable.lineStyle(9, INK_HEX, 1);
  const cableTop = { x: goal.x - 46, y: goal.y - 6 };
  const cableEnd = { x: hopperX + 30, y: FLOOR_Y - 160 };
  const curve = new Phaser.Curves.CubicBezier(
    new Phaser.Math.Vector2(cableTop.x, cableTop.y),
    new Phaser.Math.Vector2(cableTop.x - 30, cableTop.y + 80),
    new Phaser.Math.Vector2(cableEnd.x + 60, cableEnd.y - 10),
    new Phaser.Math.Vector2(cableEnd.x, cableEnd.y),
  );
  curve.draw(cable, 24);
  cable.lineStyle(4, 0xef4f43, 1);
  curve.draw(cable, 24);
  const hopper = scene.add.image(hopperX, FLOOR_Y + 2, "hopper").setOrigin(HOPPER_ORIGIN_X, 198 / 200).setDepth(2.5);
  const bowl = scene.add.image(bowlX, FLOOR_Y + 2, "bowl").setOrigin(0.5, 1).setScale(BOWL_SCALE).setDepth(2.6);
  const food = scene.add.image(bowlX, FLOOR_Y - 18, "kibble-full").setOrigin(0.5, 0.5).setScale(0.8, 0.7).setDepth(2.55).setVisible(false);
  const glow = (draw: (g: Phaser.GameObjects.Graphics, grow: number) => void) => {
    const g = scene.add.graphics().setDepth(2.3).setAlpha(0).setVisible(false);
    GLOW.rings.forEach((alpha, i) => {
      g.fillStyle(GLOW.fill, alpha);
      draw(g, i * GLOW.spread);
    });
    return g;
  };
  const padGlow = glow((g, d) => g.fillEllipse(goal.x, goal.y - 26, 150 + d * 2, 70 + d * 2));
  const feederGlow = glow((g, d) => {
    g.fillRoundedRect(hopperX - 52 - d, FLOOR_Y - 208 - d, 104 + d * 2, 214 + d, 42 + d);
    g.fillEllipse(bowlX, FLOOR_Y - 16, 120 + d * 2, 50 + d * 2);
  });
  const spark = scene.add.circle(cableTop.x, cableTop.y, 8, GLOW.fill).setStrokeStyle(3, INK_HEX).setDepth(4.6).setVisible(false);
  const pulse = (g: Phaser.GameObjects.Graphics, delay: number) => {
    scene.tweens.killTweensOf(g);
    g.setVisible(true);
    if (fx.reduced) {
      g.setAlpha(1);
      scene.time.delayedCall(delay + 1700, () => g.setVisible(false));
      return;
    }
    g.setAlpha(0);
    scene.tweens.add({ targets: g, alpha: 1, delay, duration: 280, yoyo: true, hold: 120, repeat: 1, ease: "Sine.easeInOut", onComplete: () => g.setVisible(false) });
  };
  const cat = scene.add.image(goal.x + 70, FLOOR_Y + 4, "cat-grumpy").setOrigin(0.5, 1).setScale(PIXEL_SCALE).setDepth(13);
  const pad = scene.add.image(goal.x, goal.y + 2, "feeder").setOrigin(0.5, 1).setDepth(4);
  const layers: Phaser.GameObjects.GameObject[] = [padGlow, feederGlow, cable, hopper, bowl, food, cat, pad, spark];
  return {
    layers,
    point: () => {
      pulse(padGlow, 0);
      pulse(feederGlow, fx.reduced ? 0 : 900);
      if (fx.reduced) return;
      const along = { t: 0 };
      scene.tweens.killTweensOf(along);
      spark.setVisible(true).setPosition(cableTop.x, cableTop.y);
      scene.tweens.add({
        targets: along,
        t: 1,
        delay: 250,
        duration: 650,
        ease: "Sine.easeInOut",
        onUpdate: () => {
          const p = curve.getPoint(along.t);
          spark.setPosition(p.x, p.y);
        },
        onComplete: () => {
          spark.setVisible(false);
          fx.burst(cableEnd.x, cableEnd.y, 4, "spark");
        },
      });
    },
    celebrate: () => {
      fx.sfx("click", 1);
      fx.word(fx.text.click, goal.x, goal.y - 90, "#9df0dc", 50);
      pad.setScale(1.08, 0.86);
      if (!fx.reduced) scene.tweens.add({ targets: pad, scaleX: 1, scaleY: 1, duration: 260, ease: "Back.easeOut" });
      scene.time.delayedCall(300, () => {
        fx.sfx("kibble", 0.9);
        food.setVisible(true);
        if (!fx.reduced) {
          food.setScale(0.24, 0.07);
          scene.tweens.add({ targets: food, scaleX: 0.8, scaleY: 0.7, duration: 420, ease: "Back.easeOut" });
          scene.tweens.add({ targets: hopper, scaleY: 0.96, duration: 90, yoyo: true, repeat: 2 });
        }
        fx.burst(bowlX, FLOOR_Y - 40, 6, "spark");
      });
      scene.time.delayedCall(700, () => {
        cat.setTexture("cat-sleep").setFlipX(true);
        if (fx.reduced) cat.setX(bowlX + 104);
        else scene.tweens.add({ targets: cat, x: bowlX + 104, duration: 360, ease: "Quad.easeOut" });
        fx.sfx("crunch", 0.9);
        fx.word(fx.text.kibble, bowlX + 40, FLOOR_Y - 120, "#ffc83d", 44);
      });
      scene.time.delayedCall(1400, () => {
        fx.sfx("purr", 0.8);
        cartoonFloat(scene, fonts, fx, fx.text.purr, bowlX + 120, FLOOR_Y - 110);
      });
      return 2100;
    },
  };
}

function cartoonFloat(scene: Phaser.Scene, fonts: Fonts, fx: FxHelpers, text: string, x: number, y: number) {
  const t = cartoonText(scene, x, y, text, { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.18 }).setDepth(13).setOrigin(0.5);
  if (fx.reduced) {
    scene.time.delayedCall(1200, () => t.destroy());
    return;
  }
  scene.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 1600, ease: "Sine.easeOut", onComplete: () => t.destroy() });
}

function buildRecord(scene: Phaser.Scene, goal: At, fx: FxHelpers): GoalView {
  const player = scene.add.image(goal.x, goal.y + 2, "record").setOrigin(90 / 160, 1).setDepth(4);
  const shine = scene.add.graphics().setDepth(4.1).setVisible(false);
  const center = { x: goal.x - 4, y: goal.y - 82 };
  const spin = { a: 0 };
  const drawShine = () => {
    shine.clear();
    shine.lineStyle(4, 0x8f7fd1, 1);
    const a = spin.a;
    shine.beginPath();
    for (let i = 0; i <= 8; i += 1) {
      const t = a + (i / 8) * 1.1;
      const px = center.x + Math.cos(t) * 36;
      const py = center.y + Math.sin(t) * 8;
      if (i === 0) shine.moveTo(px, py);
      else shine.lineTo(px, py);
    }
    shine.strokePath();
  };
  return {
    layers: [player, shine],
    celebrate: () => {
      fx.sfx("click", 0.9);
      fx.sfx("tune", 1);
      fx.word(fx.text.music, goal.x, goal.y - 170, "#f06ba8", 50);
      shine.setVisible(true);
      drawShine();
      if (!fx.reduced) {
        scene.tweens.add({ targets: spin, a: Math.PI * 10, duration: 2200, ease: "Linear", onUpdate: drawShine });
        scene.tweens.add({ targets: player, scaleY: 0.96, duration: 230, yoyo: true, repeat: 3, ease: "Sine.easeInOut" });
      }
      fx.notes(goal.x + 10, goal.y - 110, 5);
      return 2100;
    },
  };
}

function buildPins(scene: Phaser.Scene, goal: At, fx: FxHelpers): GoalView {
  const deck = scene.add.image(goal.x + 46, goal.y + 2, "pin-deck").setOrigin(0.5, 1).setDepth(3.6);
  const spots = [-44, -16, 12];
  const pins = spots.map((dx, i) => scene.add.image(goal.x + dx, goal.y + 2 - (i === 1 ? 4 : 0), "pin").setOrigin(0.5, 1).setDepth(i === 1 ? 3.9 : 4));
  return {
    layers: [deck, ...pins],
    celebrate: () => {
      fx.sfx("strike", 1);
      fx.word(fx.text.strike, goal.x - 10, goal.y - 180, "#ffc83d", 64);
      fx.burst(goal.x - 16, goal.y - 60, 10, "star");
      pins.forEach((pin, i) => {
        const dir = i === 0 ? -1 : 1;
        const land = { x: pin.x + dir * (30 + i * 26), y: goal.y - 10 };
        if (fx.reduced) {
          pin.setPosition(land.x, land.y).setAngle(dir * 90);
          return;
        }
        pin.setOrigin(0.5, 0.5).setY(pin.y - 46);
        scene.tweens.add({ targets: pin, angle: dir * (300 + i * 80), duration: 700, ease: "Quad.easeOut" });
        scene.tweens.add({ targets: pin, x: land.x, duration: 700, ease: "Linear" });
        scene.tweens.add({
          targets: pin,
          y: pin.y - 120 - i * 30,
          duration: 320,
          ease: "Quad.easeOut",
          onComplete: () => scene.tweens.add({ targets: pin, y: land.y, duration: 380, ease: "Bounce.easeOut", onComplete: () => pin.setAngle(dir * 90) }),
        });
      });
      return 1900;
    },
  };
}

function buildButton(scene: Phaser.Scene, goal: At, fonts: Fonts, fx: FxHelpers): GoalView {
  const panel = scene.add.image(goal.x + 30, goal.y + 2, "panel").setOrigin(86 / 130, 1).setDepth(4);
  const label = cartoonText(scene, goal.x + 30, goal.y - 238, fx.text.button, { size: 26, color: "#ffc83d", font: fonts.display, stroke: 0.22 }).setOrigin(0.5).setDepth(4.2);
  const lamp = scene.add.circle(goal.x + 30, goal.y - 194, 16, 0xffc83d, 0.9).setDepth(4.1).setVisible(false);
  if (!fx.reduced) scene.tweens.add({ targets: label, scale: 1.06, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  return {
    layers: [panel, label, lamp],
    celebrate: () => {
      fx.sfx("button", 1);
      panel.setScale(0.94, 1);
      lamp.setVisible(true);
      if (!fx.reduced) {
        scene.tweens.add({ targets: panel, scaleX: 1, duration: 300, ease: "Back.easeOut" });
        scene.tweens.add({ targets: lamp, alpha: 0.2, duration: 160, yoyo: true, repeat: 7 });
      }
      fx.word(fx.text.allOn, goal.x - 170, goal.y - 150, "#ffc83d", 58);
      return Math.max(1900, fx.chain?.() ?? 0);
    },
  };
}
