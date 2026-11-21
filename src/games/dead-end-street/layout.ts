import type { Insets } from "../kit/insets";
import { H, W } from "./config";

export type FrameKind = "full" | "tall";

export type Rect = { x: number; y: number; w: number; h: number };

export type Frame = {
  kind: FrameKind;
  width: number;
  height: number;
  unit: number;
  stage: Rect;
  top: Rect;
  dock: Rect;
  zoom: number;
  overview: number;
  safe: Insets;
};

export const TALL = {
  minRatio: 1.1,
  unit: 2.5,
  pixels: 3_200_000,
  top: 104,
  compactTop: 94,
  dock: 148,
  band: { top: 150, bottom: 1058 },
  view: { min: 600, max: 1120 },
};

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const FULL_FRAME: Frame = {
  kind: "full",
  width: W,
  height: H,
  unit: 1,
  stage: { x: 0, y: 0, w: W, h: H },
  top: { x: 0, y: 0, w: W, h: 0 },
  dock: { x: 0, y: H, w: W, h: 0 },
  zoom: 1,
  overview: 1,
  safe: NO_INSETS,
};

function tallFrame(cssW: number, cssH: number, insets: Insets): Frame {
  const unit = Math.min(TALL.unit, Math.sqrt(TALL.pixels / (cssW * cssH)));
  const topCss = (cssH < 700 ? TALL.compactTop : TALL.top) + insets.top;
  const dockCss = TALL.dock + insets.bottom;
  const stageH = Math.max(1, cssH - topCss - dockCss);
  const band = TALL.band.bottom - TALL.band.top;
  const zoom = Math.min(Math.max(stageH / band, cssW / TALL.view.max), cssW / TALL.view.min);
  const width = Math.round(cssW * unit);
  const height = Math.round(cssH * unit);
  const stage = { x: 0, y: topCss * unit, w: width, h: stageH * unit };
  const dockY = stage.y + stage.h;
  return {
    kind: "tall",
    width,
    height,
    unit,
    stage,
    top: { x: 0, y: 0, w: width, h: stage.y },
    dock: { x: 0, y: dockY, w: width, h: height - dockY },
    zoom: zoom * unit,
    overview: Math.min(cssW / W, stageH / (H * 0.62)) * unit,
    safe: { top: insets.top * unit, right: insets.right * unit, bottom: insets.bottom * unit, left: insets.left * unit },
  };
}

export function frameFor(cssW: number, cssH: number, insets: Insets): Frame {
  if (cssW <= 0 || cssH <= 0) return FULL_FRAME;
  if (cssH >= cssW * TALL.minRatio) return tallFrame(cssW, cssH, insets);
  return FULL_FRAME;
}

export function sameFrame(a: Frame, b: Frame) {
  const near = (x: number, y: number) => Math.abs(x - y) < 0.5;
  return (
    a.kind === b.kind &&
    a.width === b.width &&
    a.height === b.height &&
    near(a.stage.y, b.stage.y) &&
    near(a.stage.h, b.stage.h) &&
    Math.abs(a.zoom - b.zoom) < 1e-4 &&
    near(a.safe.bottom, b.safe.bottom) &&
    near(a.safe.top, b.safe.top)
  );
}
