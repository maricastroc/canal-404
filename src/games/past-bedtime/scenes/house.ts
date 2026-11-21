import type * as Phaser from "phaser";
import { isCreaky, isWall, tileAt, type Grid } from "../sim/grid";
import type { PropDef } from "../sim/types";
import { wobble, type Layout } from "./layout";

export const NIGHT = {
  void: 0x0d0a1c,
  cap: 0x2a2140,
  capEdge: 0x45386a,
  ink: 0x1d1830,
  light: 0xffd66b,
  lightEdge: 0xffb43d,
  goal: 0x9df0dc,
  creak: 0xe9c993,
  creakEdge: 0x4a2c1c,
  squiggle: 0xd9ccff,
};

export type Theme = {
  floor: "wood" | "checker" | "parquet";
  floorA: number;
  floorB: number;
  floorLine: number;
  wall: number;
  wallAlt: number;
  pattern: "stripes" | "azulejo" | "damask";
  crown: number;
  base: number;
};

const THEMES: Record<string, Theme> = {
  hall: { floor: "wood", floorA: 0xb27c57, floorB: 0xa97452, floorLine: 0x74472f, wall: 0x6f8fb6, wallAlt: 0x7f9fc4, pattern: "stripes", crown: 0xeee4cf, base: 0x7c4527 },
  kitchen: { floor: "checker", floorA: 0xeae1cb, floorB: 0x6c6684, floorLine: 0x4b4560, wall: 0xdce8ec, wallAlt: 0xb3c7cf, pattern: "azulejo", crown: 0xf6f1e4, base: 0x5f9fc0 },
  living: { floor: "parquet", floorA: 0xa86e4b, floorB: 0x9b6444, floorLine: 0x6a3f2a, wall: 0xb27a90, wallAlt: 0xc38ea3, pattern: "damask", crown: 0xf0dfc8, base: 0x5a3324 },
};

export function themeFor(levelId: string): Theme {
  if (levelId === "kitchen" || levelId === "pantry" || levelId === "laundry") return THEMES.kitchen;
  if (levelId === "living" || levelId === "dining" || levelId === "sofa") return THEMES.living;
  return THEMES.hall;
}

export type HideStyle = "curtain" | "plant";

export function hideStyleFor(levelId: string): HideStyle {
  return levelId === "sofa" ? "plant" : "curtain";
}

export function drawHides(back: Phaser.GameObjects.Graphics, front: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout, style: HideStyle) {
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (grid.tiles[y * grid.w + x] !== "h") continue;
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      if (style === "curtain") {
        back.fillStyle(0x000000, 0.3);
        back.fillRect(px + s * 0.06, py + s * 0.06, s * 0.88, s * 0.88);
        back.fillStyle(0x7c4527, 1);
        back.fillRect(px - s * 0.02, py - s * 0.08, s * 1.04, s * 0.07);
        const folds = 5;
        for (let i = 0; i < folds; i += 1) {
          const fx = px + (i * s) / folds;
          front.fillStyle(i % 2 ? 0xc4687c : 0xd9838f, 0.93);
          front.fillRect(fx, py + s * 0.36, s / folds + 1, s * 0.58);
        }
        front.lineStyle(3, NIGHT.ink, 1);
        front.strokeRect(px, py + s * 0.36, s, s * 0.58);
        front.lineStyle(2, 0xf6e7c4, 0.7);
        front.lineBetween(px + 4, py + s * 0.88, px + s - 4, py + s * 0.88);
        back.fillStyle(0xd9838f, 1);
        for (let i = 0; i < 5; i += 1) back.fillRect(px + (i * s) / 5 + 2, py - s * 0.02, s / 5 - 4, s * 0.4);
        back.lineStyle(2.5, NIGHT.ink, 1);
        back.strokeRect(px, py - s * 0.02, s, s * 0.4);
      } else {
        back.fillStyle(0x000000, 0.3);
        back.fillEllipse(px + s * 0.5, py + s * 0.9, s * 0.8, s * 0.2);
        const leaves = (g: Phaser.GameObjects.Graphics, cy: number, scale: number, alpha: number) => {
          g.fillStyle(0x4c9a43, alpha);
          g.lineStyle(2.5, NIGHT.ink, alpha);
          for (let i = 0; i < 7; i += 1) {
            const a = Math.PI * (0.05 + (i * 0.9) / 6);
            const lx = px + s * 0.5 - Math.cos(a) * s * 0.34 * scale;
            const ly = cy - Math.sin(a) * s * 0.3 * scale;
            g.fillEllipse(lx, ly, s * 0.2 * scale, s * 0.42 * scale);
            g.strokeEllipse(lx, ly, s * 0.2 * scale, s * 0.42 * scale);
          }
        };
        leaves(back, py + s * 0.35, 1.15, 1);
        rect(front, px + s * 0.26, py + s * 0.62, s * 0.48, s * 0.32, 0xc0703f, s * 0.08, 3);
        leaves(front, py + s * 0.7, 0.8, 0.95);
      }
    }
  }
}

export type FaceKind = "none" | "face" | "tall" | "cap";

