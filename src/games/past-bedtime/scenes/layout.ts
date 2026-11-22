import type { Insets } from "../../kit/insets";
import type { Grid } from "../sim/grid";

export type FrameKind = "full" | "tall" | "band";

export type Rect = { x: number; y: number; w: number; h: number };

export type View = { x0: number; y0: number; x1: number; y1: number };

export type Frame = { kind: FrameKind; W: number; H: number; unit: number; safe: Insets; compact: boolean };

export type Hud = { paper: Rect; strip: Rect; note: Rect; deck: Rect; pad: Rect; actions: Rect; sheet: Rect; rails: Rect[]; compact: boolean };

export type Layout = {
  kind: FrameKind;
  W: number;
  H: number;
  map: Rect;
  board: Rect;
  frame: Rect;
  scroll: boolean;
  overview: number;
  view: View;
  tile: number;
  ox: number;
  oy: number;
  notebook: Rect;
  unit: number;
  ui: number;
  text: number;
  small: number;
  hud: Hud | null;
};

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const FULL_FRAME: Frame = { kind: "full", W: 1920, H: 1080, unit: 1, safe: NO_INSETS, compact: false };

const SIDE_PAD = 0.2;
const PHONE_SIDE_PAD = 0.08;
const TOP_PAD = 1;
const BOTTOM_PAD = 0.3;
const MAX_TILE = 200;
const MIN_TILE = 164;

const PHONE = {
  pixels: 2_400_000,
  maxUnit: 3,
  minUnit: 1.25,
  tallRatio: 1.1,
  bandBelow: 540,
  compactBelow: 640,
  ui: 0.55,
  text: 14.5,
  small: 11.5,
  tile: { min: 44, max: 96, cols: 5.8, share: 0.83, comfort: 60, floor: 46, gain: 1.15 },
  margin: 6,
  content: 520,
};

const TALL = {
  strip: 48,
  note: 48,
  below: 6,
  pad: 144,
  actions: 148,
  deckPad: 10,
  gap: 8,
  side: 12,
  compact: { strip: 44, note: 44, below: 5, pad: 130, actions: 136, deckPad: 8 },
};

const BAND = { rail: 0.22, minRail: 150, maxRail: 204, pad: 0.9, padShare: 0.5 };

export function frameFor(cssW: number, cssH: number, insets: Insets = NO_INSETS, touch = false): Frame {
  if (cssW <= 0 || cssH <= 0) return FULL_FRAME;
  const tall = cssH >= cssW * PHONE.tallRatio;
  const band = !tall && touch && cssW > cssH && cssH < PHONE.bandBelow;
  if (!tall && !band) return FULL_FRAME;
  const unit = Math.min(PHONE.maxUnit, Math.max(PHONE.minUnit, Math.sqrt(PHONE.pixels / (cssW * cssH))));
  const W = Math.round(cssW * unit);
  const H = Math.round(cssH * unit);
  const safe = { top: insets.top * unit, right: insets.right * unit, bottom: insets.bottom * unit, left: insets.left * unit };
  return { kind: tall ? "tall" : "band", W, H, unit, safe, compact: cssH < (tall ? PHONE.compactBelow : 360) };
}

export function sameFrame(a: Frame, b: Frame) {
  return a.kind === b.kind && a.W === b.W && a.H === b.H && Math.abs(a.safe.bottom - b.safe.bottom) < 1 && Math.abs(a.safe.left - b.safe.left) < 1 && Math.abs(a.safe.right - b.safe.right) < 1 && Math.abs(a.safe.top - b.safe.top) < 1;
}

export function boardView(grid: Grid, side = SIDE_PAD): View {
  let minX = grid.w;
  let minY = grid.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (grid.tiles[y * grid.w + x] === "#") continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return {
    x0: Math.max(0, minX - side),
    y0: Math.max(0, minY - TOP_PAD),
    x1: Math.min(grid.w, maxX + 1 + side),
    y1: Math.min(grid.h, maxY + 1 + BOTTOM_PAD),
  };
}

function placeBoard(map: Rect, view: View, tile: number, top = false) {
  const vw = view.x1 - view.x0;
  const vh = view.y1 - view.y0;
  const bw = Math.round(vw * tile);
  const bh = Math.round(vh * tile);
  const fitsX = bw <= map.w;
  const fitsY = bh <= map.h;
  const board: Rect = { x: fitsX ? Math.round(map.x + (map.w - bw) / 2) : map.x, y: fitsY && !top ? Math.round(map.y + (map.h - bh) / 2) : map.y, w: bw, h: bh };
  const frame: Rect = { x: board.x, y: board.y, w: Math.min(bw, map.w), h: Math.min(bh, map.h) };
  const scroll = !fitsX || !fitsY;
  const overview = Math.min(1, frame.w / bw, frame.h / bh);
  const ox = Math.round(board.x - view.x0 * tile);
  const oy = Math.round(board.y - view.y0 * tile);
  return { board, frame, scroll, overview, ox, oy };
}

function fullLayout(grid: Grid): Layout {
  const { W, H } = FULL_FRAME;
  const map: Rect = { x: 12, y: 12, w: 1404, h: 1056 };
  const notebook: Rect = { x: 1428, y: 12, w: 480, h: 1056 };
  const view = boardView(grid);
  const vw = view.x1 - view.x0;
  const vh = view.y1 - view.y0;
  const fit = Math.min(map.w / vw, map.h / vh);
  const tile = Math.floor(Math.min(MAX_TILE, Math.max(fit, MIN_TILE)));
  return { kind: "full", W, H, map, view, tile, notebook, unit: 1, ui: 1, text: 0, small: 0, hud: null, ...placeBoard(map, view, tile) };
}

