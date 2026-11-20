import { H, OUR_TABLE, SLOTS, W, WALL_SPLAT, type SlotDef } from "./config";

export type LayoutKind = "landscape" | "portrait";

export type Frame = { kind: LayoutKind; width: number; height: number; top: number; drop: number; sceneBottom: number };

type Spot = { x: number; y: number };

const TABLE_W = 380;
const OUR_TABLE_BOTTOM = OUR_TABLE.y + 216;

export const PORTRAIT = { width: 940, drop: 350, top: 160, topMin: -28, bottomPad: 34, maxAspect: 1.8, gain: 1.06 };

export const LANDSCAPE_FRAME: Frame = { kind: "landscape", width: W, height: H, top: 0, drop: 0, sceneBottom: OUR_TABLE_BOTTOM };

export const SCENERY: Record<LayoutKind, { clock: Spot; bell: Spot; splat: Spot }> = {
  landscape: { clock: { x: 1490, y: 196 }, bell: { x: 1690, y: 150 }, splat: WALL_SPLAT },
  portrait: { clock: { x: 876, y: 214 }, bell: { x: 876, y: 300 }, splat: { x: 64, y: 752 } },
};

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

export function frameFor(parentWidth: number, parentHeight: number): Frame {
  if (parentWidth <= 0 || parentHeight <= 0) return LANDSCAPE_FRAME;
  const sceneBottom = OUR_TABLE_BOTTOM + PORTRAIT.drop;
  const minHeight = sceneBottom + PORTRAIT.bottomPad - PORTRAIT.top;
  const landscapeFit = Math.min(parentWidth / W, parentHeight / H);
  const portraitFit = Math.min(parentWidth / PORTRAIT.width, parentHeight / minHeight);
  if (portraitFit < landscapeFit * PORTRAIT.gain) return LANDSCAPE_FRAME;
  const wanted = Math.round((PORTRAIT.width * parentHeight) / parentWidth);
  const height = Math.min(Math.max(wanted, minHeight), Math.round(PORTRAIT.width * PORTRAIT.maxAspect));
  const top = PORTRAIT.top - Math.min(height - minHeight, PORTRAIT.top - PORTRAIT.topMin);
  return { kind: "portrait", width: PORTRAIT.width, height, top, drop: PORTRAIT.drop, sceneBottom };
}