export function faceMap(grid: Grid): FaceKind[] {
  const out: FaceKind[] = new Array(grid.w * grid.h).fill("none");
  const floorish = (x: number, y: number) => x >= 0 && y >= 0 && x < grid.w && y < grid.h && !isWall(grid, x, y);
  for (let y = 0; y < grid.h; y += 1) for (let x = 0; x < grid.w; x += 1) if (isWall(grid, x, y)) out[y * grid.w + x] = "cap";
  for (let y = 0; y < grid.h - 1; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (!isWall(grid, x, y) || !floorish(x, y + 1)) continue;
      out[y * grid.w + x] = "face";
      for (let k = 1; k <= 2; k += 1) {
        const ty = y - k;
        if (ty < 0 || !isWall(grid, x, ty)) break;
        if (floorish(x - 1, ty) || floorish(x + 1, ty)) break;
        if (ty > 0 && floorish(x, ty - 1)) break;
        out[ty * grid.w + x] = "tall";
      }
    }
  }
  return out;
}

export function rect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, r = 0, lw = 3.5, stroke = NIGHT.ink) {
  g.fillStyle(fill, 1);
  if (r > 0) g.fillRoundedRect(x, y, w, h, r);
  else g.fillRect(x, y, w, h);
  if (lw > 0) {
    g.lineStyle(lw, stroke, 1);
    if (r > 0) g.strokeRoundedRect(x, y, w, h, r);
    else g.strokeRect(x, y, w, h);
  }
}

export function box(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, top: number, front: number, depth: number, r = 6) {
  g.fillStyle(NIGHT.ink, 1);
  g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, r + 2);
  g.fillStyle(front, 1);
  g.fillRoundedRect(x, y, w, h, r);
  g.fillStyle(top, 1);
  g.fillRoundedRect(x, y, w, h - depth, r);
  g.lineStyle(2.5, NIGHT.ink, 0.9);
  g.lineBetween(x + 2, y + h - depth, x + w - 2, y + h - depth);
}

function shade(color: number, f: number) {
  const r = Math.min(255, Math.round(((color >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((color >> 8) & 255) * f));
  const b = Math.min(255, Math.round((color & 255) * f));
  return (r << 16) | (g << 8) | b;
}

export function drawFloor(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout, theme: Theme) {
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (isWall(grid, x, y)) continue;
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      if (theme.floor === "checker") {
        const half = s / 2;
        for (let j = 0; j < 2; j += 1) {
          for (let i = 0; i < 2; i += 1) {
            g.fillStyle((x * 2 + i + y * 2 + j) % 2 ? theme.floorB : theme.floorA, 1);
            g.fillRect(px + i * half, py + j * half, half, half);
          }
        }
        g.lineStyle(1.5, theme.floorLine, 0.5);
        g.strokeRect(px, py, s, s);
        continue;
      }
      g.fillStyle((x + y) % 2 ? theme.floorA : theme.floorB, 1);
      g.fillRect(px, py, s, s);
      const planks = theme.floor === "parquet" ? 4 : 3;
      for (let p = 0; p < planks; p += 1) {
        const top = py + (p * s) / planks;
        const tint = wobble(x * 31 + y * 7 + p * 3) * 0.12 - 0.06;
        g.fillStyle(shade(theme.floorA, 1 + tint), 0.55);
        g.fillRect(px, top + 2, s, s / planks - 3);
        g.lineStyle(2, theme.floorLine, 0.85);
        g.lineBetween(px, top, px + s, top);
        const jx = px + s * (0.18 + wobble(x * 13 + y * 5 + p) * 0.64);
        g.lineBetween(jx, top, jx, top + s / planks);
        g.lineStyle(1.5, shade(theme.floorA, 1.18), 0.5);
        const gy = top + s / planks / 2;
        g.lineBetween(px + s * 0.06, gy, px + s * (0.22 + wobble(x + y * 17 + p) * 0.3), gy);
      }
    }
  }
}

