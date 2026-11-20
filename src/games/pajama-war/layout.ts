import { H, W } from "./config";

export type FrameKind = "full" | "tall" | "band";

export type Insets = { top: number; right: number; bottom: number; left: number };

export type Frame = {
  kind: FrameKind;
  width: number;
  height: number;
  unit: number;
  zoom: number;
  top: number;
  hud: number;
  deck: number;
  safe: Insets;
};

export const LIP = H;
export const HEAD_MIN = 170;
export const WALL_EXT = 160;

export const TALL = { width: 1080, scale: 0.41, viewMin: 840, hud: 66, deck: [150, 0.24, 196], deckMin: 128 };
export const BAND = { height: 1080, minAspect: 1.85, maxHeight: 520, hud: 50 };

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const FULL_FRAME: Frame = { kind: "full", width: W, height: H, unit: 1, zoom: 1, top: 0, hud: 0, deck: 0, safe: NO_INSETS };

function scaled(insets: Insets, unit: number): Insets {
  return { top: insets.top * unit, right: insets.right * unit, bottom: insets.bottom * unit, left: insets.left * unit };
}

function tallFrame(cssW: number, cssH: number, insets: Insets): Frame {
  const unit = TALL.width / cssW;
  const hud = TALL.hud + insets.top;
  const gameplay = LIP - HEAD_MIN;
  const widest = cssW / W;
  let s = Math.min(Math.max(TALL.scale, widest), cssW / TALL.viewMin);
  const deckMin = TALL.deckMin + insets.bottom;
  const [deckLow, deckShare, deckHigh] = TALL.deck;
  const deckWanted = Math.min(deckHigh, Math.max(deckLow, cssH * deckShare)) + insets.bottom;
  if (cssH - hud - gameplay * s < deckMin) s = Math.max(widest, (cssH - hud - deckMin) / gameplay);
  if (cssH - (LIP + WALL_EXT) * s > deckWanted) s = Math.min(cssW / TALL.viewMin, (cssH - deckWanted) / (LIP + WALL_EXT));
  const deckMax = cssH - hud - gameplay * s;
  const deckLeast = cssH - (LIP + WALL_EXT) * s;
  const deck = Math.max(deckLeast, Math.min(deckWanted, deckMax));
  const top = LIP - (cssH - deck) / s;
  return { kind: "tall", width: TALL.width, height: Math.round(cssH * unit), unit, zoom: s * unit, top, hud: hud * unit, deck: deck * unit, safe: scaled(insets, unit) };
}

function bandFrame(cssW: number, cssH: number, insets: Insets): Frame {
  const unit = BAND.height / cssH;
  const s = cssW / W;
  return { kind: "band", width: Math.round(cssW * unit), height: BAND.height, unit, zoom: s * unit, top: 0, hud: (BAND.hud + insets.top) * unit, deck: 0, safe: scaled(insets, unit) };
}

export function frameFor(cssW: number, cssH: number, insets: Insets = NO_INSETS): Frame {
  if (cssW <= 0 || cssH <= 0) return FULL_FRAME;
  if (cssH >= cssW * 1.05) return tallFrame(cssW, cssH, insets);
  if (cssH <= BAND.maxHeight && cssW / cssH >= BAND.minAspect) return bandFrame(cssW, cssH, insets);
  return FULL_FRAME;
}

export function sameFrame(a: Frame, b: Frame) {
  return a.kind === b.kind && a.width === b.width && a.height === b.height && Math.abs(a.zoom - b.zoom) < 1e-4 && Math.abs(a.deck - b.deck) < 0.5 && Math.abs(a.hud - b.hud) < 0.5 && a.safe.left === b.safe.left && a.safe.right === b.safe.right && a.safe.bottom === b.safe.bottom;
}
