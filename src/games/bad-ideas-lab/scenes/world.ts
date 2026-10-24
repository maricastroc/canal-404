import * as Phaser from "phaser";
import { FLOOR_Y } from "../config";
import type { Block, LevelDef, Rect } from "../levels";
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

export function drawBuildArea(scene: Phaser.Scene, r: Rect, fonts: Fonts) {
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
    .text(r.x + 16, r.y + 10, "monte aqui", {
      fontFamily: fonts.hand,
      fontSize: "24px",
      color: "#fbf5e6",
      stroke: "#1d1830",
      strokeThickness: 5,
      padding: { x: 4, y: 2 },
    })
    .setAlpha(0.95);
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
};

type FxHelpers = {
  word: (text: string, x: number, y: number, color: string, size?: number) => void;
  burst: (x: number, y: number, count: number, tex?: string) => void;
  sfx: (name: "ding" | "toaster" | "squish" | "click" | "tvOn" | "meow", volume?: number) => void;
  reduced: boolean;
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
          fx.word("NA MOSCA!", goal.x, goal.y - 120, "#ffc83d", 60);
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
        cat = scene.add.image(goal.x + 130, FLOOR_Y + 4, "cat-sleep").setOrigin(0.5, 1).setDepth(13);
        zzz = cartoonText(scene, goal.x + 100, FLOOR_Y - 90, "z z", { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0.18 }).setDepth(13);
        layers.push(cat, zzz);
        if (!fx.reduced) {
          scene.tweens.add({ targets: zzz, y: FLOOR_Y - 120, alpha: { from: 1, to: 0.2 }, duration: 1800, repeat: -1 });
          scene.tweens.add({ targets: cat, scaleY: 0.96, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        }
      }
      return {
        layers,
        celebrate: () => {
          fx.sfx("ding", 1);
          fx.word("DING!", goal.x, goal.y - 110, "#ffc83d", 64);
          fx.burst(goal.x, goal.y, 14, "spark");
          if (!fx.reduced) {
            scene.tweens.add({ targets: bell, angle: { from: -22, to: 22 }, duration: 160, yoyo: true, repeat: 4, ease: "Sine.easeInOut", onComplete: () => bell.setAngle(0) });
          }
          if (cat && zzz) {
            const c = cat;
            scene.time.delayedCall(350, () => {
              zzz?.destroy();
              scene.tweens.killTweensOf(c);
              c.setTexture("cat-scared").setScale(1);
              fx.sfx("meow", 0.9);
              fx.word("MIAU!", c.x, c.y - 140, "#f06ba8", 48);
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
          fx.word("PLIM!", goal.x, goal.y - 170, "#ffc83d", 60);
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
          fx.word("SPLOSH!", goal.x, goal.y - 80, "#ff8a3d", 60);
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
          fx.word("CLIQUE!", goal.x, goal.y - 90, "#9df0dc", 52);
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
  }
}
