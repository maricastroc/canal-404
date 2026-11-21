import type * as Phaser from "phaser";
import { isCreaky, isFloor, isWall, tileAt, type Grid } from "../sim/grid";
import type { PropDef } from "../sim/types";
import { wobble, type Layout } from "./layout";

export const NIGHT = {
  void: 0x120d22,
  wall: 0x221a40,
  wallTop: 0x342a5e,
  wallEdge: 0x0c0818,
  floor: 0x4a4277,
  floorAlt: 0x463f71,
  plank: 0x332c58,
  grain: 0x5a5190,
  creak: 0x7a6cb4,
  creakEdge: 0x241d47,
  nail: 0xb9c2d6,
  moon: 0xa9c8ff,
  light: 0xffd66b,
  lightEdge: 0xffb43d,
  ink: 0x1d1830,
  pencil: 0x3b3550,
  paper: 0xfbf5e6,
  goal: 0x9df0dc,
};

function rect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, r = 0, stroke = NIGHT.ink, lw = 4) {
  g.fillStyle(fill, 1);
  if (r > 0) g.fillRoundedRect(x, y, w, h, r);
  else g.fillRect(x, y, w, h);
  if (lw > 0) {
    g.lineStyle(lw, stroke, 1);
    if (r > 0) g.strokeRoundedRect(x, y, w, h, r);
    else g.strokeRect(x, y, w, h);
  }
}

export function drawFloor(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const s = layout.tile;
  g.fillStyle(NIGHT.void, 1);
  g.fillRoundedRect(layout.ox - 14, layout.oy - 14, grid.w * s + 28, grid.h * s + 28, 20);
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      const t = tileAt(grid, x, y);
      if (t === "#") continue;
      g.fillStyle((x + y) % 2 ? NIGHT.floor : NIGHT.floorAlt, 1);
      g.fillRect(px, py, s, s);
      const planks = 3;
      for (let p = 1; p < planks; p += 1) {
        g.lineStyle(2, NIGHT.plank, 0.9);
        g.lineBetween(px, py + (p * s) / planks, px + s, py + (p * s) / planks);
      }
      for (let p = 0; p < planks; p += 1) {
        const jx = px + s * (0.2 + wobble(x * 31 + y * 7 + p) * 0.6);
        g.lineStyle(2, NIGHT.plank, 0.9);
        g.lineBetween(jx, py + (p * s) / planks, jx, py + ((p + 1) * s) / planks);
        g.lineStyle(1.5, NIGHT.grain, 0.45);
        const gy = py + ((p + 0.5) * s) / planks;
        g.lineBetween(px + s * 0.08, gy, px + s * (0.3 + wobble(x + y * 13 + p) * 0.4), gy);
      }
    }
  }
}

export function drawCreaks(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (!isCreaky(grid, x, y)) continue;
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      const row = Math.floor(wobble(x * 5 + y * 11) * 3);
      const ph = s / 3;
      const tilt = (wobble(x * 3 + y) - 0.5) * 0.12 * s;
      const top = py + row * ph;
      g.fillStyle(NIGHT.creakEdge, 1);
      g.fillPoints(
        [
          { x: px + 2, y: top + 2 + tilt },
          { x: px + s - 2, y: top + 2 - tilt },
          { x: px + s - 2, y: top + ph + 4 - tilt },
          { x: px + 2, y: top + ph + 4 + tilt },
        ],
        true,
      );
      g.fillStyle(NIGHT.creak, 1);
      g.fillPoints(
        [
          { x: px + 3, y: top - 1 + tilt },
          { x: px + s - 3, y: top - 1 - tilt },
          { x: px + s - 3, y: top + ph - 1 - tilt },
          { x: px + 3, y: top + ph - 1 + tilt },
        ],
        true,
      );
      g.lineStyle(3, NIGHT.creakEdge, 1);
      g.strokePoints(
        [
          { x: px + 3, y: top - 1 + tilt },
          { x: px + s - 3, y: top - 1 - tilt },
          { x: px + s - 3, y: top + ph - 1 - tilt },
          { x: px + 3, y: top + ph - 1 + tilt },
        ],
        true,
      );
      g.fillStyle(NIGHT.nail, 1);
      g.fillCircle(px + s * 0.16, top + ph * 0.5 + tilt * 0.6, Math.max(2, s * 0.028));
      g.fillCircle(px + s * 0.84, top + ph * 0.5 - tilt * 0.6, Math.max(2, s * 0.028));
      g.lineStyle(2.5, 0xd7cdfa, 0.85);
      const cy = row === 2 ? top - s * 0.14 : top + ph + s * 0.14;
      for (let k = -1; k <= 1; k += 2) {
        const cx = px + s * 0.5 + k * s * 0.18;
        g.beginPath();
        g.moveTo(cx - s * 0.07, cy);
        g.lineTo(cx - s * 0.035, cy - s * 0.04);
        g.lineTo(cx, cy);
        g.lineTo(cx + s * 0.035, cy - s * 0.04);
        g.lineTo(cx + s * 0.07, cy);
        g.strokePath();
      }
    }
  }
}

