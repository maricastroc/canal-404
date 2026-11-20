import { H, OUR_TABLE, SLOTS, W, type SlotDef } from "./config";

export type LayoutKind = "landscape" | "portrait";

export type Frame = { kind: LayoutKind; width: number; height: number; top: number; floor: number; drop: number; sceneBottom: number };

const TABLE_W = 380;
const OUR_TABLE_H = 216;

export const PORTRAIT = { width: 1380, drop: 240, dropMax: 380, topMin: 125, topMax: 240, buttonZone: 500, maxAspect: 1.72, gain: 1.06 };

export const LANDSCAPE_FRAME: Frame = { kind: "landscape", width: W, height: H, top: 0, floor: 0, drop: 0, sceneBottom: OUR_TABLE.y + OUR_TABLE_H };

export const SCENERY: Record<LayoutKind, { clock: { x: number; y: number }; bell: { x: number; y: number } }> = {
  landscape: { clock: { x: 1490, y: 196 }, bell: { x: 1690, y: 150 } },
  portrait: { clock: { x: 900, y: 200 }, bell: { x: 900, y: 296 } },
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
  const minHeight = PORTRAIT.topMin + LANDSCAPE_FRAME.sceneBottom + PORTRAIT.drop + PORTRAIT.buttonZone;
  const landscapeFit = Math.min(parentWidth / W, parentHeight / H);
  const portraitFit = Math.min(parentWidth / PORTRAIT.width, parentHeight / minHeight);
  if (portraitFit < landscapeFit * PORTRAIT.gain) return LANDSCAPE_FRAME;
  const wanted = Math.round((PORTRAIT.width * parentHeight) / parentWidth);
  const height = Math.min(Math.max(wanted, minHeight), Math.round(PORTRAIT.width * PORTRAIT.maxAspect));
  const extra = height - minHeight;
  const drop = PORTRAIT.drop + Math.round(Math.min(extra * 0.4, PORTRAIT.dropMax - PORTRAIT.drop));
  const top = PORTRAIT.topMin + Math.round(Math.min(extra * 0.15, PORTRAIT.topMax - PORTRAIT.topMin));
  return { kind: "portrait", width: PORTRAIT.width, height, top, floor: height - top - H, drop, sceneBottom: LANDSCAPE_FRAME.sceneBottom + drop };
}
