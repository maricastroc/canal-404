import type { Insets } from "../kit/insets";
import { FLOOR_Y, H, W } from "./config";

export type FrameKind = "full" | "tall" | "band";

export type Frame = {
  kind: FrameKind;
  width: number;
  height: number;
  unit: number;
  zoom: number;
  hud: number;
  deck: number;
  floor: number;
  ceiling: number;
  safe: Insets;
};

export const TALL = { width: 1080, widthPerCss: 2, maxWidth: 1600, hud: 54, deck: { share: 0.24, min: 128, max: 196 }, view: { perCss: 1.64, min: 560, max: 900, tighten: 0.88 }, play: { min: 620, max: 760 }, floor: { min: 70, max: 150 } };
export const BAND = { height: 1080, hud: 46, maxHeight: 520, minAspect: 1.6, view: 780, floor: 150 };

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const FULL_FRAME: Frame = { kind: "full", width: W, height: H, unit: 1, zoom: 1, hud: 0, deck: 0, floor: 0, ceiling: 0, safe: NO_INSETS };

function scaled(insets: Insets, unit: number): Insets {
  return { top: insets.top * unit, right: insets.right * unit, bottom: insets.bottom * unit, left: insets.left * unit };
}

function tallFrame(cssW: number, cssH: number, insets: Insets): Frame {
  const unit = Math.min(TALL.maxWidth, Math.max(TALL.width, cssW * TALL.widthPerCss)) / cssW;
  const hud = TALL.hud + insets.top;
  const deck = Math.min(TALL.deck.max, Math.max(TALL.deck.min, cssH * TALL.deck.share)) + insets.bottom;
  const play = Math.max(1, cssH - deck - hud);
  const view = Math.min(TALL.view.max, Math.max(TALL.view.min, cssW * TALL.view.perCss));
  let s = cssW / view;
  if (play / s < TALL.play.min) s = play / TALL.play.min;
  if (play / s > TALL.play.max) s = Math.min(cssW / (view * TALL.view.tighten), play / TALL.play.max);
  const extra = Math.max(0, play / s - TALL.play.max);
  const floor = TALL.floor.min + Math.min(extra, TALL.floor.max - TALL.floor.min);
  const ceiling = Math.max(0, play / s - FLOOR_Y - floor);
  return { kind: "tall", width: Math.round(cssW * unit), height: Math.round(cssH * unit), unit, zoom: s * unit, hud: hud * unit, deck: deck * unit, floor, ceiling, safe: scaled(insets, unit) };
}

function bandFrame(cssW: number, cssH: number, insets: Insets): Frame {
  const unit = BAND.height / cssH;
  const s = cssH / BAND.view;
  return { kind: "band", width: Math.round(cssW * unit), height: BAND.height, unit, zoom: s * unit, hud: (BAND.hud + insets.top) * unit, deck: 0, floor: BAND.floor, ceiling: 0, safe: scaled(insets, unit) };
}

export function frameFor(cssW: number, cssH: number, insets: Insets = NO_INSETS): Frame {
  if (cssW <= 0 || cssH <= 0) return FULL_FRAME;
  if (cssH >= cssW) return tallFrame(cssW, cssH, insets);
  if (cssH <= BAND.maxHeight && cssW / cssH >= BAND.minAspect) return bandFrame(cssW, cssH, insets);
  return FULL_FRAME;
}

export function sameFrame(a: Frame, b: Frame) {
  return (
    a.kind === b.kind &&
    a.width === b.width &&
    a.height === b.height &&
    Math.abs(a.zoom - b.zoom) < 1e-4 &&
    Math.abs(a.deck - b.deck) < 0.5 &&
    Math.abs(a.hud - b.hud) < 0.5 &&
    a.safe.left === b.safe.left &&
    a.safe.right === b.safe.right &&
    a.safe.bottom === b.safe.bottom
  );
}
