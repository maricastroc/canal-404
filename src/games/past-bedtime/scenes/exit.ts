import * as Phaser from "phaser";
import type { Fonts } from "@/games/kit/ui";
import { isWall, type Grid } from "../sim/grid";
import type { Layout } from "./layout";

const INK = 0x1d1830;

export type ExitSide = "n" | "e" | "s" | "w";

export function exitSide(grid: Grid): ExitSide {
  const { x, y } = grid.goal;
  const edge = (dx: number, dy: number) => isWall(grid, x + dx, y + dy) && (x + dx * 2 < 0 || x + dx * 2 >= grid.w || y + dy * 2 < 0 || y + dy * 2 >= grid.h || isWall(grid, x + dx * 2, y + dy * 2));
  if (edge(1, 0)) return "e";
  if (edge(-1, 0)) return "w";
  if (edge(0, -1)) return "n";
  return "s";
}

export function drawExit(scene: Phaser.Scene, grid: Grid, layout: Layout, fonts: Fonts, label: string, kind: "passage" | "stairs" | "device") {
  const s = layout.tile;
  const side = exitSide(grid);
  const gx = layout.ox + grid.goal.x * s;
  const gy = layout.oy + grid.goal.y * s;
  const light = scene.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
  const bands = 6;
  for (let i = 0; i < bands; i += 1) {
    const t = (i + 1) / bands;
    light.fillStyle(kind === "device" ? 0x7ff5e0 : 0xfff0c8, 0.07);
    if (side === "e" || side === "w") {
      const depth = s * (0.25 + t * 0.95);
      const x0 = side === "e" ? gx + s : gx;
      const dir = side === "e" ? -1 : 1;
      light.fillPoints(
        [
          { x: x0, y: gy + s * 0.12 },
          { x: x0, y: gy + s * 0.88 },
          { x: x0 + dir * depth, y: gy + s * (0.98 + t * 0.06) },
          { x: x0 + dir * depth, y: gy + s * (0.02 - t * 0.06) },
        ],
        true,
      );
    } else {
      const depth = s * (0.25 + t * 0.95);
      const y0 = side === "s" ? gy + s : gy;
      const dir = side === "s" ? -1 : 1;
      light.fillPoints(
        [
          { x: gx + s * 0.12, y: y0 },
          { x: gx + s * 0.88, y: y0 },
          { x: gx + s * (0.98 + t * 0.06), y: y0 + dir * depth },
          { x: gx + s * (0.02 - t * 0.06), y: y0 + dir * depth },
        ],
        true,
      );
    }
  }
  scene.tweens.add({ targets: light, alpha: { from: 0.75, to: 1 }, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  const frame = scene.add.graphics().setDepth(8.2);
  if (kind === "passage") {
    const plank = (x: number, y: number, w: number, h: number) => {
      frame.fillStyle(INK, 0.6);
      frame.fillRoundedRect(x + 2, y + 3, w, h, 4);
      frame.fillStyle(0xd9b98a, 1);
      frame.fillRoundedRect(x, y, w, h, 4);
      frame.lineStyle(3, INK, 1);
      frame.strokeRoundedRect(x, y, w, h, 4);
      frame.lineStyle(2, 0xf6e2bd, 1);
      if (w > h) frame.lineBetween(x + 6, y + 4, x + w - 6, y + 4);
      else frame.lineBetween(x + 4, y + 6, x + 4, y + h - 6);
    };
    const post = (x: number, y: number) => {
      frame.fillStyle(INK, 1);
      frame.fillRoundedRect(x - s * 0.07, y - s * 0.07, s * 0.14, s * 0.14, 3);
      frame.fillStyle(0xeee4cf, 1);
      frame.fillRoundedRect(x - s * 0.055, y - s * 0.055, s * 0.11, s * 0.11, 3);
    };
    const t = s * 0.14;
    if (side === "e") {
      plank(gx + s - t, gy + s * 0.06, t, s * 0.88);
      post(gx + s - t / 2, gy + s * 0.04);
      post(gx + s - t / 2, gy + s * 0.96);
    } else if (side === "w") {
      plank(gx, gy + s * 0.06, t, s * 0.88);
      post(gx + t / 2, gy + s * 0.04);
      post(gx + t / 2, gy + s * 0.96);
    } else if (side === "n") {
      plank(gx + s * 0.06, gy, s * 0.88, t);
    } else {
      plank(gx + s * 0.06, gy + s - t, s * 0.88, t);
    }
  }
  const size = Math.round(Math.max(20, s * 0.2));
  const text = scene.add.text(0, 0, side === "w" ? `← ${label}` : side === "n" ? `↑ ${label}` : `${label} →`, { fontFamily: fonts.hand, fontSize: `${size}px`, color: "#fbf5e6", padding: { x: 2, y: 2 } }).setOrigin(0.5);
  const pw = text.width + size * 0.9;
  const ph = size * 1.5;
  const board = scene.add.graphics();
  board.lineStyle(2, INK, 1);
  board.lineBetween(-pw * 0.3, -ph / 2, -pw * 0.18, -ph / 2 - size * 0.55);
  board.lineBetween(pw * 0.3, -ph / 2, pw * 0.18, -ph / 2 - size * 0.55);
  board.fillStyle(0xc9a24a, 1);
  board.fillCircle(-pw * 0.18, -ph / 2 - size * 0.55, 2.5);
  board.fillCircle(pw * 0.18, -ph / 2 - size * 0.55, 2.5);
  board.fillStyle(INK, 1);
  board.fillRoundedRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph, 6);
  board.fillStyle(0x7c4527, 1);
  board.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 6);
  board.lineStyle(3, INK, 1);
  board.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 6);
  board.lineStyle(2, 0x9a5a34, 1);
  board.lineBetween(-pw / 2 + 6, -ph / 2 + 5, pw / 2 - 6, -ph / 2 + 5);
  const sx = side === "e" ? gx + s - pw / 2 - s * 0.04 : side === "w" ? gx + pw / 2 + s * 0.04 : gx + s / 2;
  const sy = side === "n" ? gy + s * 0.32 : gy - s * 0.02;
  const sign = scene.add.container(sx, sy, [board, text]).setDepth(21).setAngle(side === "w" ? 3 : -3);
  scene.tweens.add({ targets: sign, angle: side === "w" ? -1 : 1, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  return { light, frame, sign };
}