export function drawWalls(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (!isWall(grid, x, y)) continue;
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      g.fillStyle(NIGHT.wall, 1);
      g.fillRect(px, py, s, s);
      if (!isWall(grid, x, y + 1) && y + 1 < grid.h) {
        g.fillStyle(NIGHT.wallTop, 1);
        g.fillRect(px, py + s * 0.62, s, s * 0.38);
        g.fillStyle(NIGHT.wallEdge, 1);
        g.fillRect(px, py + s - 6, s, 6);
        g.lineStyle(2, 0x4a3f7c, 1);
        g.lineBetween(px, py + s * 0.62, px + s, py + s * 0.62);
      }
      if (!isWall(grid, x, y - 1) && y > 0) {
        g.fillStyle(NIGHT.wallEdge, 1);
        g.fillRect(px, py, s, 5);
      }
      if (!isWall(grid, x - 1, y) && x > 0) {
        g.fillStyle(NIGHT.wallEdge, 1);
        g.fillRect(px, py, 5, s);
      }
      if (!isWall(grid, x + 1, y) && x + 1 < grid.w) {
        g.fillStyle(NIGHT.wallEdge, 1);
        g.fillRect(px + s - 5, py, 5, s);
      }
    }
  }
}

export function drawMoonlight(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (!isFloor(grid, x, y) || !isWall(grid, x, y - 1)) continue;
      if (wobble(x * 17 + y * 3 + grid.w) > 0.32) continue;
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      g.fillStyle(NIGHT.moon, 0.09);
      g.fillPoints(
        [
          { x: px + s * 0.15, y: py },
          { x: px + s * 0.85, y: py },
          { x: px + s * 1.05, y: py + s * 0.9 },
          { x: px + s * 0.35, y: py + s * 0.9 },
        ],
        true,
      );
      const wx = px + s * 0.2;
      const wy = py - s * 0.56;
      rect(g, wx, wy, s * 0.6, s * 0.42, 0x6f86c9, 4, NIGHT.wallEdge, 3);
      g.lineStyle(3, NIGHT.wallEdge, 1);
      g.lineBetween(wx + s * 0.3, wy, wx + s * 0.3, wy + s * 0.42);
      g.lineBetween(wx, wy + s * 0.21, wx + s * 0.6, wy + s * 0.21);
      g.fillStyle(0xf4f1c9, 1);
      g.fillCircle(wx + s * 0.44, wy + s * 0.11, s * 0.05);
    }
  }
}

