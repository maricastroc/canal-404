import { FEET } from "./figure";

export type Orientation = "landscape" | "portrait";
export type Kind = Orientation | "phone" | "wide";
export type Shape = { kind: Kind; W: number; H: number };

export const CANVAS: Record<Orientation, { W: number; H: number }> = {
  landscape: { W: 1920, H: 1080 },
  portrait: { W: 1080, H: 1650 },
};

export type Box = { x: number; y: number; w: number; h: number };
export type Spot = { x: number; y: number; scale: number };
export type Frame = { x: number; y: number; rotation: number };
export type CrowdRow = { y: number; scale: number; xs: number[] };

export type StageLayout = {
  W: number;
  H: number;
  valance: number;
  truss: { y: number; xs: number[] } | null;
  spots: { x: number; y: number }[];
  sign: { cx: number; cy: number; w: number; h: number } | null;
  riser: { x0: number; x1: number; top: number; front: number; tall: boolean };
  stage: { top: number; front: number };
  jury: { xs: number[]; deskTop: number; deskBottom: number; x0: number; x1: number; scale: number };
  host: Spot;
  performer: Spot & { podium: number };
  backline: { xs: number[]; y: number; scale: number; packed?: boolean };
  nameTag: { y: number };
  amp: Spot;
};

export type Layout = StageLayout & {
  kind: Kind;
  art: { key: string; desk: string; x: number; y: number; k: number; sides: number; valance: boolean };
  title: { x: number; y: number; size: number };
  live: { x: number; y: number; size: number };
  score: { x: number; y: number; size: number };
  crowd: CrowdRow[];
  lane: { housing: Box; track: Box; hitX: number; pxPerBeat: number; r: number; frame: Frame; vertical: boolean };
  readout: { x: number; y: number; max: number };
  talk: { top: number; bottom: number; lanes: [number, number] | null };
  hint: { x: number; y: number } | null;
  meter: Box;
  streak: { x: number; y: number };
  progress: Box;
  card: { cx: number; top: number; w: number; maxH: number };
  text: { mark: number; label: number; bubble: number; cardTitle: number; cardBody: number; cardSmall: number; tag: number; demoTag: number };
};

export const DESK_LIP = 34;

const PHONE_STAGE_H = 790;
const STAGE_FIT_TOP = 152;
const JURY_TOP = 165;
const CAST_BOOST = 0.5;
const CAST_OVERLAP = 28;

export function shapeFor(width: number, height: number, coarse: boolean): Shape {
  const ratio = height / Math.max(1, width);
  if (ratio >= 1.25 && width < 620) return { kind: "phone", W: 1080, H: Math.round(Math.min(2400, 1080 * ratio) / 2) * 2 };
  if (ratio > 1.15 && width < 900) return { kind: "portrait", ...CANVAS.portrait };
  if (height < 520 && (coarse || height < 460)) return { kind: "wide", W: Math.round(Math.max(1920, Math.min(2600, (1080 * width) / Math.max(1, height))) / 2) * 2, H: 1080 };
  return { kind: "landscape", ...CANVAS.landscape };
}

export function sameShape(a: Shape, b: Shape) {
  return a.kind === b.kind && Math.abs(a.W - b.W) < a.W * 0.03 && Math.abs(a.H - b.H) < a.H * 0.03;
}

export function phoneStage(): StageLayout {
  const W = 1080;
  const deskScale = 0.74;
  return {
    W,
    H: PHONE_STAGE_H,
    valance: 52,
    truss: null,
    spots: [
      { x: 60, y: 150 },
      { x: W - 60, y: 150 },
    ],
    sign: null,
    riser: { x0: 96, x1: W - 96, top: 398, front: 650, tall: true },
    stage: { top: 650, front: PHONE_STAGE_H },
    jury: { xs: [540 - 268 * deskScale, 540, 540 + 268 * deskScale], deskTop: 292, deskBottom: 398, x0: 540 - 412 * deskScale, x1: 540 + 412 * deskScale, scale: 0.84 * deskScale },
    host: { x: 118, y: 770, scale: 0.66 },
    performer: { x: 540, y: 748, scale: 0.82, podium: 132 },
    backline: { xs: [258, 396, 684, 822], y: 680, scale: 0.6, packed: true },
    nameTag: { y: 772 },
    amp: { x: 956, y: 766, scale: 0.46 },
  };
}