export function drawWalls(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout, theme: Theme) {
  const s = layout.tile;
  const faces = faceMap(grid);
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      const kind = faces[y * grid.w + x];
      if (kind === "none") continue;
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      if (kind === "cap") {
        g.fillStyle(NIGHT.cap, 1);
        g.fillRect(px, py, s, s);
        g.lineStyle(3, NIGHT.capEdge, 1);
        if (!isWall(grid, x - 1, y) || faces[y * grid.w + x - 1] !== "cap") g.lineBetween(px + 1.5, py, px + 1.5, py + s);
        if (!isWall(grid, x + 1, y) || faces[y * grid.w + x + 1] !== "cap") g.lineBetween(px + s - 1.5, py, px + s - 1.5, py + s);
        if (!isWall(grid, x, y + 1) && y + 1 < grid.h) g.lineBetween(px, py + s - 1.5, px + s, py + s - 1.5);
        if (y > 0 && !isWall(grid, x, y - 1)) g.lineBetween(px, py + 1.5, px + s, py + 1.5);
        continue;
      }
      const topOfStack = y === 0 || faces[(y - 1) * grid.w + x] === "cap";
      g.fillStyle(theme.wall, 1);
      g.fillRect(px, py, s, s);
      if (theme.pattern === "stripes") {
        for (let i = 0; i < 4; i += 1) {
          g.fillStyle(theme.wallAlt, 1);
          g.fillRect(px + i * (s / 4) + s * 0.06, py, s * 0.08, s);
        }
      } else if (theme.pattern === "azulejo") {
        const n = 3;
        const c = s / n;
        for (let j = 0; j < n; j += 1) {
          for (let i = 0; i < n; i += 1) {
            const tx = px + i * c;
            const ty = py + j * c;
            g.fillStyle((i + j + x + y) % 2 ? theme.wall : theme.wallAlt, 1);
            g.fillRect(tx + 1, ty + 1, c - 2, c - 2);
            if ((i + j + x) % 2 === 0) {
              g.fillStyle(0x5f9fc0, 0.75);
              g.fillCircle(tx + c / 2, ty + c / 2, c * 0.16);
            }
          }
        }
        g.lineStyle(1.5, 0x8aa3ad, 0.9);
        for (let i = 0; i <= n; i += 1) {
          g.lineBetween(px + i * c, py, px + i * c, py + s);
          g.lineBetween(px, py + i * c, px + s, py + i * c);
        }
      } else {
        g.fillStyle(theme.wallAlt, 1);
        for (let j = 0; j < 2; j += 1) {
          for (let i = 0; i < 2; i += 1) {
            const cx = px + s * (0.25 + i * 0.5) + (j % 2 ? s * 0.25 : 0);
            const cy = py + s * (0.25 + j * 0.5);
            g.fillPoints(
              [
                { x: cx, y: cy - s * 0.1 },
                { x: cx + s * 0.07, y: cy },
                { x: cx, y: cy + s * 0.1 },
                { x: cx - s * 0.07, y: cy },
              ],
              true,
            );
          }
        }
      }
      if (topOfStack) {
        g.fillStyle(NIGHT.cap, 1);
        g.fillRect(px, py, s, s * 0.12);
        g.fillStyle(theme.crown, 1);
        g.fillRect(px, py + s * 0.12, s, s * 0.06);
        g.lineStyle(2, NIGHT.ink, 0.8);
        g.lineBetween(px, py + s * 0.18, px + s, py + s * 0.18);
      }
      if (kind === "face") {
        g.fillStyle(theme.base, 1);
        g.fillRect(px, py + s * 0.86, s, s * 0.14);
        g.lineStyle(2.5, NIGHT.ink, 1);
        g.lineBetween(px, py + s * 0.86, px + s, py + s * 0.86);
        g.fillStyle(0x000000, 0.35);
        g.fillRect(px, py + s, s, s * 0.08);
      }
      g.lineStyle(2, NIGHT.ink, 0.7);
      if (faces[y * grid.w + x - 1] === "cap" || x === 0) g.lineBetween(px + 1, py, px + 1, py + s);
      if (faces[y * grid.w + x + 1] === "cap" || x === grid.w - 1) g.lineBetween(px + s - 1, py, px + s - 1, py + s);
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
      const row = Math.floor(wobble(x * 5 + y * 11) * 2) + 0.5;
      const ph = s * 0.4;
      const tilt = (wobble(x * 3 + y) - 0.5) * 0.14 * s;
      const top = py + row * s * 0.3;
      const poly = (dy: number) => [
        { x: px + 3, y: top + dy + tilt },
        { x: px + s - 3, y: top + dy - tilt },
        { x: px + s - 3, y: top + ph + dy - tilt },
        { x: px + 3, y: top + ph + dy + tilt },
      ];
      g.fillStyle(0x000000, 0.4);
      g.fillPoints(poly(6), true);
      g.fillStyle(NIGHT.creak, 1);
      g.fillPoints(poly(0), true);
      g.lineStyle(3.5, NIGHT.creakEdge, 1);
      g.strokePoints(poly(0), true);
      g.lineStyle(2, 0xb08a5a, 1);
      g.lineBetween(px + s * 0.2, top + ph * 0.45 + tilt * 0.6, px + s * 0.45, top + ph * 0.55 + tilt * 0.1);
      g.lineBetween(px + s * 0.55, top + ph * 0.4 - tilt * 0.1, px + s * 0.75, top + ph * 0.5 - tilt * 0.5);
      g.fillStyle(0x9aa6b8, 1);
      g.fillCircle(px + s * 0.12, top + ph * 0.5 + tilt * 0.75, Math.max(2.5, s * 0.03));
      g.fillCircle(px + s * 0.88, top + ph * 0.5 - tilt * 0.75, Math.max(2.5, s * 0.03));
    }
  }
}

