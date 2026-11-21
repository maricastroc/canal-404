import type { Insets } from "../kit/insets";
import { FLOOR_Y, H, W } from "./config";
import { blockPoly, goalLayout, pipeKeepOut, polyBox, sceneBlocks } from "./geometry";
import type { LevelDef, Rect } from "./levels";

export type FrameKind = "full" | "band";

export type Columns = 1 | 2;

export type Frame = {
  kind: FrameKind;
  width: number;
  height: number;
  unit: number;
  scrollX: number;
  scrollY: number;
  stage: Rect;
  left: Rect;
  right: Rect;
  cols: { left: Columns; right: Columns };
  safe: Insets;
};

export const BAND = { maxHeight: 540, minAspect: 1.45, rail: { share: 0.105, min: 72, max: 100, cell: 50 }, edge: 10, gap: 6, maxScale: 0.7, margin: 26 };

export const RAIL_FIT = { pad: 8, gap: 8, chip: 32, slot: 44, stats: 42, button: 38, run: 50 };

const LINA: Rect = { x: 20, y: 690, w: 160, h: 250 };
const FLOOR_LINE = FLOOR_Y + 30;

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const FULL_FRAME: Frame = {
  kind: "full",
  width: W,
  height: H,
  unit: 1,
  scrollX: 0,
  scrollY: 0,
  stage: { x: 0, y: 0, w: W, h: H },
  left: { x: 0, y: 0, w: 0, h: H },
  right: { x: W, y: 0, w: 0, h: H },
  cols: { left: 1, right: 1 },
  safe: NO_INSETS,
};

type LevelShape = Pick<LevelDef, "pipe" | "blocks" | "goal" | "build" | "decor" | "inventory">;

function decorBoxes(level: LevelShape): Rect[] {
  const g = level.goal;
  return level.decor.map((d) => (d === "cat" ? { x: g.x + 60, y: FLOOR_Y - 110, w: 140, h: 110 } : { x: g.x - 175, y: FLOOR_Y - 190, w: 230, h: 190 }));
}

export function levelBounds(level: LevelShape): Rect {
  const boxes: Rect[] = [LINA, level.build, pipeKeepOut(level.pipe.x, level.pipe.y), goalLayout(level.goal).keepOut, ...decorBoxes(level)];
  for (const b of sceneBlocks(level)) {
    const box = polyBox(blockPoly(b));
    boxes.push({ x: box.left, y: box.top, w: box.right - box.left, h: box.bottom - box.top });
  }
  const m = BAND.margin;
  const left = Math.max(0, Math.min(...boxes.map((b) => b.x)) - m);
  const right = Math.min(W, Math.max(...boxes.map((b) => b.x + b.w)) + m);
  const top = Math.max(0, Math.min(...boxes.map((b) => b.y)) - m);
  const bottom = Math.min(H, Math.max(FLOOR_LINE, ...boxes.map((b) => b.y + b.h)) + m);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

function place(center: number, size: number, max: number) {
  if (size >= max) return (max - size) / 2;
  return Math.min(Math.max(center - size / 2, 0), max - size);
}

function railWidth(cssW: number, cols: Columns) {
  const one = Math.min(BAND.rail.max, Math.max(BAND.rail.min, cssW * BAND.rail.share));
  return cols === 1 ? one : Math.max(one, BAND.rail.cell * 2 + BAND.gap);
}

export function railColumns(cssH: number, slots: number): Frame["cols"] {
  const f = RAIL_FIT;
  const left = f.pad * 2 + f.chip + f.gap + slots * f.slot + (slots - 1) * f.gap;
  const right = f.pad * 2 + f.stats + 3 * f.button + f.run + 4 * f.gap;
  return { left: cssH >= left ? 1 : 2, right: cssH >= right ? 1 : 2 };
}

function bandFrame(cssW: number, cssH: number, insets: Insets, level: LevelShape): Frame {
  const slots = Object.values(level.inventory).filter((n) => (n ?? 0) > 0).length;
  const cols = railColumns(cssH - insets.bottom, slots);
  let leftCss = Math.max(insets.left, BAND.edge) + railWidth(cssW, cols.left) + BAND.gap;
  let rightCss = Math.max(insets.right, BAND.edge) + railWidth(cssW, cols.right) + BAND.gap;
  const roomW = Math.max(1, cssW - leftCss - rightCss);
  const content = levelBounds(level);
  const s = Math.min(BAND.maxScale, roomW / content.w, cssH / content.h);
  const unit = 1 / s;
  const viewW = Math.min(roomW * unit, W);
  const viewH = Math.min(cssH * unit, H);
  const spareW = roomW - viewW * s;
  leftCss += spareW / 2;
  rightCss += spareW / 2;
  const top = (cssH - viewH * s) / 2;
  const viewX = place(content.x + content.w / 2, viewW, W);
  const viewY = place(content.y + content.h / 2, viewH, H);
  const width = Math.round(cssW * unit);
  const height = Math.round(cssH * unit);
  const leftW = leftCss * unit;
  const rightW = rightCss * unit;
  const stageY = top * unit;
  return {
    kind: "band",
    width,
    height,
    unit,
    scrollX: viewX - leftW,
    scrollY: viewY - stageY,
    stage: { x: leftW, y: stageY, w: viewW, h: viewH },
    left: { x: 0, y: 0, w: leftW, h: height },
    right: { x: width - rightW, y: 0, w: rightW, h: height },
    cols,
    safe: { top: insets.top * unit, right: insets.right * unit, bottom: insets.bottom * unit, left: insets.left * unit },
  };
}

export function frameFor(cssW: number, cssH: number, insets: Insets, level: LevelShape): Frame {
  if (cssW <= 0 || cssH <= 0) return FULL_FRAME;
  if (cssW <= cssH || cssH > BAND.maxHeight || cssW / cssH < BAND.minAspect) return FULL_FRAME;
  return bandFrame(cssW, cssH, insets, level);
}

export function sameFrame(a: Frame, b: Frame) {
  const near = (x: number, y: number) => Math.abs(x - y) < 0.5;
  return (
    a.kind === b.kind &&
    a.width === b.width &&
    a.height === b.height &&
    near(a.scrollX, b.scrollX) &&
    near(a.scrollY, b.scrollY) &&
    near(a.stage.w, b.stage.w) &&
    near(a.left.w, b.left.w) &&
    near(a.right.w, b.right.w) &&
    near(a.stage.y, b.stage.y) &&
    a.cols.left === b.cols.left &&
    a.cols.right === b.cols.right &&
    near(a.safe.bottom, b.safe.bottom)
  );
}