function placed(stage: StageLayout, x: number, y: number, k: number): StageLayout {
  const px = (v: number) => x + v * k;
  const py = (v: number) => y + v * k;
  const { jury, riser, performer, host, backline, amp } = stage;
  return {
    ...stage,
    spots: stage.spots.map((s) => ({ x: px(s.x), y: py(s.y) })),
    truss: stage.truss ? { y: py(stage.truss.y), xs: stage.truss.xs.map(px) } : null,
    sign: stage.sign ? { cx: px(stage.sign.cx), cy: py(stage.sign.cy), w: stage.sign.w * k, h: stage.sign.h * k } : null,
    riser: { ...riser, x0: px(riser.x0), x1: px(riser.x1), top: py(riser.top), front: py(riser.front) },
    stage: { top: py(stage.stage.top), front: py(stage.stage.front) },
    jury: { xs: jury.xs.map(px), deskTop: py(jury.deskTop), deskBottom: py(jury.deskBottom), x0: px(jury.x0), x1: px(jury.x1), scale: jury.scale * k },
    host: { x: px(host.x), y: py(host.y), scale: host.scale * k },
    performer: { x: px(performer.x), y: py(performer.y), scale: performer.scale * k, podium: performer.podium * k },
    backline: { ...backline, xs: backline.xs.map(px), y: py(backline.y), scale: backline.scale * k },
    nameTag: { y: py(stage.nameTag.y) },
    amp: { x: px(amp.x), y: py(amp.y), scale: amp.scale * k },
  };
}

function cast(base: StageLayout, stage: StageLayout, k: number): StageLayout {
  if (k >= 1) return stage;
  const c = Math.min(k + (1 - k) * CAST_BOOST, k + CAST_OVERLAP / (FEET * base.performer.scale));
  const spread = (x: number) => base.W / 2 + (x - base.W / 2) * c;
  const { host, performer, backline } = stage;
  return {
    ...stage,
    host: { x: spread(base.host.x), y: host.y, scale: base.host.scale * c },
    performer: { ...performer, scale: base.performer.scale * c },
    backline: { ...backline, xs: base.backline.xs.map(spread), y: backline.y + (c - k) * FEET * base.backline.scale, scale: base.backline.scale * c },
  };
}

function centeredRow(y: number, scale: number, count: number, gap: number, W: number): CrowdRow {
  return { y, scale, xs: Array.from({ length: count }, (_, i) => W / 2 + (i - (count - 1) / 2) * gap) };
}

const IDENTITY: Frame = { x: 0, y: 0, rotation: 0 };

function phoneLayout(H: number): Layout {
  const W = 1080;
  const r = Math.round(Math.max(56, Math.min(64, H * 0.029)));
  const minPpb = 4 * r + 24;
  const bottom = H - 34;
  const hitY = H - Math.round(Math.max(240, Math.min(360, H * 0.155)));
  const laneMin = 3.4 * minPpb;
  const k = Math.max(0.56, Math.min(1, (hitY - laneMin - 14) / PHONE_STAGE_H));
  const oy = Math.round(Math.max(0, STAGE_FIT_TOP - JURY_TOP * k) + 36 * Math.max(0, (k - 0.56) / 0.44));
  const ox = (W - W * k) / 2;
  const base = phoneStage();
  const stage = cast(base, placed(base, ox, oy, k), k);
  const laneTop = stage.stage.front + 14;
  const laneW = Math.round(2.6 * r + 2 * 58 + 36);
  const left = Math.round((W - laneW) / 2);
  const len = bottom - laneTop;
  const housing = { x: 0, y: 0, w: len, h: laneW };
  const track = { x: 18, y: 18, w: len - 36, h: laneW - 36 };
  const hitX = bottom - hitY;
  const pxPerBeat = Math.round(Math.max(minPpb, Math.min(310, (hitY - laneTop - 30) / 3.8)));
  const flank = left;
  const right = left + laneW;
  const crowd: CrowdRow[] = [];
  for (let y = H + 30, row = 0; y > laneTop + 230; row += 1) {
    const scale = Math.max(0.7, 1.04 - row * 0.05);
    const gap = 112 * scale;
    const inset = 18 + (row % 2) * 34;
    const xs: number[] = [];
    for (let x = inset + 56 * scale; x < flank - 50 * scale; x += gap) xs.push(Math.round(x));
    for (let x = W - inset - 56 * scale; x > right + 50 * scale; x -= gap) xs.push(Math.round(x));
    crowd.push({ y, scale, xs });
    y -= Math.round(118 * scale);
  }
  return {
    ...stage,
    kind: "phone",
    W,
    H,
    art: { key: "studio-phone", desk: "jury-desk-portrait", x: ox, y: oy, k, sides: ox, valance: true },
    title: { x: 40, y: 92, size: 46 },
    live: { x: W - 40, y: 92, size: 32 },
    score: { x: W - 44, y: 156, size: 44 },
    crowd: crowd.reverse(),
    lane: { housing, track, hitX, pxPerBeat, r, frame: { x: left, y: bottom, rotation: -Math.PI / 2 }, vertical: true },
    readout: { x: right + 22, y: hitY - Math.round(r * 1.2), max: W - right - 40 },
    talk: { top: laneTop + 110, bottom: hitY - 200, lanes: [left - 14, right + 14] },
    hint: { x: W / 2, y: bottom - 56 },
    meter: { x: 28, y: laneTop + 30, w: flank - 56, h: 46 },
    streak: { x: 32, y: hitY },
    progress: { x: right + 30, y: laneTop + 53, w: W - right - 58, h: 12 },
    card: { cx: W / 2, top: Math.max(120, oy + 40), w: W - 48, maxH: H - Math.max(120, oy + 40) - 60 },
    text: { mark: 54, label: 34, bubble: 42, cardTitle: 74, cardBody: 40, cardSmall: 33, tag: 32, demoTag: 26 },
  };
}