function drawProp(g: Phaser.GameObjects.Graphics, prop: PropDef, layout: Layout) {
  const s = layout.tile;
  const w = (prop.w ?? 1) * s;
  const h = (prop.h ?? 1) * s;
  const x = layout.ox + prop.x * s;
  const y = layout.oy + prop.y * s;
  const ink = NIGHT.ink;
  switch (prop.kind) {
    case "bed": {
      rect(g, x + s * 0.04, y + s * 0.02, w - s * 0.08, h - s * 0.08, 0x5a3b3f, s * 0.1);
      rect(g, x + s * 0.1, y + s * 0.08, w - s * 0.2, s * 0.32, 0xe9e2f5, s * 0.08, ink, 3);
      break;
    }
    case "nightstand":
      rect(g, x + s * 0.14, y + s * 0.14, s * 0.72, s * 0.72, 0x5a3b3f, 8);
      break;
    case "sofa": {
      rect(g, x + s * 0.04, y + s * 0.1, w - s * 0.08, h - s * 0.16, 0x7a4b6e, s * 0.16);
      rect(g, x + s * 0.04, y + s * 0.06, w - s * 0.08, s * 0.28, 0x8f5a83, s * 0.12, ink, 4);
      for (let i = 1; i < (prop.w ?? 1); i += 1) {
        g.lineStyle(3, ink, 0.7);
        g.lineBetween(x + i * s, y + s * 0.4, x + i * s, y + h - s * 0.16);
      }
      break;
    }
    case "armchair":
      rect(g, x + s * 0.08, y + s * 0.1, s * 0.84, s * 0.8, 0x4f6b9a, s * 0.18);
      rect(g, x + s * 0.08, y + s * 0.06, s * 0.84, s * 0.26, 0x5d7cb0, s * 0.12, ink, 4);
      rect(g, x + s * 0.04, y + s * 0.3, s * 0.16, s * 0.52, 0x5d7cb0, s * 0.06, ink, 3);
      rect(g, x + s * 0.8, y + s * 0.3, s * 0.16, s * 0.52, 0x5d7cb0, s * 0.06, ink, 3);
      break;
    case "table": {
      rect(g, x + s * 0.06, y + s * 0.06, w - s * 0.12, h - s * 0.12, 0x6d4a3a, s * 0.08);
      g.fillStyle(0xe8d9c4, 0.9);
      g.fillRoundedRect(x + s * 0.3, y + s * 0.18, w - s * 0.6, h - s * 0.36, 10);
      g.lineStyle(2, 0xc04f62, 0.6);
      for (let i = 0; i < 6; i += 1) g.lineBetween(x + s * 0.3 + i * ((w - s * 0.6) / 6), y + s * 0.18, x + s * 0.3 + i * ((w - s * 0.6) / 6), y + h - s * 0.18);
      g.fillStyle(0xf2a33a, 1);
      g.fillCircle(x + w * 0.42, y + h * 0.45, s * 0.12);
      g.fillStyle(0xc9403a, 1);
      g.fillCircle(x + w * 0.5, y + h * 0.55, s * 0.1);
      g.lineStyle(3, ink, 1);
      g.strokeCircle(x + w * 0.42, y + h * 0.45, s * 0.12);
      g.strokeCircle(x + w * 0.5, y + h * 0.55, s * 0.1);
      rect(g, x + w * 0.68, y + h * 0.3, s * 0.2, s * 0.2, 0xf7ecd4, 5, ink, 3);
      break;
    }
    case "fridge":
      rect(g, x + s * 0.06, y + s * 0.04, s * 0.88, s * 0.9, 0xd7dcef, s * 0.08);
      g.lineStyle(3, ink, 1);
      g.lineBetween(x + s * 0.06, y + s * 0.4, x + s * 0.94, y + s * 0.4);
      g.lineBetween(x + s * 0.78, y + s * 0.16, x + s * 0.78, y + s * 0.3);
      g.fillStyle(0xef4f43, 1);
      g.fillCircle(x + s * 0.3, y + s * 0.6, s * 0.06);
      g.fillStyle(0xffc83d, 1);
      g.fillCircle(x + s * 0.45, y + s * 0.7, s * 0.06);
      break;
    case "counter":
      rect(g, x + s * 0.02, y + s * 0.04, w - s * 0.04, h - s * 0.08, 0x7d5a4f, 6);
      g.fillStyle(0xcfc6e2, 1);
      g.fillRect(x + s * 0.02, y + s * 0.04, w - s * 0.04, s * 0.2);
      g.lineStyle(3, ink, 1);
      g.strokeRect(x + s * 0.02, y + s * 0.04, w - s * 0.04, s * 0.2);
      for (let i = 0; i < (prop.w ?? 1); i += 1) {
        g.lineStyle(2, ink, 0.6);
        g.strokeRect(x + i * s + s * 0.14, y + s * 0.36, s * 0.72, s * 0.48);
      }
      break;
    case "shelf":
      rect(g, x + s * 0.04, y + s * 0.12, w - s * 0.08, h - s * 0.24, 0x5a3b3f, 6);
      for (let i = 0; i < (prop.w ?? 1) * 4; i += 1) {
        const bx = x + s * 0.12 + i * s * 0.22;
        if (bx > x + w - s * 0.2) break;
        const colors = [0xef4f43, 0x5cb9f0, 0xffc83d, 0x63d6c1, 0xf06ba8];
        g.fillStyle(colors[i % colors.length], 1);
        g.fillRect(bx, y + s * 0.2, s * 0.16, s * 0.6);
        g.lineStyle(2, ink, 1);
        g.strokeRect(bx, y + s * 0.2, s * 0.16, s * 0.6);
      }
      break;
    case "plant":
      rect(g, x + s * 0.3, y + s * 0.48, s * 0.4, s * 0.4, 0xb06c3f, 6, ink, 3);
      g.fillStyle(0x4c9a43, 1);
      for (let i = 0; i < 5; i += 1) g.fillEllipse(x + s * (0.3 + i * 0.1), y + s * (0.3 + (i % 2) * 0.1), s * 0.22, s * 0.34);
      break;
    case "tv": {
      rect(g, x + s * 0.06, y + s * 0.08, s * 0.88, s * 0.76, 0x3a3157, s * 0.1);
      rect(g, x + s * 0.16, y + s * 0.16, s * 0.68, s * 0.5, 0x9df0dc, s * 0.08, ink, 3);
      for (let i = 0; i < 9; i += 1) {
        g.fillStyle(0xffffff, 0.5);
        g.fillRect(x + s * (0.2 + wobble(i * 3) * 0.6), y + s * (0.2 + wobble(i * 7) * 0.42), s * 0.06, s * 0.02);
      }
      break;
    }
    case "vcr": {
      rect(g, x + s * 0.12, y + s * 0.3, s * 0.76, s * 0.3, 0x2b2150, 6, ink, 3);
      g.fillStyle(0x1d1830, 1);
      g.fillRect(x + s * 0.2, y + s * 0.4, s * 0.32, s * 0.08);
      g.fillStyle(0xef4f43, 1);
      g.fillCircle(x + s * 0.74, y + s * 0.45, s * 0.04);
      break;
    }
    case "dogbed":
      g.fillStyle(0xc94785, 1);
      g.fillEllipse(x + s * 0.5, y + s * 0.55, s * 0.86, s * 0.64);
      g.lineStyle(4, ink, 1);
      g.strokeEllipse(x + s * 0.5, y + s * 0.55, s * 0.86, s * 0.64);
      g.fillStyle(0xf06ba8, 1);
      g.fillEllipse(x + s * 0.5, y + s * 0.58, s * 0.58, s * 0.4);
      break;
    case "stairs": {
      for (let i = 0; i < 5; i += 1) {
        const shade = [0x6a5c9e, 0x5a4d8c, 0x4a3f7a, 0x3a3168, 0x2b2356][i];
        g.fillStyle(shade, 1);
        g.fillRect(x + s * 0.06 + i * s * 0.17, y + s * 0.06, s * 0.17, s * 0.88);
        g.lineStyle(2, ink, 1);
        g.strokeRect(x + s * 0.06 + i * s * 0.17, y + s * 0.06, s * 0.17, s * 0.88);
      }
      break;
    }
    case "door": {
      g.fillStyle(0x6b4a3a, 1);
      g.fillRect(x + s * 0.12, y + s * 0.06, s * 0.76, s * 0.88);
      g.lineStyle(4, ink, 1);
      g.strokeRect(x + s * 0.12, y + s * 0.06, s * 0.76, s * 0.88);
      g.fillStyle(0xffc83d, 1);
      g.fillCircle(x + (prop.x === 0 ? s * 0.74 : s * 0.26), y + s * 0.5, s * 0.06);
      break;
    }
    default:
      rect(g, x + s * 0.08, y + s * 0.08, w - s * 0.16, h - s * 0.16, 0x5a3b3f, 8);
  }
}