export function drawCreakMarks(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (!isCreaky(grid, x, y)) continue;
      const px = layout.ox + x * s;
      const py = layout.oy + y * s;
      const row = Math.floor(wobble(x * 5 + y * 11) * 2) + 0.5;
      const top = py + row * s * 0.3;
      const cy = top - s * 0.07;
      g.lineStyle(Math.max(2.5, s * 0.028), NIGHT.squiggle, 0.95);
      for (const k of [-1, 1]) {
        const cx = px + s * 0.5 + k * s * 0.2;
        g.beginPath();
        g.moveTo(cx - s * 0.08, cy);
        g.lineTo(cx - s * 0.04, cy - s * 0.045);
        g.lineTo(cx, cy);
        g.lineTo(cx + s * 0.04, cy - s * 0.045);
        g.lineTo(cx + s * 0.08, cy);
        g.strokePath();
      }
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
      rect(g, x + s * 0.06, y - s * 0.22, w - s * 0.12, s * 0.34, 0x7a4a32, s * 0.08);
      rect(g, x + s * 0.06, y + s * 0.04, w - s * 0.12, h - s * 0.1, 0x6a3f2a, s * 0.1);
      rect(g, x + s * 0.14, y + s * 0.1, w - s * 0.28, s * 0.34, 0xf3ecdf, s * 0.1, 3);
      g.lineStyle(2, 0xc9bfae, 1);
      g.lineBetween(x + s * 0.24, y + s * 0.27, x + w - s * 0.24, y + s * 0.27);
      break;
    }
    case "sofa": {
      box(g, x + s * 0.04, y + s * 0.02, w - s * 0.08, h - s * 0.08, 0xb0566a, 0x8a3e52, s * 0.18, s * 0.14);
      rect(g, x + s * 0.04, y + s * 0.02, w - s * 0.08, s * 0.26, 0xc4687c, s * 0.12);
      for (let i = 0; i < (prop.w ?? 1); i += 1) {
        const cx = x + i * s + s * 0.5;
        rect(g, cx - s * 0.34, y + s * 0.3, s * 0.68, s * 0.36, 0xc4687c, s * 0.1, 3);
      }
      const colors = [0xffc83d, 0x63d6c1];
      for (let i = 0; i < (prop.w ?? 1); i += 1) {
        const cx = x + i * s + s * (i === 0 ? 0.3 : 0.7);
        g.fillStyle(colors[i % 2], 1);
        g.fillRoundedRect(cx - s * 0.13, y + s * 0.2, s * 0.26, s * 0.22, 6);
        g.lineStyle(3, ink, 1);
        g.strokeRoundedRect(cx - s * 0.13, y + s * 0.2, s * 0.26, s * 0.22, 6);
        g.lineStyle(1.5, 0xffffff, 0.6);
        g.strokeCircle(cx, y + s * 0.31, s * 0.05);
      }
      break;
    }
    case "armchair": {
      box(g, x + s * 0.08, y + s * 0.06, s * 0.84, s * 0.86, 0x5d7cb0, 0x45619a, s * 0.14, s * 0.16);
      rect(g, x + s * 0.08, y + s * 0.02, s * 0.84, s * 0.26, 0x6f8fc4, s * 0.12);
      rect(g, x + s * 0.02, y + s * 0.26, s * 0.18, s * 0.56, 0x6f8fc4, s * 0.07, 3);
      rect(g, x + s * 0.8, y + s * 0.26, s * 0.18, s * 0.56, 0x6f8fc4, s * 0.07, 3);
      g.fillStyle(0xf6f1e4, 0.95);
      g.fillCircle(x + s * 0.5, y + s * 0.12, s * 0.13);
      g.lineStyle(1.5, 0xc9bfae, 1);
      for (let a = 0; a < 8; a += 1) g.strokeCircle(x + s * 0.5 + Math.cos(a) * s * 0.08, y + s * 0.12 + Math.sin(a) * s * 0.05, s * 0.025);
      break;
    }
    case "table": {
      g.fillStyle(0x000000, 0.35);
      g.fillRoundedRect(x + s * 0.1, y + s * 0.16, w - s * 0.12, h - s * 0.12, 12);
      box(g, x + s * 0.06, y + s * 0.06, w - s * 0.12, h - s * 0.12, 0x9a6440, 0x6d4a3a, s * 0.12, s * 0.08);
      const cx0 = x + s * 0.18;
      const cy0 = y + s * 0.14;
      const cw = w - s * 0.36;
      const ch = h - s * 0.42;
      g.fillStyle(0xf4efe4, 1);
      g.fillRect(cx0, cy0, cw, ch);
      const n = 10;
      for (let i = 0; i < n; i += 2) {
        g.fillStyle(0xd9534f, 0.55);
        g.fillRect(cx0 + (i * cw) / n, cy0, cw / n, ch);
      }
      for (let j = 0; j < 6; j += 2) {
        g.fillStyle(0xd9534f, 0.4);
        g.fillRect(cx0, cy0 + (j * ch) / 6, cw, ch / 6);
      }
      g.lineStyle(2.5, ink, 0.9);
      g.strokeRect(cx0, cy0, cw, ch);
      const plate = (px: number, py: number) => {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(px, py, s * 0.17);
        g.lineStyle(2.5, ink, 1);
        g.strokeCircle(px, py, s * 0.17);
        g.lineStyle(1.5, 0x5f9fc0, 1);
        g.strokeCircle(px, py, s * 0.12);
      };
      plate(cx0 + cw * 0.18, cy0 + ch * 0.35);
      plate(cx0 + cw * 0.82, cy0 + ch * 0.65);
      g.fillStyle(0xc87a3a, 1);
      g.fillEllipse(cx0 + cw * 0.5, cy0 + ch * 0.5, s * 0.5, s * 0.3);
      g.lineStyle(2.5, ink, 1);
      g.strokeEllipse(cx0 + cw * 0.5, cy0 + ch * 0.5, s * 0.5, s * 0.3);
      g.fillStyle(0xf2d2a0, 1);
      g.fillEllipse(cx0 + cw * 0.45, cy0 + ch * 0.46, s * 0.18, s * 0.12);
      g.fillEllipse(cx0 + cw * 0.56, cy0 + ch * 0.52, s * 0.18, s * 0.12);
      rect(g, cx0 + cw * 0.66, cy0 + ch * 0.12, s * 0.16, s * 0.32, 0xef4f43, s * 0.06, 2.5);
      g.fillStyle(0xf6f1e4, 1);
      g.fillCircle(cx0 + cw * 0.66 + s * 0.08, cy0 + ch * 0.12 + s * 0.06, s * 0.05);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx0 + cw * 0.32, cy0 + ch * 0.72, s * 0.07);
      g.lineStyle(2, ink, 1);
      g.strokeCircle(cx0 + cw * 0.32, cy0 + ch * 0.72, s * 0.07);
      g.fillStyle(0x6b3d1f, 1);
      g.fillCircle(cx0 + cw * 0.32, cy0 + ch * 0.72, s * 0.04);
      break;
    }
    case "fridge": {
      box(g, x + s * 0.08, y - s * 0.55, s * 0.84, s * 1.45, 0xeef1f7, 0xc9cfdc, s * 0.95, s * 0.1);
      g.lineStyle(2.5, ink, 1);
      g.lineBetween(x + s * 0.08, y - s * 0.12, x + s * 0.92, y - s * 0.12);
      rect(g, x + s * 0.76, y - s * 0.42, s * 0.06, s * 0.22, 0x9aa6b8, 2, 2);
      rect(g, x + s * 0.76, y - s * 0.02, s * 0.06, s * 0.3, 0x9aa6b8, 2, 2);
      const mags = [0xef4f43, 0xffc83d, 0x63d6c1, 0x5cb9f0];
      mags.forEach((c, i) => {
        g.fillStyle(c, 1);
        g.fillCircle(x + s * (0.24 + (i % 2) * 0.22), y + s * (0.05 + Math.floor(i / 2) * 0.16), s * 0.05);
      });
      rect(g, x + s * 0.3, y - s * 0.4, s * 0.24, s * 0.2, 0xfbf5e6, 2, 2);
      break;
    }
    case "stove": {
      box(g, x + s * 0.04, y - s * 0.12, w - s * 0.08, s * 1.0, 0xe6e0d4, 0xbdb6a8, s * 0.42, 6);
      for (let i = 0; i < 4; i += 1) {
        const bx = x + s * (0.28 + (i % 2) * 0.44);
        const by = y + s * (0.0 + Math.floor(i / 2) * 0.24);
        g.fillStyle(0x2b2150, 1);
        g.fillCircle(bx, by, s * 0.1);
        g.lineStyle(2, 0x9aa6b8, 1);
        g.strokeCircle(bx, by, s * 0.06);
      }
      for (let i = 0; i < 4; i += 1) {
        g.fillStyle(0x3a3157, 1);
        g.fillCircle(x + s * (0.2 + i * 0.2), y + s * 0.6, s * 0.04);
      }
      rect(g, x + s * 0.2, y + s * 0.68, s * 0.6, s * 0.16, 0x3a3157, 3, 2);
      rect(g, x + s * 0.5, y - s * 0.1, s * 0.32, s * 0.24, 0xd94f5c, s * 0.1, 2.5);
      g.lineStyle(3, ink, 1);
      g.lineBetween(x + s * 0.8, y - s * 0.04, x + s * 0.92, y - s * 0.12);
      break;
    }
    case "sink": {
      box(g, x + s * 0.02, y - s * 0.12, w - s * 0.04, s * 1.0, 0xd6d0c4, 0x9a6a48, s * 0.42, 6);
      rect(g, x + s * 0.18, y - s * 0.04, s * 0.64, s * 0.38, 0xaab4c4, s * 0.08, 2.5);
      g.fillStyle(0x6f7b8f, 1);
      g.fillCircle(x + s * 0.5, y + s * 0.18, s * 0.04);
      rect(g, x + s * 0.44, y - s * 0.2, s * 0.12, s * 0.2, 0x9aa6b8, 3, 2);
      for (let i = 0; i < 2; i += 1) rect(g, x + s * (0.12 + i * 0.44), y + s * 0.5, s * 0.32, s * 0.34, 0xa8774f, 3, 2);
      break;
    }
    case "counter": {
      box(g, x + s * 0.02, y - s * 0.12, w - s * 0.04, s * 1.0, 0xd6d0c4, 0x9a6a48, s * 0.42, 6);
      for (let i = 0; i < (prop.w ?? 1); i += 1) {
        rect(g, x + i * s + s * 0.12, y + s * 0.5, s * 0.34, s * 0.34, 0xa8774f, 3, 2);
        rect(g, x + i * s + s * 0.54, y + s * 0.5, s * 0.34, s * 0.34, 0xa8774f, 3, 2);
        g.fillStyle(0xe8d9a0, 1);
        g.fillCircle(x + i * s + s * 0.42, y + s * 0.67, s * 0.025);
        g.fillCircle(x + i * s + s * 0.58, y + s * 0.67, s * 0.025);
      }
      break;
    }
    case "counterLow": {
      box(g, x + s * 0.02, y + s * 0.06, w - s * 0.04, s * 0.88, 0xd6d0c4, 0x9a6a48, s * 0.2, 6);
      break;
    }
    case "shelf": {
      box(g, x + s * 0.04, y + s * 0.1, w - s * 0.08, s * 0.84, 0x8a5a3c, 0x6a3f2a, s * 0.62, 6);
      const spines = [0x2b2150, 0xef4f43, 0x1d1830, 0x5cb9f0, 0x2b2150, 0xffc83d, 0x1d1830, 0x63d6c1, 0x2b2150, 0xf06ba8, 0x1d1830, 0xef4f43];
      const n = Math.floor((w - s * 0.2) / (s * 0.13));
      for (let i = 0; i < n; i += 1) {
        const bx = x + s * 0.12 + i * s * 0.13;
        const tall = i % 5 === 3 ? 0.3 : 0.4;
        g.fillStyle(spines[i % spines.length], 1);
        g.fillRect(bx, y + s * (0.86 - tall), s * 0.11, s * tall);
        g.lineStyle(1.5, ink, 1);
        g.strokeRect(bx, y + s * (0.86 - tall), s * 0.11, s * tall);
        g.fillStyle(0xfbf5e6, 0.9);
        g.fillRect(bx + s * 0.02, y + s * 0.6, s * 0.07, s * 0.08);
      }
      g.fillStyle(0xf6f1e4, 1);
      g.fillEllipse(x + w * 0.3, y + s * 0.26, s * 0.18, s * 0.14);
      g.lineStyle(2, ink, 1);
      g.strokeEllipse(x + w * 0.3, y + s * 0.26, s * 0.18, s * 0.14);
      g.fillStyle(0x4c9a43, 1);
      g.fillCircle(x + w * 0.72, y + s * 0.24, s * 0.12);
      g.strokeCircle(x + w * 0.72, y + s * 0.24, s * 0.12);
      break;
    }
    case "plant": {
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(x + s * 0.52, y + s * 0.86, s * 0.6, s * 0.16);
      rect(g, x + s * 0.28, y + s * 0.48, s * 0.44, s * 0.4, 0xc0703f, s * 0.08, 3);
      g.fillStyle(0x4c9a43, 1);
      g.lineStyle(2.5, ink, 1);
      for (let i = 0; i < 6; i += 1) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.45;
        const lx = x + s * 0.5 + Math.cos(a) * s * 0.26;
        const ly = y + s * 0.42 + Math.sin(a) * s * 0.3;
        g.fillEllipse(lx, ly, s * 0.18, s * 0.3);
        g.strokeEllipse(lx, ly, s * 0.18, s * 0.3);
      }
      break;
    }
    case "tv": {
      rect(g, x + s * 0.12, y + s * 0.52, s * 0.76, s * 0.4, 0x6a3f2a, 6);
      box(g, x + s * 0.06, y - s * 0.06, s * 0.88, s * 0.76, 0x7a5a3a, 0x5a3d26, s * 0.1, s * 0.1);
      rect(g, x + s * 0.14, y + s * 0.02, s * 0.56, s * 0.5, 0x9df0dc, s * 0.1, 3);
      g.fillStyle(0xffffff, 0.35);
      g.fillEllipse(x + s * 0.3, y + s * 0.14, s * 0.14, s * 0.08);
      for (let i = 0; i < 3; i += 1) {
        g.fillStyle(0x2b2150, 1);
        g.fillCircle(x + s * 0.82, y + s * (0.1 + i * 0.16), s * 0.045);
      }
      g.lineStyle(3, 0x9aa6b8, 1);
      g.lineBetween(x + s * 0.5, y - s * 0.06, x + s * 0.3, y - s * 0.42);
      g.lineBetween(x + s * 0.5, y - s * 0.06, x + s * 0.72, y - s * 0.44);
      g.fillStyle(0xd9dce4, 1);
      g.fillCircle(x + s * 0.72, y - s * 0.44, s * 0.07);
      g.fillCircle(x + s * 0.3, y - s * 0.42, s * 0.04);
      g.lineStyle(2, ink, 1);
      g.strokeCircle(x + s * 0.72, y - s * 0.44, s * 0.07);
      break;
    }
    case "vcr": {
      rect(g, x + s * 0.12, y + s * 0.08, s * 0.76, s * 0.84, 0x6a3f2a, 6);
      box(g, x + s * 0.16, y + s * 0.18, s * 0.68, s * 0.3, 0x3a3157, 0x2b2150, s * 0.14, 4);
      g.fillStyle(0x1d1830, 1);
      g.fillRect(x + s * 0.22, y + s * 0.36, s * 0.3, s * 0.06);
      const tapes = [0x1d1830, 0x2b2150, 0x1d1830];
      tapes.forEach((c, i) => rect(g, x + s * (0.2 + i * 0.2), y + s * 0.58, s * 0.16, s * 0.28, c, 2, 2));
      g.fillStyle(0xfbf5e6, 1);
      tapes.forEach((_c, i) => g.fillRect(x + s * (0.22 + i * 0.2), y + s * 0.62, s * 0.12, s * 0.06));
      break;
    }
    case "dogbed":
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(x + s * 0.52, y + s * 0.6, s * 0.9, s * 0.66);
      g.fillStyle(0xc94785, 1);
      g.fillEllipse(x + s * 0.5, y + s * 0.55, s * 0.86, s * 0.64);
      g.lineStyle(3.5, ink, 1);
      g.strokeEllipse(x + s * 0.5, y + s * 0.55, s * 0.86, s * 0.64);
      g.fillStyle(0xf06ba8, 1);
      g.fillEllipse(x + s * 0.5, y + s * 0.58, s * 0.6, s * 0.4);
      g.fillStyle(0xffffff, 0.7);
      for (let i = 0; i < 5; i += 1) g.fillCircle(x + s * (0.3 + i * 0.1), y + s * (0.5 + (i % 2) * 0.12), s * 0.025);
      break;
    case "stairs": {
      if (prop.f === 0) {
        for (let i = 0; i < 5; i += 1) {
          const shade3 = [0x48301f, 0x63402a, 0x7f5436, 0x9a6844, 0xb27c57][i];
          g.fillStyle(shade3, 1);
          g.fillRect(x + s * 0.04, y + s * 0.04 + i * s * 0.18, w - s * 0.08, s * 0.18);
          g.lineStyle(2.5, ink, 1);
          g.strokeRect(x + s * 0.04, y + s * 0.04 + i * s * 0.18, w - s * 0.08, s * 0.18);
        }
        break;
      }
      for (let i = 0; i < 5; i += 1) {
        const shade2 = [0xb27c57, 0x9a6844, 0x7f5436, 0x63402a, 0x48301f][i];
        g.fillStyle(shade2, 1);
        g.fillRect(x + s * 0.04 + i * s * 0.18, y + s * 0.04, s * 0.18, s * 0.92);
        g.lineStyle(2.5, ink, 1);
        g.strokeRect(x + s * 0.04 + i * s * 0.18, y + s * 0.04, s * 0.18, s * 0.92);
      }
      rect(g, x + s * 0.02, y - s * 0.02, s * 0.96, s * 0.08, 0x7c4527, 3, 2.5);
      break;
    }
    case "door":
      break;
    case "pantry": {
      box(g, x + s * 0.04, y - s * 0.4, s * 0.92, s * 1.3, 0xb88a5e, 0x8a5a3c, s * 0.9, 5);
      const jars = [0xffc83d, 0xef4f43, 0xf6f1e4, 0x93cf4c, 0xc0703f, 0x5cb9f0];
      for (let r = 0; r < 2; r += 1) {
        g.lineStyle(3, 0x6a3f2a, 1);
        g.lineBetween(x + s * 0.08, y - s * 0.02 + r * s * 0.38, x + s * 0.92, y - s * 0.02 + r * s * 0.38);
        for (let i = 0; i < 3; i += 1) {
          const jx = x + s * (0.14 + i * 0.26);
          const jy = y - s * 0.3 + r * s * 0.38;
          rect(g, jx, jy, s * 0.2, s * 0.26, 0xe9f2f6, 4, 2);
          g.fillStyle(jars[(i + r * 3) % jars.length], 1);
          g.fillRect(jx + 3, jy + s * 0.1, s * 0.2 - 6, s * 0.14);
        }
      }
      break;
    }
    case "washer": {
      box(g, x + s * 0.06, y + s * 0.04, s * 0.88, h - s * 0.1, 0xeef1f7, 0xc9cfdc, s * 0.5, 8);
      g.fillStyle(0x6f86c9, 1);
      g.fillCircle(x + s * 0.5, y + s * 0.62, s * 0.26);
      g.lineStyle(4, 0x9aa6b8, 1);
      g.strokeCircle(x + s * 0.5, y + s * 0.62, s * 0.26);
      g.fillStyle(0xa9dcf7, 0.6);
      g.fillEllipse(x + s * 0.42, y + s * 0.55, s * 0.14, s * 0.08);
      box(g, x + s * 1.06, y + s * 0.04, s * 0.88, h - s * 0.1, 0xdce8ec, 0xb3c7cf, s * 0.5, 8);
      rect(g, x + s * 1.18, y + s * 0.12, s * 0.64, s * 0.9, 0x9fb6c4, s * 0.12, 3);
      g.lineStyle(2.5, 0x6f7b8f, 1);
      for (let i = 0; i < 4; i += 1) g.lineBetween(x + s * 1.24, y + s * (0.3 + i * 0.16), x + s * 1.76, y + s * (0.3 + i * 0.16));
      rect(g, x + s * 1.3, y + s * 1.2, s * 0.4, s * 0.26, 0x5cb9f0, s * 0.06, 2.5);
      rect(g, x + s * 0.25, y + s * 1.22, s * 0.3, s * 0.36, 0xf06ba8, s * 0.08, 2.5);
      break;
    }
    case "cabinet": {
      box(g, x + s * 0.06, y - s * 0.5, s * 0.88, s * 1.38, 0x8a5a3c, 0x6a3f2a, s * 1.0, 6);
      rect(g, x + s * 0.14, y - s * 0.12, s * 0.72, s * 0.5, 0xa9dcf7, 4, 2.5);
      for (let i = 0; i < 3; i += 1) {
        g.fillStyle(0xf6f1e4, 1);
        g.fillCircle(x + s * (0.28 + i * 0.22), y + s * 0.02, s * 0.07);
        g.fillCircle(x + s * (0.28 + i * 0.22), y + s * 0.24, s * 0.06);
      }
      break;
    }
    case "sewing": {
      box(g, x + s * 0.08, y + s * 0.2, s * 0.84, s * 0.22, 0x8a5a3c, 0x6a3f2a, s * 0.06, 4);
      rect(g, x + s * 0.24, y - s * 0.2, s * 0.5, s * 0.4, 0x1d1830, 6, 2.5);
      rect(g, x + s * 0.42, y + s * 0.76, s * 0.36, s * 0.1, 0x2b2150, 3, 2);
      break;
    }
    case "aquarium": {
      box(g, x + s * 0.12, y + s * 0.34, s * 0.76, s * 0.52, 0x6d4a3a, 0x5a3d26, s * 0.2, 4);
      rect(g, x + s * 0.1, y - s * 0.22, s * 0.8, s * 0.58, 0x4fd1c5, 4, 2.5);
      g.fillStyle(0xffb35c, 1);
      g.fillEllipse(x + s * 0.42, y + s * 0.02, s * 0.12, s * 0.07);
      break;
    }
    case "chair": {
      box(g, x + s * 0.2, y + s * 0.18, s * 0.6, s * 0.68, 0xb07a4f, 0x8a5a3c, s * 0.16, 6);
      rect(g, x + s * 0.2, y + s * 0.06, s * 0.6, s * 0.2, 0x9a6440, 4, 3);
      g.fillStyle(0xef4f43, 0.8);
      g.fillRoundedRect(x + s * 0.28, y + s * 0.34, s * 0.44, s * 0.28, 6);
      break;
    }
    case "sideboard": {
      box(g, x + s * 0.04, y + s * 0.12, w - s * 0.08, s * 0.82, 0x9a6440, 0x6d4a3a, s * 0.4, 6);
      for (let i = 0; i < (prop.w ?? 1); i += 1) rect(g, x + i * s + s * 0.16, y + s * 0.62, s * 0.68, s * 0.26, 0x8a5a3c, 3, 2);
      g.fillStyle(0xf6f1e4, 1);
      g.fillEllipse(x + w * 0.25, y + s * 0.3, s * 0.36, s * 0.16);
      rect(g, x + w * 0.72, y + s * 0.16, s * 0.16, s * 0.26, 0x63d6c1, s * 0.06, 2.5);
      g.fillStyle(0xf06ba8, 1);
      g.fillCircle(x + w * 0.8, y + s * 0.14, s * 0.07);
      break;
    }
    default:
      rect(g, x + s * 0.08, y + s * 0.08, w - s * 0.16, h - s * 0.16, 0x7a4a32, 8);
  }
}

export function drawProps(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout, skip: (p: PropDef) => boolean = () => false) {
  const covered = new Set<number>();
  for (const prop of grid.level.props) {
    for (let dy = 0; dy < (prop.h ?? 1); dy += 1) for (let dx = 0; dx < (prop.w ?? 1); dx += 1) covered.add((prop.y + dy) * grid.w + prop.x + dx);
  }
  const s = layout.tile;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (tileAt(grid, x, y) !== "o" || covered.has(y * grid.w + x)) continue;
      box(g, layout.ox + x * s + s * 0.08, layout.oy + y * s + s * 0.08, s * 0.84, s * 0.84, 0x8a5a3c, 0x6a3f2a, s * 0.2, 8);
    }
  }
  const sorted = grid.level.props.filter((p) => !skip(p)).sort((a, b) => a.y - b.y);
  for (const prop of sorted) drawProp(g, prop, layout);
}

export function drawGoal(g: Phaser.GameObjects.Graphics, grid: Grid, layout: Layout) {
  const s = layout.tile;
  const x = layout.ox + grid.goal.x * s;
  const y = layout.oy + grid.goal.y * s;
  g.lineStyle(5, NIGHT.goal, 0.95);
  const dash = s * 0.1;
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