function phoneTile(map: Rect, view: View, unit: number) {
  const t = PHONE.tile;
  const vw = view.x1 - view.x0;
  const vh = view.y1 - view.y0;
  const wCss = map.w / unit;
  const hCss = map.h / unit;
  const fit = Math.min(wCss / vw, hCss / vh);
  const roomy = Math.max(t.min, Math.min(t.max, hCss / vh, wCss / t.cols));
  const whole = fit >= t.comfort || (fit >= roomy * t.share && (fit >= t.floor || roomy < fit * t.gain));
  const css = whole ? Math.min(fit, t.max) : roomy;
  return Math.floor(css * unit);
}

function tallLayout(frame: Frame, grid: Grid): Layout {
  const { W, H, unit: u, safe, compact } = frame;
  const t = compact ? { ...TALL, ...TALL.compact } : TALL;
  const stripH = t.strip * u;
  const noteH = t.note * u;
  const paperH = safe.top + stripH + noteH + t.below * u;
  const contentW = Math.min(W - safe.left - safe.right, PHONE.content * u);
  const cx = Math.round((W - contentW) / 2);
  const side = t.side * u;
  const inner = contentW - side * 2;
  const padSize = Math.min(t.pad * u, inner * 0.42);
  const actionsH = t.actions * u;
  const controlsH = Math.max(padSize, actionsH);
  const deckPad = t.deckPad * u;
  const mx = PHONE.margin * u;
  const my = t.gap * u;
  const room: Rect = { x: safe.left + mx, y: paperH + my, w: W - safe.left - safe.right - mx * 2, h: H - safe.bottom - deckPad * 2 - controlsH - my * 2 - paperH };
  const view = boardView(grid, PHONE_SIDE_PAD);
  const tile = phoneTile(room, view, u);
  const placed = placeBoard(room, view, tile, true);
  const deckY = placed.frame.y + placed.frame.h + my;
  const controlsY = H - safe.bottom - deckPad - controlsH;
  const strip: Rect = { x: cx + side, y: safe.top + 9 * u, w: inner, h: stripH - 9 * u };
  const note: Rect = { x: cx + side, y: safe.top + stripH, w: inner, h: noteH };
  const pad: Rect = { x: cx + side, y: controlsY + (controlsH - padSize) / 2, w: padSize, h: padSize };
  const gap = 16 * u;
  const actions: Rect = { x: pad.x + padSize + gap, y: controlsY + (controlsH - actionsH) / 2, w: inner - padSize - gap, h: actionsH };
  const map: Rect = { x: room.x, y: room.y, w: room.w, h: placed.frame.h };
  const sheet: Rect = { x: room.x, y: room.y, w: room.w, h: controlsY - my - room.y };
  const hud: Hud = { paper: { x: 0, y: 0, w: W, h: paperH }, strip, note, deck: { x: 0, y: deckY, w: W, h: H - deckY }, pad, actions, sheet, rails: [], compact };
  return { kind: "tall", W, H, map, view, tile, notebook: hud.paper, unit: u, ui: PHONE.ui * u, text: PHONE.text * u, small: PHONE.small * u, hud, ...placed };
}

function bandHud(frame: Frame): { hud: Hud; map: Rect } {
  const { W, H, unit: u, safe } = frame;
  const cssW = W / u;
  const railCss = Math.max(BAND.minRail, Math.min(BAND.maxRail, cssW * BAND.rail));
  const rail = railCss * u;
  const pad = 10 * u;
  const left: Rect = { x: 0, y: 0, w: safe.left + rail, h: H };
  const right: Rect = { x: W - safe.right - rail, y: 0, w: safe.right + rail, h: H };
  const innerW = rail - pad * 2;
  const bottom = H - safe.bottom - pad;
  const padSize = Math.min(innerW * BAND.pad, H * BAND.padShare);
  const padRect: Rect = { x: safe.left + pad + (innerW - padSize) / 2, y: bottom - padSize, w: padSize, h: padSize };
  const strip: Rect = { x: safe.left + pad, y: safe.top + 10 * u, w: innerW, h: padRect.y - safe.top - 22 * u };
  const actionsH = Math.min(H * 0.5, 156 * u);
  const actions: Rect = { x: right.x + pad, y: bottom - actionsH, w: innerW, h: actionsH };
  const note: Rect = { x: right.x + pad, y: safe.top + 12 * u, w: innerW, h: actions.y - safe.top - 26 * u };
  const m = PHONE.margin * u;
  const map: Rect = { x: left.w + m, y: safe.top + m, w: right.x - left.w - m * 2, h: H - safe.top - safe.bottom - m * 2 };
  return { hud: { paper: left, strip, note, deck: right, pad: padRect, actions, sheet: map, rails: [left, right], compact: false }, map };
}

export function computeLayout(frame: Frame, grid: Grid): Layout {
  if (frame.kind === "full") return fullLayout(grid);
  if (frame.kind === "tall") return tallLayout(frame, grid);
  const { hud, map } = bandHud(frame);
  const view = boardView(grid, PHONE_SIDE_PAD);
  const u = frame.unit;
  const tile = phoneTile(map, view, u);
  return { kind: frame.kind, W: frame.W, H: frame.H, map, view, tile, notebook: hud.paper, unit: u, ui: PHONE.ui * u, text: PHONE.text * u, small: PHONE.small * u, hud, ...placeBoard(map, view, tile) };
}

export function tileCenter(layout: Layout, x: number, y: number) {
  return { x: layout.ox + (x + 0.5) * layout.tile, y: layout.oy + (y + 0.5) * layout.tile };
}

export function wobble(seed: number) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
