import type { Insets } from "../kit/insets";
import { H, W } from "./config";

export type FrameKind = "full" | "tall";

export type Rect = { x: number; y: number; w: number; h: number };

export type Frame = {
  kind: FrameKind;
  width: number;
  height: number;
  unit: number;
  top: Rect;
  stage: Rect;
  deck: Rect;
  zoom: number;
  compact: boolean;
  safe: Insets;
};

export const TALL = {
  minRatio: 1.1,
  unit: 2.5,
  pixels: 3_200_000,
  top: 100,
  compactTop: 92,
  deck: 142,
  compactDeck: 124,
  compactBelow: 600,
  view: { w: 760, h: 620, maxScale: 0.62 },
};

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const FULL_FRAME: Frame = {
  kind: "full",
  width: W,
  height: H,
  unit: 1,
  top: { x: 0, y: 0, w: W, h: 0 },
  stage: { x: 0, y: 0, w: W, h: H },
  deck: { x: 0, y: H, w: W, h: 0 },
  zoom: 1,
  compact: false,
  safe: NO_INSETS,
};

function tallFrame(cssW: number, cssH: number, insets: Insets): Frame {
  const unit = Math.min(TALL.unit, Math.sqrt(TALL.pixels / (cssW * cssH)));
  const compact = cssH < TALL.compactBelow;
  const topCss = (compact ? TALL.compactTop : TALL.top) + insets.top;
  const deckCss = (compact ? TALL.compactDeck : TALL.deck) + insets.bottom;
  const stageCss = Math.max(1, cssH - topCss - deckCss);
  const scale = Math.min(cssW / TALL.view.w, stageCss / TALL.view.h, TALL.view.maxScale);
  const width = Math.round(cssW * unit);
  const height = Math.round(cssH * unit);
  const top = Math.round(topCss * unit);
  const stageH = Math.round(stageCss * unit);
  return {
    kind: "tall",
    width,
    height,
    unit,
    top: { x: 0, y: 0, w: width, h: top },
    stage: { x: 0, y: top, w: width, h: stageH },
    deck: { x: 0, y: top + stageH, w: width, h: height - top - stageH },
    zoom: scale * unit,
    compact,
    safe: { top: insets.top * unit, right: insets.right * unit, bottom: insets.bottom * unit, left: insets.left * unit },
  };
}

export function frameFor(cssW: number, cssH: number, insets: Insets = NO_INSETS): Frame {
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