function wideLayout(W: number): Layout {
  const H = 1080;
  const base = landscapeLayout();
  const k = 0.9;
  const ox = (W - 1920 * k) / 2;
  const oy = 34;
  const stage = placed(base, ox, oy, k);
  const housing = { x: 24, y: 690, w: W - 48, h: H - 690 - 18 };
  const track = { x: housing.x + 18, y: housing.y + 18, w: housing.w - 36, h: housing.h - 36 };
  const crowdCount = Math.floor((W - 160) / 124);
  return {
    ...stage,
    kind: "wide",
    W,
    H,
    art: { key: "studio-landscape", desk: "jury-desk-landscape", x: ox, y: oy, k, sides: ox, valance: true },
    title: { x: 56, y: 82, size: 52 },
    live: { x: W - 56, y: 82, size: 34 },
    score: { x: W - 60, y: 148, size: 46 },
    crowd: [centeredRow(housing.y + 54, 0.74, crowdCount, 124, W)],
    lane: { housing, track, hitX: 330, pxPerBeat: 380, r: 66, frame: IDENTITY, vertical: false },
    readout: { x: 264, y: housing.y - 74, max: 320 },
    talk: { top: stage.stage.top - 60, bottom: housing.y - 64, lanes: null },
    hint: { x: W / 2, y: housing.y - 40 },
    meter: { x: W - 560, y: housing.y - 26, w: 500, h: 50 },
    streak: { x: 52, y: housing.y },
    progress: { x: track.x + 40, y: track.y + track.h - 18, w: track.w - 80, h: 12 },
    card: { cx: W / 2, top: 40, w: Math.min(W - 120, 1640), maxH: H - 80 },
    text: { mark: 64, label: 36, bubble: 46, cardTitle: 80, cardBody: 42, cardSmall: 34, tag: 36, demoTag: 24 },
  };
}

