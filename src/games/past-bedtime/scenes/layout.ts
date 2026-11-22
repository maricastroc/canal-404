import type { Insets } from "../../kit/insets";
import type { Grid } from "../sim/grid";

export type FrameKind = "full" | "tall" | "band";

export type Rect = { x: number; y: number; w: number; h: number };

export type View = { x0: number; y0: number; x1: number; y1: number };

export type Frame = { kind: FrameKind; W: number; H: number; unit: number; safe: Insets; compact: boolean };

export type Hud = { paper: Rect; strip: Rect; note: Rect; deck: Rect; pad: Rect; actions: Rect; rails: Rect[] };

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
  tile: { min: 44, max: 96, cols: 6.4, share: 0.82, comfort: 58 },
  margin: 8,
  content: 520,
};

const TALL = { strip: 64, note: 60, deck: 184, compactStrip: 56, compactNote: 54, compactDeck: 162 };

const BAND = { rail: 0.22, minRail: 150, maxRail: 204 };

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

export function boardView(grid: Grid): View {
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
    x0: Math.max(0, minX - SIDE_PAD),
    y0: Math.max(0, minY - TOP_PAD),
    x1: Math.min(grid.w, maxX + 1 + SIDE_PAD),
    y1: Math.min(grid.h, maxY + 1 + BOTTOM_PAD),
  };
}

function placeBoard(map: Rect, view: View, tile: number) {
  const vw = view.x1 - view.x0;
  const vh = view.y1 - view.y0;
  const bw = Math.round(vw * tile);
  const bh = Math.round(vh * tile);
  const fitsX = bw <= map.w;
  const fitsY = bh <= map.h;
  const board: Rect = { x: fitsX ? Math.round(map.x + (map.w - bw) / 2) : map.x, y: fitsY ? Math.round(map.y + (map.h - bh) / 2) : map.y, w: bw, h: bh };
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
  const css = fit >= Math.min(roomy * t.share, t.comfort) ? Math.min(fit, t.max) : roomy;
  return Math.floor(css * unit);
}

function tallHud(frame: Frame): { hud: Hud; map: Rect } {
  const { W, H, unit: u, safe, compact } = frame;
  const stripH = (compact ? TALL.compactStrip : TALL.strip) * u;
  const noteH = (compact ? TALL.compactNote : TALL.note) * u;
  const deckH = (compact ? TALL.compactDeck : TALL.deck) * u + safe.bottom;
  const paperH = safe.top + stripH + noteH;
  const contentW = Math.min(W - safe.left - safe.right, PHONE.content * u);
  const cx = Math.round((W - contentW) / 2);
  const pad = 12 * u;
  const strip: Rect = { x: cx + pad, y: safe.top + 10 * u, w: contentW - pad * 2, h: stripH - 10 * u };
  const note: Rect = { x: cx + pad, y: safe.top + stripH, w: contentW - pad * 2, h: noteH - 8 * u };
  const deck: Rect = { x: 0, y: H - deckH, w: W, h: deckH };
  const innerTop = deck.y + (compact ? 10 : 12) * u;
  const innerH = deckH - safe.bottom - (compact ? 20 : 24) * u;
  const padSize = Math.min(innerH, (contentW - pad * 2) * 0.46);
  const padRect: Rect = { x: cx + pad, y: innerTop + (innerH - padSize) / 2, w: padSize, h: padSize };
  const gap = 16 * u;
  const actions: Rect = { x: padRect.x + padSize + gap, y: innerTop, w: contentW - pad * 2 - padSize - gap, h: innerH };
  const m = PHONE.margin * u;
  const map: Rect = { x: safe.left + m, y: paperH + m, w: W - safe.left - safe.right - m * 2, h: deck.y - paperH - m * 2 };
  return { hud: { paper: { x: 0, y: 0, w: W, h: paperH }, strip, note, deck, pad: padRect, actions, rails: [] }, map };
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
  const padSize = Math.min(innerW, H * 0.56);
  const padRect: Rect = { x: safe.left + pad + (innerW - padSize) / 2, y: bottom - padSize, w: padSize, h: padSize };
  const strip: Rect = { x: safe.left + pad, y: safe.top + 10 * u, w: innerW, h: padRect.y - safe.top - 22 * u };
  const actionsH = Math.min(H * 0.5, 156 * u);
  const actions: Rect = { x: right.x + pad, y: bottom - actionsH, w: innerW, h: actionsH };
  const note: Rect = { x: right.x + pad, y: safe.top + 12 * u, w: innerW, h: actions.y - safe.top - 26 * u };
  const m = PHONE.margin * u;
  const map: Rect = { x: left.w + m, y: safe.top + m, w: right.x - left.w - m * 2, h: H - safe.top - safe.bottom - m * 2 };
  return { hud: { paper: left, strip, note, deck: right, pad: padRect, actions, rails: [left, right] }, map };
}

export function computeLayout(frame: Frame, grid: Grid): Layout {
  if (frame.kind === "full") return fullLayout(grid);
  const { hud, map } = frame.kind === "tall" ? tallHud(frame) : bandHud(frame);
  const view = boardView(grid);
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
