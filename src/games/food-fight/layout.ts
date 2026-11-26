import type { Insets } from "../kit/insets";
import { H, OUR_TABLE, SLOTS, TABLE_PROPS, W, WALL_SPLAT, type SlotDef } from "./config";

export type LayoutKind = "landscape" | "portrait";

export type DuckSpot = { x: number; y: number; r: number };

export type Frame = { kind: LayoutKind; width: number; height: number; top: number; drop: number; back: number; front: number; duck: DuckSpot | null };

type Spot = { x: number; y: number };

const TABLE_W = 380;
const OUR_TABLE_BOTTOM = OUR_TABLE.y + 216;

export const PORTRAIT = {
  width: 940,
  drop: 350,
  top: 160,
  tail: 34,
  maxAspect: 2.4,
  gain: 1.06,
  spread: { lift: 230, back: 40, front: 260, clear: 170 },
  duck: { radius: 40, margin: 18, gap: 24, min: 77, max: 138 },
};

export const LANDSCAPE_FRAME: Frame = { kind: "landscape", width: W, height: H, top: 0, drop: 0, back: 0, front: 0, duck: null };

export const SCENERY: Record<LayoutKind, { clock: Spot; bell: Spot; splat: Spot }> = {
  landscape: { clock: { x: 1490, y: 196 }, bell: { x: 1690, y: 150 }, splat: WALL_SPLAT },
  portrait: { clock: { x: 876, y: 214 }, bell: { x: 876, y: 300 }, splat: { x: 64, y: 752 } },
};

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

function tableSpan(pick: (slot: SlotDef) => number) {
  const edges = SLOTS.flatMap((slot) => {
    const half = (TABLE_W * (slot.row === "back" ? 0.7 : 0.95)) / 2;
    return [pick(slot) - half, pick(slot) + half];
  });
  return [Math.min(...edges), Math.max(...edges)];
}

const LANDSCAPE_SPAN = tableSpan((slot) => slot.x);
const PORTRAIT_SPAN = tableSpan((slot) => slot.portraitX);
const STRETCH = (PORTRAIT_SPAN[1] - PORTRAIT_SPAN[0]) / (LANDSCAPE_SPAN[1] - LANDSCAPE_SPAN[0]);
const SHIFT = PORTRAIT_SPAN[0] - STRETCH * LANDSCAPE_SPAN[0];

export function frameX(frame: Frame, landscapeX: number) {
  return frame.kind === "portrait" ? landscapeX * STRETCH + SHIFT : landscapeX;
}

export function landscapeX(frame: Frame, x: number) {
  return frame.kind === "portrait" ? (x - SHIFT) / STRETCH : x;
}

export function walkScale(frame: Frame) {
  return frame.kind === "portrait" ? STRETCH : 1;
}

function rowTop(row: SlotDef["row"]) {
  return Math.min(...SLOTS.filter((slot) => slot.row === row).map((slot) => slot.upY - 240 * slot.scale));
}

const BACK_TOP = rowTop("back");
const FRONT_TOP = rowTop("front");

export function rowShift(frame: Frame, slot: SlotDef) {
  return slot.row === "front" ? frame.front : frame.back;
}

export function landscapeY(frame: Frame, y: number) {
  const back = Math.min(frame.back, Math.max(0, y - BACK_TOP));
  const front = Math.min(frame.front - frame.back, Math.max(0, y - FRONT_TOP - frame.back));
  return y - back - front;
}

export function wallSplat(frame: Frame): Spot {
  const spot = SCENERY[frame.kind].splat;
  return frame.kind === "portrait" ? { x: spot.x, y: spot.y + frame.drop - PORTRAIT.drop } : spot;
}

export function frameFor(cssW: number, cssH: number, insets: Insets = NO_INSETS): Frame {
  if (cssW <= 0 || cssH <= 0) return LANDSCAPE_FRAME;
  const unit = PORTRAIT.width / cssW;
  const d = PORTRAIT.duck;
  const r = Math.min(d.max, Math.max(d.min, d.radius * unit));
  const margin = d.margin * unit;
  const safe = insets.bottom * unit;
  const tail = Math.max(PORTRAIT.tail, TABLE_PROPS.y + d.gap + 2 * r + margin - OUR_TABLE_BOTTOM) + safe;
  const minHeight = OUR_TABLE_BOTTOM + PORTRAIT.drop + tail - PORTRAIT.top;
  const landscapeFit = Math.min(cssW / W, cssH / H);
  const portraitFit = Math.min(cssW / PORTRAIT.width, cssH / minHeight);
  if (portraitFit < landscapeFit * PORTRAIT.gain) return LANDSCAPE_FRAME;
  const wanted = Math.round((PORTRAIT.width * cssH) / cssW);
  const height = Math.min(Math.max(wanted, minHeight), Math.round(PORTRAIT.width * PORTRAIT.maxAspect));
  const { lift, back, front, clear } = PORTRAIT.spread;
  const room = height - minHeight;
  const k = Math.min(1, room / (lift + front + clear));
  const spare = room - k * (lift + front + clear);
  const top = PORTRAIT.top - k * lift - spare / 2;
  const drop = PORTRAIT.drop + k * (front + clear);
  const bottom = top + height;
  const duck = { x: PORTRAIT.width - margin - r, y: bottom - safe - margin - r, r };
  return { kind: "portrait", width: PORTRAIT.width, height, top, drop, back: k * back, front: k * front, duck };
}
