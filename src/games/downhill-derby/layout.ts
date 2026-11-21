import type { Insets } from "../kit/insets";

export const W = 1920;
export const H = 1080;

export type FrameKind = "full" | "tall";

export type Rect = { x: number; y: number; w: number; h: number };

export type Frame = {
  kind: FrameKind;
  width: number;
  height: number;
  unit: number;
  css: { w: number; h: number };
  view: Rect;
  deck: Rect;
  compact: boolean;
  safe: Insets;
};

export const TALL = {
  minRatio: 1.1,
  unit: 2.6,
  pixels: 2_400_000,
  deck: { share: 0.22, min: 124, max: 166 },
  compactBelow: 600,
};

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const FULL_FRAME: Frame = {
  kind: "full",
  width: W,
  height: H,
  unit: 1,
  css: { w: W, h: H },
  view: { x: 0, y: 0, w: W, h: H },
  deck: { x: 0, y: H, w: W, h: 0 },
  compact: false,
  safe: NO_INSETS,
};

function tallFrame(cssW: number, cssH: number, insets: Insets): Frame {
  const unit = Math.min(TALL.unit, Math.sqrt(TALL.pixels / (cssW * cssH)));
  const deckCss = Math.min(TALL.deck.max, Math.max(TALL.deck.min, cssH * TALL.deck.share)) + insets.bottom;
  const width = Math.round(cssW * unit);
  const height = Math.round(cssH * unit);
  const deckH = Math.round(deckCss * unit);
  return {
    kind: "tall",
    width,
    height,
    unit,
    css: { w: cssW, h: cssH },
    view: { x: 0, y: 0, w: width, h: height - deckH },
    deck: { x: 0, y: height - deckH, w: width, h: deckH },
    compact: cssH < TALL.compactBelow,
    safe: { top: insets.top * unit, right: insets.right * unit, bottom: insets.bottom * unit, left: insets.left * unit },
  };
}

export function frameFor(cssW: number, cssH: number, insets: Insets = NO_INSETS): Frame {
  if (cssW <= 0 || cssH <= 0) return FULL_FRAME;
  if (cssH >= cssW * TALL.minRatio) return tallFrame(cssW, cssH, insets);
  return FULL_FRAME;
}

export function sameFrame(a: Frame, b: Frame) {
  return a.kind === b.kind && a.width === b.width && a.height === b.height && Math.abs(a.unit - b.unit) < 1e-4 && a.deck.h === b.deck.h && a.safe.left === b.safe.left && a.safe.right === b.safe.right && a.safe.bottom === b.safe.bottom && a.safe.top === b.safe.top;
}