export function drawProps(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const covered = new Set<number>();
  for (const prop of grid.level.props) {
    for (let dy = 0; dy < (prop.h ?? 1); dy += 1) for (let dx = 0; dx < (prop.w ?? 1); dx += 1) covered.add((prop.y + dy) * grid.w + prop.x + dx);
  }
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (tileAt(grid, x, y) !== "o" || covered.has(y * grid.w + x)) continue;
      rect(g, layout.ox + x * s + s * 0.08, layout.oy + y * s + s * 0.08, s * 0.84, s * 0.84, 0x5a3b3f, 8);
    }
  }
  for (const prop of grid.level.props) drawProp(g, prop, layout);
}

export function drawGoal(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const s = layout.tile;
  const x = layout.ox + grid.goal.x * s;
  const y = layout.oy + grid.goal.y * s;
  g.lineStyle(4, NIGHT.goal, 0.9);
  const dash = 10;
  const pts: [number, number, number, number][] = [
    [x + 6, y + 6, x + s - 6, y + 6],
    [x + s - 6, y + 6, x + s - 6, y + s - 6],
    [x + s - 6, y + s - 6, x + 6, y + s - 6],
    [x + 6, y + s - 6, x + 6, y + 6],
  ];
  for (const [ax, ay, bx, by] of pts) {
    const len = Math.hypot(bx - ax, by - ay);
    for (let d = 0; d < len; d += dash * 2) {
      const t0 = d / len;
      const t1 = Math.min(1, (d + dash) / len);
      g.lineBetween(ax + (bx - ax) * t0, ay + (by - ay) * t0, ax + (bx - ax) * t1, ay + (by - ay) * t1);
    }
  }
}