function landscapeLayout(): Layout {
  const { W, H } = CANVAS.landscape;
  const housing = { x: 28, y: 734, w: W - 56, h: 244 };
  const track = { x: housing.x + 18, y: housing.y + 18, w: housing.w - 36, h: housing.h - 36 };
  return {
    kind: "landscape",
    W,
    H,
    art: { key: "studio-landscape", desk: "jury-desk-landscape", x: 0, y: 0, k: 1, sides: 0, valance: false },
    title: { x: 56, y: 74, size: 46 },
    live: { x: W - 56, y: 74, size: 30 },
    score: { x: W - 60, y: 134, size: 38 },
    valance: 44,
    truss: { y: 134, xs: [330, 560, 990, 1380, 1560, 1740] },
    spots: [
      { x: 560, y: 196 },
      { x: 990, y: 196 },
    ],
    sign: { cx: 775, cy: 246, w: 360, h: 124 },
    riser: { x0: 352, x1: 1836, top: 544, front: 626, tall: false },
    stage: { top: 626, front: 718 },
    jury: { xs: [1366, 1544, 1722], deskTop: 406, deskBottom: 540, x0: 1262, x1: 1824, scale: 0.72 },
    host: { x: 168, y: 702, scale: 0.9 },
    performer: { x: 775, y: 694, scale: 0.84, podium: 168 },
    backline: { xs: [468, 610, 940, 1082], y: 540, scale: 0.46 },
    nameTag: { y: 722 },
    amp: { x: 1290, y: 698, scale: 0.7 },
    crowd: [centeredRow(1104, 0.88, 17, 114, W)],
    lane: { housing, track, hitX: 300, pxPerBeat: 340, r: 46, frame: IDENTITY, vertical: false },
    readout: { x: 262, y: housing.y - 68, max: 320 },
    talk: { top: housing.y + housing.h + 10, bottom: H - 8, lanes: null },
    hint: null,
    meter: { x: W - 500, y: housing.y - 22, w: 440, h: 42 },
    streak: { x: 52, y: housing.y },
    progress: { x: track.x + 40, y: track.y + track.h - 18, w: track.w - 80, h: 10 },
    card: { cx: W / 2, top: 112, w: 1000, maxH: 600 },
    text: { mark: 54, label: 26, bubble: 34, cardTitle: 64, cardBody: 31, cardSmall: 25, tag: 28, demoTag: 20 },
  };
}

function portraitLayout(): Layout {
  const { W, H } = CANVAS.portrait;
  const housing = { x: 20, y: 968, w: W - 40, h: 330 };
  const track = { x: housing.x + 18, y: housing.y + 18, w: housing.w - 36, h: housing.h - 36 };
  return {
    kind: "portrait",
    W,
    H,
    art: { key: "studio-portrait", desk: "jury-desk-portrait", x: 0, y: 0, k: 1, sides: 0, valance: false },
    title: { x: 40, y: 92, size: 44 },
    live: { x: W - 40, y: 92, size: 30 },
    score: { x: W - 44, y: 152, size: 38 },
    valance: 52,
    truss: null,
    spots: [
      { x: 60, y: 150 },
      { x: W - 60, y: 150 },
    ],
    sign: null,
    riser: { x0: 96, x1: W - 96, top: 560, front: 846, tall: true },
    stage: { top: 846, front: 946 },
    jury: { xs: [272, 540, 808], deskTop: 436, deskBottom: 556, x0: 128, x1: W - 128, scale: 0.84 },
    host: { x: 104, y: 932, scale: 0.6 },
    performer: { x: 560, y: 918, scale: 0.72, podium: 132 },
    backline: { xs: [300, 420, 712, 840], y: 876, scale: 0.44 },
    nameTag: { y: 950 },
    amp: { x: 958, y: 926, scale: 0.5 },
    crowd: [centeredRow(1480, 1, 9, 122, W), centeredRow(1610, 1.12, 8, 140, W), centeredRow(1736, 1.26, 7, 160, W)],
    lane: { housing, track, hitX: 196, pxPerBeat: 272, r: 56, frame: IDENTITY, vertical: false },
    readout: { x: 186, y: housing.y - 68, max: 230 },
    talk: { top: housing.y + housing.h + 10, bottom: H - 8, lanes: null },
    hint: null,
    meter: { x: W - 470, y: housing.y + housing.h - 18, w: 430, h: 42 },
    streak: { x: 44, y: housing.y + housing.h },
    progress: { x: track.x + 40, y: track.y + track.h - 20, w: track.w - 80, h: 10 },
    card: { cx: W / 2, top: 196, w: W - 56, maxH: 712 },
    text: { mark: 58, label: 28, bubble: 36, cardTitle: 64, cardBody: 33, cardSmall: 28, tag: 30, demoTag: 20 },
  };
}

export function layoutFor(kind: Kind, W?: number, H?: number): Layout {
  if (kind === "phone") return phoneLayout(H ?? 2160);
  if (kind === "wide") return wideLayout(W ?? 2340);
  if (kind === "portrait") return portraitLayout();
  return landscapeLayout();
}

export function toWorld(frame: Frame, x: number, y: number) {
  if (frame.rotation === 0) return { x: frame.x + x, y: frame.y + y };
  return { x: frame.x + y, y: frame.y - x };
}
